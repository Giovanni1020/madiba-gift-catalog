import React from "react";
import ContactCard from "./ContactCard";

// Card fixo que encerra a seção de buquês naturais. Diferente de um produto:
// não tem preço de tabela nem "Adicionar" — o buquê customizado (a partir de
// 10 rosas) é tratado por encomenda, então a ação é "Contatar" no WhatsApp com
// uma mensagem pronta.
export default function CustomBuqueCard() {
  return (
    <ContactCard
      category="Buquês"
      name="Buquê customizado"
      description="Entre em contato no WhatsApp para ver a disponibilidade de buquês customizados a partir de 10 rosas."
      image="/images/buque-custom-exemplo.jpeg"
      imageAlt="Exemplo de buquê customizado"
      whatsappMessage="Olá, gostaria de ver as opções e disponibilidade de buquê customizado (+10 rosas)"
      contactAriaLabel="Contatar no WhatsApp sobre buquê customizado"
    />
  );
}
