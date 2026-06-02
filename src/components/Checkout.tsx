import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { extrasTotal } from "../data/products";
import { CheckoutForm } from "../hooks/useCheckoutForm";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "./checkoutMessage";
import { STORE_PHONE } from "../config";
import "./Checkout.css";

// ─── Helpers puros de EXIBIÇÃO (máscara/moeda) ─────────────────────────────────
// O saneamento (dígitos, DDI) vive no useCheckoutForm; aqui é só formatar a view.

function formatCep(d: string): string {
  const x = d.slice(0, 8);
  return x.length > 5 ? `${x.slice(0, 5)}-${x.slice(5)}` : x;
}

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

interface CheckoutProps {
  form: CheckoutForm;
  onClose: () => void;
  onSent: () => void; // pedido enviado: o pai volta pro catálogo (mantém carrinho)
}

export default function Checkout({ form, onClose, onSent }: CheckoutProps) {
  const { items, totalCount, totalPrice } = useCart();

  const cepErro =
    form.cep.length > 0 && form.cep.length < 8 ? "CEP incompleto." : null;

  // Setinha "há mais abaixo" quando o conteúdo passa da tela (mobile c/ entrega).
  const [maisAbaixo, setMaisAbaixo] = useState(false);
  useEffect(() => {
    const check = () => {
      const doc = document.documentElement;
      setMaisAbaixo(doc.scrollHeight - window.scrollY - window.innerHeight > 24);
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

  function handleSubmit() {
    const r = form.build();
    if (!r) return;
    const msg = buildWhatsAppMessage({
      itens: items,
      total: totalPrice,
      cliente: r.cliente,
      entrega: r.entrega,
    });
    window.open(buildWhatsAppUrl(STORE_PHONE, msg), "_blank");
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
            const unit = item.product.price + extras;
            return (
              <li key={i} className="checkout__item">
                <span className="checkout__item-name">
                  {item.quantity}× {item.product.name}
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
            <p className="checkout__note">
              📍 Entregas somente para o Rio Grande do Sul (RS).
            </p>

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

            <label className="checkout__field">
              <span className="checkout__label">CEP *</span>
              <input
                className="checkout__input"
                value={formatCep(form.cep)}
                onChange={(e) => form.setCep(e.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
                autoComplete="postal-code"
              />
              {cepErro && <span className="checkout__error">{cepErro}</span>}
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

            <p className="checkout__note">
              ⏰ A entrega ocorre dentro de um período de aproximadamente 2 horas — a loja confirma o horário exato.
            </p>
            <label className="checkout__field">
              <span className="checkout__label">Horário de entrega *</span>
              <select
                className="checkout__input"
                value={form.horario}
                onChange={(e) => form.setHorario(e.target.value)}
              >
                <option value="8h às 16h">8h às 16h</option>
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
