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

function cepFmt(d: string): string {
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
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

  // Cada seção é separada por linha em branco (\n\n): itens, total, forma,
  // endereço (só entrega) e cliente — cada um no seu próprio bloco.
  const secoes = [
    blocos.join("\n\n"),
    `*Total: ${brl(pedido.total)}*`,
    `Forma: ${pedido.entrega.tipo === "entrega" ? "Entrega" : "Retirada"}`,
  ];
  if (pedido.entrega.tipo === "entrega") {
    const e = pedido.entrega.endereco;
    secoes.push(`Quem recebe: ${pedido.entrega.recebe}`);
    secoes.push(`Endereço: ${cepFmt(e.cep)}, ${e.rua}, ${e.numero}, ${e.bairro}`);
    secoes.push(`Horário: ${pedido.entrega.horario}`);
  }
  secoes.push(`Cliente: ${pedido.cliente.nome} — ${telFmt(pedido.cliente.telefone)}`);

  return secoes.join("\n\n");
}

export function buildWhatsAppUrl(telefone: string, mensagem: string): string {
  // encodeURIComponent (nunca encodeURI): \n → %0A e caracteres de texto preservados.
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}
