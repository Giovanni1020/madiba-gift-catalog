import { test, expect } from "@jest/globals";
import {
  Product,
  activePromo,
  basePrice,
  priceFrom,
  promoDaysLeft,
  promoDiscountPct,
  todayISO,
} from "./products";

const base: Product = {
  id: 999,
  name: "Teste",
  description: "",
  price: 9990,
  category: "buques",
  image: "/images/x.jpeg",
};
const comPromo: Product = {
  ...base,
  promo: { price: 8990, expiresAt: "2026-10-31" },
};

test("activePromo: vale até expiresAt, inclusive", () => {
  expect(activePromo(comPromo, "2026-10-23")?.price).toBe(8990);
  expect(activePromo(comPromo, "2026-10-31")?.price).toBe(8990);
  expect(activePromo(comPromo, "2026-11-01")).toBeNull();
});

test("activePromo: sem promo -> null", () => {
  expect(activePromo(base, "2026-10-23")).toBeNull();
});

test("activePromo: promo + variantes não é suportado -> null", () => {
  const comVariantes: Product = {
    ...comPromo,
    variants: [{ id: "a", label: "A", price: 7990 }],
  };
  expect(activePromo(comVariantes, "2026-10-23")).toBeNull();
});

test("basePrice: promo ativa vira o preço real; variante vence a promo", () => {
  expect(basePrice(comPromo, null, "2026-10-23")).toBe(8990);
  expect(basePrice(comPromo, null, "2026-11-01")).toBe(9990);
  expect(basePrice(comPromo, { id: "a", label: "A", price: 7990 }, "2026-10-23")).toBe(7990);
});

test("priceFrom: card anuncia o preço promocional", () => {
  expect(priceFrom(comPromo, "2026-10-23")).toBe(8990);
  expect(priceFrom(comPromo, "2026-11-01")).toBe(9990);
});

test("promoDaysLeft: conta hoje; 1 = último dia, 0 = vencida", () => {
  const promo = { price: 8990, expiresAt: "2026-10-31" };
  expect(promoDaysLeft(promo, "2026-10-23")).toBe(9);
  expect(promoDaysLeft(promo, "2026-10-30")).toBe(2);
  expect(promoDaysLeft(promo, "2026-10-31")).toBe(1);
  expect(promoDaysLeft(promo, "2026-11-01")).toBe(0);
});

test("promoDaysLeft: atravessa o horário de verão sem perder/ganhar dia", () => {
  // DST no hemisfério norte termina em 01/11; a conta é em UTC.
  expect(promoDaysLeft({ price: 1, expiresAt: "2026-11-05" }, "2026-10-29")).toBe(8);
});

test("promoDiscountPct: arredonda para inteiro", () => {
  expect(promoDiscountPct(comPromo, comPromo.promo!)).toBe(10);
});

test("todayISO: formata YYYY-MM-DD no calendário local", () => {
  expect(todayISO(new Date(2026, 9, 5))).toBe("2026-10-05");
});
