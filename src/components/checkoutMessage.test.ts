import { test, expect } from "@jest/globals";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "./checkoutMessage";
import type { Product } from "../data/products";

const buque: Product = {
  id: 4,
  name: "Buquê 5 Rosas Importadas",
  description: "",
  price: 12490,
  category: "buques",
  image: "",
  maxChocolates: 5,
};

const box: Product = {
  id: 2,
  name: "Box for Lovers",
  description: "",
  price: 18990,
  category: "cestas",
  image: "",
};

test("separa itens e seções com linha em branco", () => {
  const msg = buildWhatsAppMessage({
    itens: [
      {
        product: buque,
        quantity: 2,
        extras: { balao: "Te Amo", plaquinha: null, chocolates: { ferrero: 2 } },
      },
      { product: box, quantity: 1 },
    ],
    total: 48770,
    cliente: { nome: "Maria", telefone: "51985082700" },
    entrega: {
      tipo: "entrega",
      recebe: "João Silva",
      endereco: { cep: "90000000", rua: "Rua das Flores", numero: "123", bairro: "Centro" },
    },
  });

  // linha em branco ENTRE itens diferentes
  expect(msg).toContain("Ferrero Rocher x2\n\n- 1x Box for Lovers");
  // linha em branco ANTES e DEPOIS do total (regex evita o espaço da moeda)
  expect(msg).toMatch(/\n\n\*Total:.*\*\n\n/);
  // cada seção do rodapé separada por linha em branco (com "Quem recebe" na entrega)
  expect(msg).toContain(
    "Forma: Entrega\n\nQuem recebe: João Silva\n\nEndereço: 90000-000, Rua das Flores, 123, Centro\n\nCliente: Maria — (51) 98508-2700",
  );
});

test("retirada não imprime endereço; buquê sem extras não imprime adicionais", () => {
  const msg = buildWhatsAppMessage({
    itens: [
      {
        product: buque,
        quantity: 1,
        extras: { balao: null, plaquinha: null, chocolates: {} },
      },
    ],
    total: 12490,
    cliente: { nome: "João", telefone: "5133334444" },
    entrega: { tipo: "retirada" },
  });

  expect(msg).not.toContain("Endereço:");
  expect(msg).not.toContain("+ ");
  expect(msg).toContain("Forma: Retirada");
});

test("buildWhatsAppUrl encoda a mensagem (\\n -> %0A)", () => {
  expect(buildWhatsAppUrl("555186103494", "a\nb")).toBe(
    "https://wa.me/555186103494?text=a%0Ab",
  );
});
