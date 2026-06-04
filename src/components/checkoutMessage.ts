// Builders do WhatsApp — PUROS (sem React). Colados ao checkout porque é o único
// fluxo que redireciona pro WhatsApp (sempre passa pelo checkout antes).

import type { CartItem } from "../context/CartContext";
import { CHOCOLATE_OPTIONS, extrasTotal } from "../data/products";
import type { Cliente, Entrega } from "../types/order";

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Data ISO (yyyy-mm-dd) → dd/mm/aaaa, sem criar Date (evita fuso/UTC).
function dataFmt(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function telFmt(d: string): string {
  const x = d.slice(0, 11);
  if (x.length <= 10) return `(${x.slice(0, 2)}) ${x.slice(2, 6)}-${x.slice(6)}`;
  return `(${x.slice(0, 2)}) ${x.slice(2, 7)}-${x.slice(7)}`;
}

export interface Pedido {
  itens: CartItem[];
  total: number; // centavos — confiamos no input (vem do próprio sistema)
  cliente: Cliente;
  entrega: Entrega;
}

// Sem emojis (clareza); linha em branco entre itens; lista TODOS os adicionais
// (o atendente e o cliente precisam saber os itens exatos, incluindo chocolates).
export function buildWhatsAppMessage(pedido: Pedido): string {
  const blocos = pedido.itens.map((item) => {
    const ex = item.extras; // const local → narrowing persiste dentro do forEach
    const adicional = ex ? extrasTotal(ex) : 0;
    const linhaTotal = item.quantity * (item.product.price + adicional);

    const linhas = [`- ${item.quantity}x ${item.product.name} — ${brl(linhaTotal)}`];
    if (ex) {
      if (ex.balao) linhas.push(`    + Balão: ${ex.balao}`);
      if (ex.plaquinha) linhas.push(`    + Plaquinha: ${ex.plaquinha}`);
      CHOCOLATE_OPTIONS.forEach((c) => {
        const q = ex.chocolates[c.id] ?? 0;
        if (q > 0) linhas.push(`    + ${c.name} x${q}`);
      });
    }
    return linhas.join("\n");
  });

  // Bloco da entrega: linhas AGRUPADAS (um \n entre elas, sem linha em branco)
  // para ocupar menos espaço na mensagem.
  const entregaLinhas = [
    `Forma: ${pedido.entrega.tipo === "entrega" ? "Entrega" : "Retirada"}`,
  ];
  if (pedido.entrega.tipo === "entrega") {
    const e = pedido.entrega.endereco;
    entregaLinhas.push(`Quem recebe: ${pedido.entrega.recebe}`);
    const enderecoPartes = [e.rua, e.numero, e.bairro];
    if (e.complemento) enderecoPartes.push(e.complemento); // só quando preenchido
    entregaLinhas.push(`Endereço: ${enderecoPartes.join(", ")}`);
    entregaLinhas.push(`Dia: ${dataFmt(pedido.entrega.data)}`);
    entregaLinhas.push(`Horário: ${pedido.entrega.horario}`);
  }

  // Itens, total, entrega (bloco) e cliente separados por linha em branco (\n\n).
  const secoes = [
    blocos.join("\n\n"),
    `*Total: ${brl(pedido.total)}*`,
    entregaLinhas.join("\n"),
    `Cliente: ${pedido.cliente.nome} — ${telFmt(pedido.cliente.telefone)}`,
  ];

  return secoes.join("\n\n");
}

export function buildWhatsAppUrl(telefone: string, mensagem: string): string {
  // encodeURIComponent (nunca encodeURI): \n → %0A e caracteres de texto preservados.
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}
