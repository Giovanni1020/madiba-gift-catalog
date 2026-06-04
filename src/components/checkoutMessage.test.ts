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
    pagamento: "pix",
    entrega: {
      tipo: "entrega",
      recebe: "João Silva",
      data: "2026-06-10",
      horario: "14h às 15h",
      endereco: { rua: "Rua das Flores", numero: "123", bairro: "Centro", complemento: "Apto 42" },
    },
  });

  // linha em branco ENTRE itens diferentes
  expect(msg).toContain("Ferrero Rocher x2\n\n- 1x Box for Lovers");
  // total com linha em branco antes; pagamento colado logo abaixo (um \n), e
  // linha em branco depois do bloco total+pagamento (regex evita o espaço da moeda)
  expect(msg).toMatch(/\n\n\*Total:.*\*\nPagamento: Pix\n\n/);
  // cada seção do rodapé separada por linha em branco (com "Quem recebe" na entrega)
  expect(msg).toContain(
    "Forma: Entrega\nQuem recebe: João Silva\nEndereço: Rua das Flores, 123, Centro, Apto 42\nDia: 10/06/2026\nHorário: 14h às 15h\n\nCliente: Maria — (51) 98508-2700",
  );
});

test("endereço sem complemento não acrescenta vírgula extra", () => {
  const msg = buildWhatsAppMessage({
    itens: [
      {
        product: box,
        quantity: 1,
        extras: { balao: null, plaquinha: null, chocolates: {} },
      },
    ],
    total: 18990,
    cliente: { nome: "Ana", telefone: "51985082700" },
    pagamento: "link",
    entrega: {
      tipo: "entrega",
      recebe: "Ana",
      data: "2026-06-05",
      horario: "10h às 11h",
      endereco: { rua: "Av. Brasil", numero: "10", bairro: "Centro", complemento: "" },
    },
  });

  expect(msg).toContain("Endereço: Av. Brasil, 10, Centro\nDia: 05/06/2026\nHorário:");
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
    pagamento: "pix",
    entrega: { tipo: "retirada" },
  });

  expect(msg).not.toContain("Endereço:");
  expect(msg).not.toContain("+ ");
  expect(msg).toContain("Forma: Retirada");
  // pagamento aparece colado abaixo do total (fecho do *Total* + \n, sem linha
  // em branco); evita asserir o valor por causa do NBSP da moeda no toLocaleString
  expect(msg).toContain("*\nPagamento: Pix\n");
});

test("buildWhatsAppUrl encoda a mensagem (\\n -> %0A)", () => {
  expect(buildWhatsAppUrl("555186103494", "a\nb")).toBe(
    "https://wa.me/555186103494?text=a%0Ab",
  );
});
