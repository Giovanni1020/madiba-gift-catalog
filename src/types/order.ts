// Modelo do pedido (ADR-0002). Tipos do domínio — sem React, sem efeitos.
//
// `Entrega` é uma UNIÃO DISCRIMINADA em `tipo`: o bloco de endereço só existe
// quando `tipo === "entrega"`. É isso que deixa o formatador do WhatsApp
// "ramificar em entrega.tipo" com segurança de tipos (ver escopo-v1.md).

export interface Endereco {
  rua: string;
  numero: string; // string de propósito: aceita "123A", "s/n"
  bairro: string;
  complemento: string; // opcional (apto, bloco, referência) — até 50 chars; "" quando vazio
}

export type Entrega =
  | { tipo: "retirada" }
  | { tipo: "entrega"; endereco: Endereco; recebe: string; data: string; horario: string }; // recebe = quem recebe; data = dia desejado (ISO yyyy-mm-dd); horario = janela de entrega

export interface Cliente {
  nome: string;
  telefone: string; // só dígitos (DDD + número); o DDI entra no helper do WhatsApp
}

// `Pedido` (itens + total + cliente + entrega) é montado no "Finalizar" do
// Passo 2, juntando os itens do CartContext com o que vem deste formulário.
