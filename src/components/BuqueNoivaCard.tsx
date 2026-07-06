import React from "react";
import ContactCard from "./ContactCard";

// Card fixo, no mesmo formato do buquê customizado: buquê de noiva é sob
// orçamento, então a ação é "Contatar" no WhatsApp com uma mensagem pronta.
export default function BuqueNoivaCard() {
  return (
    <ContactCard
      category="Buquês"
      name="Buquê de noiva"
      description="Entre em contato no WhatsApp para fazer orçamento de buquês de noiva."
      image="/images/buque-noiva.jpeg"
      imageAlt="Exemplo de buquê de noiva"
      whatsappMessage="Olá, gostaria de fazer um orçamento de buquê de noiva"
      contactAriaLabel="Contatar no WhatsApp sobre buquê de noiva"
    />
  );
}
