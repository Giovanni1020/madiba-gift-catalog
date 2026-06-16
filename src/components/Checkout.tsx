import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { extrasTotal, basePrice } from "../data/products";
import { CheckoutForm } from "../hooks/useCheckoutForm";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "./checkoutMessage";
import { track } from "../lib/analytics/metaPixel";
import { STORE_PHONE } from "../config";
import "./Checkout.css";

// ─── Helpers puros de EXIBIÇÃO (máscara/moeda) ─────────────────────────────────
// O saneamento (dígitos, DDI) vive no useCheckoutForm; aqui é só formatar a view.

function formatTelefone(d: string): string {
  const x = d.slice(0, 11);
  if (x.length <= 2) return x;
  if (x.length <= 6) return `(${x.slice(0, 2)}) ${x.slice(2)}`;
  if (x.length <= 10)
    return `(${x.slice(0, 2)}) ${x.slice(2, 6)}-${x.slice(6)}`;
  return `(${x.slice(0, 2)}) ${x.slice(2, 7)}-${x.slice(7)}`;
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Janelas de entrega: 1 em 1 hora, das 8h às 18h (8h às 9h … 17h às 18h).
const HORARIOS = Array.from({ length: 10 }, (_, i) => `${8 + i}h às ${9 + i}h`);

// "Modo inválido": horários que aparecem na lista, mas NÃO podem ser escolhidos
// em datas específicas (data ISO yyyy-mm-dd → conjunto de horários bloqueados).
// Separado por tipo: entrega e retirada têm restrições independentes.
const HORARIOS_INVALIDOS: Record<
  "entrega" | "retirada",
  Record<string, string[]>
> = {
  // Ex.: loja sem disponibilidade no começo do dia em 12/06/2026 (só entrega).
  entrega: {},
  // Retirada mantém a lógica, mas sem horários inválidos por enquanto.
  retirada: {},
};

// Horário está bloqueado para esse tipo, nessa data?
function horarioInvalido(
  tipo: "entrega" | "retirada",
  dataIso: string,
  horario: string,
): boolean {
  return (HORARIOS_INVALIDOS[tipo][dataIso] ?? []).includes(horario);
}

// Data em ISO local (yyyy-mm-dd) — sem usar toISOString (que converte p/ UTC e
// pode "voltar um dia" perto da meia-noite). offsetDias=0 → hoje; 30 → daqui a 30 dias.
function isoLocalDate(offsetDias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Antecedência mínima de 1h30 para o DIA DE HOJE: um horário cujo início esteja a
// menos de 1h30 do agora não pode ser escolhido (ex.: às 8h, a janela "9h às 10h"
// já saiu; às 13h, "9h às 10h" idem). Em datas futuras não há corte por hora.
const ANTECEDENCIA_MIN_MS = 90 * 60 * 1000;

function horarioCedoDemais(dataIso: string, horario: string): boolean {
  if (dataIso !== isoLocalDate(0)) return false; // só corta quando a data é hoje
  const inicioHora = parseInt(horario, 10); // "9h às 10h" → 9
  if (Number.isNaN(inicioHora)) return false;
  const inicioSlot = new Date();
  inicioSlot.setHours(inicioHora, 0, 0, 0);
  return inicioSlot.getTime() - Date.now() < ANTECEDENCIA_MIN_MS;
}

// Bloqueio efetivo = restrição predefinida da data OU antecedência mínima de hoje.
// Ponto único de verdade, usado na lista e no efeito que limpa a seleção.
function horarioBloqueado(
  tipo: "entrega" | "retirada",
  dataIso: string,
  horario: string,
): boolean {
  return (
    horarioInvalido(tipo, dataIso, horario) ||
    horarioCedoDemais(dataIso, horario)
  );
}

// ISO (yyyy-mm-dd) → dd/mm/aaaa, só pra exibir na mensagem de validação.
function brDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// A loja não entrega/retira aos domingos. O <input type="date"> não desabilita
// dias da semana, então bloqueamos no onChange (mensagem PT-BR + limpa a data).
// Parse manual pra evitar o UTC do new Date("yyyy-mm-dd") (getDay erraria o dia).
function isDomingo(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return false;
  return new Date(y, m - 1, d).getDay() === 0; // 0 = domingo
}

interface CheckoutProps {
  form: CheckoutForm;
  onClose: () => void;
  onSent: () => void; // pedido enviado: o pai volta pro catálogo (mantém carrinho)
}

export default function Checkout({ form, onClose, onSent }: CheckoutProps) {
  const { items, totalCount, totalPrice } = useCart();
  const { showToast } = useToast();

  // Domingo selecionado? Derivado da data (persiste no re-render) — usado pra
  // marcar o campo (borda vermelha) e mostrar a mensagem fixa abaixo dele.
  const dataEhDomingo = isDomingo(form.data);

  // Janela de escolha do dia: de hoje até 30 dias à frente.
  const [minData] = useState(() => isoLocalDate(0));
  const [maxData] = useState(() => isoLocalDate(30));

  // InitiateCheckout (funil): uma vez, ao entrar na tela de checkout.
  // Snapshot do total no momento da montagem (deps vazias de propósito).
  useEffect(() => {
    track("InitiateCheckout", {
      value: totalPrice / 100,
      currency: "BRL",
      num_items: totalCount,
    });
  }, []);

  // Setinha "há mais abaixo" quando o conteúdo passa da tela (mobile c/ entrega).
  const [maisAbaixo, setMaisAbaixo] = useState(false);
  useEffect(() => {
    const check = () => {
      const doc = document.documentElement;
      setMaisAbaixo(
        doc.scrollHeight - window.scrollY - window.innerHeight > 24,
      );
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
    // re-checa quando a altura muda (itens add/remove, toggle entrega/retirada)
  }, [items.length, form.tipo]);

  // Se o horário já escolhido virar inválido ao trocar a data, limpa a seleção
  // (o usuário escolhe outro). A option segue na lista, só não selecionável.
  useEffect(() => {
    if (form.horario && horarioBloqueado(form.tipo, form.data, form.horario)) {
      form.setHorario("");
    }
  }, [form.tipo, form.data, form.horario, form.setHorario]);

  // Troca de data compartilhada por entrega e retirada. Mantemos a data escolhida
  // no campo (o input nativo é tudo-ou-nada: limpar pra "tirar só o dia" zeraria
  // mês/ano também). Se for domingo, marcamos o campo como inválido — a mensagem
  // PT-BR sai pelo onInvalid (que sabe o tipo) e o reportValidity mostra o balão.
  // Enquanto inválido, o <form> não envia (validação nativa barra o submit).
  function handleDataChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const valor = input.value;
    form.setData(valor);
    if (isDomingo(valor)) {
      input.setCustomValidity("domingo"); // texto real vem do onInvalid
      input.reportValidity();
    } else {
      input.setCustomValidity("");
    }
  }

  function handleSubmit() {
    const r = form.build();
    if (!r) return;
    const msg = buildWhatsAppMessage({
      itens: items,
      total: totalPrice,
      cliente: r.cliente,
      entrega: r.entrega,
      pagamento: r.pagamento,
    });
    window.open(buildWhatsAppUrl(STORE_PHONE, msg), "_blank");
    // Lead (funil): fim do funil possível no site — a venda fecha no WhatsApp.
    track("Lead", {
      value: totalPrice / 100,
      currency: "BRL",
      num_items: totalCount,
    });
    // A aba do WhatsApp pode abrir em background/demorar: reforça o próximo passo
    // ao voltar pro catálogo. Duração maior por ser uma instrução, não só "ok".
    showToast(
      "Pedido enviado! Prossiga no WhatsApp para confirmar com a loja.",
      7000,
    );
    onSent();
  }

  return (
    <section className="checkout" role="dialog" aria-label="Finalizar pedido">
      <header className="checkout__header">
        <button
          className="checkout__back"
          onClick={onClose}
          aria-label="Voltar ao catálogo"
        >
          ‹ Voltar
        </button>
        <h2 className="checkout__title">Finalizar pedido</h2>
      </header>

      {/* Confere-itens: sem imagem, só linha + valor — pra pegar add/remoção acidental */}
      {items.length > 0 && (
        <ul className="checkout__items">
          {items.map((item, i) => {
            const extras = item.extras ? extrasTotal(item.extras) : 0;
            const unit = basePrice(item.product, item.variant) + extras;
            return (
              <li key={i} className="checkout__item">
                <span className="checkout__item-name">
                  {item.quantity}× {item.product.name}
                  {item.variant && ` (${item.variant.label})`}
                  {extras > 0 && (
                    <em className="checkout__item-extras"> + adicionais</em>
                  )}
                </span>
                <span>{formatBRL(unit * item.quantity)}</span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="checkout__summary">
        <span>
          {totalCount} {totalCount === 1 ? "item" : "itens"}
        </span>
        <strong>{formatBRL(totalPrice)}</strong>
      </div>

      {/* ── Toggle Pix / Link de pagamento ── */}
      <div
        className="checkout__toggle"
        role="radiogroup"
        aria-label="Forma de pagamento"
      >
        <button
          type="button"
          role="radio"
          aria-checked={form.pagamento === "pix"}
          className={`checkout__toggle-btn${form.pagamento === "pix" ? " is-active" : ""}`}
          onClick={() => form.setPagamento("pix")}
        >
          💠 Pix
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={form.pagamento === "link"}
          className={`checkout__toggle-btn${form.pagamento === "link" ? " is-active" : ""}`}
          onClick={() => form.setPagamento("link")}
        >
          🔗 Link de pagamento
        </button>
      </div>

      {/* ── Toggle Retirada / Entrega ── */}
      <div
        className="checkout__toggle"
        role="radiogroup"
        aria-label="Forma de recebimento"
      >
        <button
          type="button"
          role="radio"
          aria-checked={form.tipo === "retirada"}
          className={`checkout__toggle-btn${form.tipo === "retirada" ? " is-active" : ""}`}
          onClick={() => form.setTipo("retirada")}
        >
          🏪 Retirada
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={form.tipo === "entrega"}
          className={`checkout__toggle-btn${form.tipo === "entrega" ? " is-active" : ""}`}
          onClick={() => form.setTipo("entrega")}
        >
          🚚 Entrega
        </button>
      </div>

      <form
        className="checkout__form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {/* ── Dados do cliente (sempre) ── */}
        <label className="checkout__field">
          <span className="checkout__label">Nome *</span>
          <input
            className="checkout__input"
            value={form.nome}
            onChange={(e) => form.setNome(e.target.value)}
            placeholder="Seu nome"
            autoComplete="name"
          />
        </label>

        <label className="checkout__field">
          <span className="checkout__label">Telefone (WhatsApp) *</span>
          <input
            className="checkout__input"
            value={formatTelefone(form.telefone)}
            onChange={(e) => form.setTelefone(e.target.value)}
            placeholder="(11) 99999-9999"
            inputMode="numeric"
            autoComplete="tel"
          />
          {form.telefone.length > 0 && !form.telefoneOk && (
            <span className="checkout__error">Telefone incompleto.</span>
          )}
        </label>

        {/* ── Endereço (só quando entrega) ── */}
        {form.tipo === "entrega" && (
          <>
            <label className="checkout__field">
              <span className="checkout__label">Quem recebe? *</span>
              <input
                className="checkout__input"
                value={form.recebe}
                onChange={(e) => form.setRecebe(e.target.value)}
                placeholder="Nome de quem vai receber"
                autoComplete="off"
              />
            </label>

            <p className="checkout__note">
              📍 Entregas somente no RS, consulte taxa de entrega na finalização
              no whatsapp.
            </p>

            <label className="checkout__field">
              <span className="checkout__label">Cidade *</span>
              <input
                className="checkout__input"
                value={form.cidade}
                onChange={(e) => form.setCidade(e.target.value)}
                placeholder="Cidade"
                autoComplete="address-level2"
              />
            </label>

            <label className="checkout__field">
              <span className="checkout__label">Rua *</span>
              <input
                className="checkout__input"
                value={form.rua}
                onChange={(e) => form.setRua(e.target.value)}
                placeholder="Rua / Avenida"
                autoComplete="address-line1"
              />
            </label>

            <div className="checkout__row">
              <label className="checkout__field checkout__field--numero">
                <span className="checkout__label">Número *</span>
                <input
                  className="checkout__input"
                  value={form.numero}
                  onChange={(e) => form.setNumero(e.target.value)}
                  placeholder="123"
                />
              </label>

              <label className="checkout__field checkout__field--bairro">
                <span className="checkout__label">Bairro *</span>
                <input
                  className="checkout__input"
                  value={form.bairro}
                  onChange={(e) => form.setBairro(e.target.value)}
                  placeholder="Bairro"
                />
              </label>
            </div>

            <label className="checkout__field">
              <span className="checkout__label">Complemento</span>
              <input
                className="checkout__input"
                value={form.complemento}
                onChange={(e) => form.setComplemento(e.target.value)}
                placeholder="Apto, bloco, referência (opcional)"
                maxLength={50}
                autoComplete="address-line2"
              />
            </label>

            <label className="checkout__field">
              <span className="checkout__label">Dia da entrega *</span>
              <input
                type="date"
                className={`checkout__input${dataEhDomingo ? " is-invalid" : ""}`}
                value={form.data}
                min={minData}
                max={maxData}
                aria-invalid={dataEhDomingo}
                // A mensagem nativa de validação (data fora do intervalo) sai no
                // idioma do navegador. Sobrescrevemos em PT-BR via onInvalid e
                // limpamos no onChange pra revalidar a cada digitação. Domingo é
                // bloqueado no handler (o input nativo não desabilita dias da semana).
                onInvalid={(e) =>
                  e.currentTarget.setCustomValidity(
                    isDomingo(e.currentTarget.value)
                      ? "Não fazemos entregas em Domingos."
                      : `Escolha uma data entre ${brDate(minData)} e ${brDate(maxData)}.`,
                  )
                }
                onChange={handleDataChange}
              />
              {dataEhDomingo && (
                <span className="checkout__error">
                  Não fazemos entregas em Domingos.
                </span>
              )}
            </label>

            <p className="checkout__note">
              ⏰ A entrega ocorre dentro de um período de aproximadamente 2
              horas — a loja confirma o horário exato.
            </p>
            <label className="checkout__field">
              <span className="checkout__label">Horário de entrega *</span>
              <select
                className="checkout__input"
                value={form.horario}
                onChange={(e) => form.setHorario(e.target.value)}
              >
                <option value="">— Escolha um horário —</option>
                {HORARIOS.map((h) => {
                  const bloqueado = horarioBloqueado("entrega", form.data, h);
                  return (
                    <option key={h} value={h} disabled={bloqueado}>
                      {h}
                      {bloqueado ? " (indisponível)" : ""}
                    </option>
                  );
                })}
              </select>
            </label>
          </>
        )}

        {/* ── Dia e horário da retirada (só quando retirada) ── */}
        {form.tipo === "retirada" && (
          <>
            <label className="checkout__field">
              <span className="checkout__label">Dia da retirada *</span>
              <input
                type="date"
                className={`checkout__input${dataEhDomingo ? " is-invalid" : ""}`}
                value={form.data}
                min={minData}
                max={maxData}
                aria-invalid={dataEhDomingo}
                // A mensagem nativa de validação (data fora do intervalo) sai no
                // idioma do navegador. Sobrescrevemos em PT-BR via onInvalid e
                // limpamos no onChange pra revalidar a cada digitação. Domingo é
                // bloqueado no handler (o input nativo não desabilita dias da semana).
                onInvalid={(e) =>
                  e.currentTarget.setCustomValidity(
                    isDomingo(e.currentTarget.value)
                      ? "Não fazemos retiradas em Domingos."
                      : `Escolha uma data entre ${brDate(minData)} e ${brDate(maxData)}.`,
                  )
                }
                onChange={handleDataChange}
              />
              {dataEhDomingo && (
                <span className="checkout__error">
                  Não fazemos retiradas em Domingos.
                </span>
              )}
            </label>

            <label className="checkout__field">
              <span className="checkout__label">Horário de retirada *</span>
              <select
                className="checkout__input"
                value={form.horario}
                onChange={(e) => form.setHorario(e.target.value)}
              >
                <option value="">— Escolha um horário —</option>
                {HORARIOS.map((h) => {
                  const bloqueado = horarioBloqueado("retirada", form.data, h);
                  return (
                    <option key={h} value={h} disabled={bloqueado}>
                      {h}
                      {bloqueado ? " (indisponível)" : ""}
                    </option>
                  );
                })}
              </select>
            </label>
          </>
        )}

        <button
          type="submit"
          className="checkout__submit"
          disabled={!form.valido}
        >
          Enviar pelo WhatsApp
        </button>
      </form>

      {maisAbaixo && (
        <div className="checkout__scroll-hint" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </section>
  );
}
