import { test, expect } from "@jest/globals";
import { parseFilters, serializeFilters, DEFAULT_FILTERS } from "./filterParams";

test("parse: query vazia -> defaults", () => {
  expect(parseFilters("")).toEqual(DEFAULT_FILTERS);
});

test("parse: tokens PT -> valores internos", () => {
  expect(
    parseFilters("?categoria=buques&preco=alto&ordem=menor-preco&q=rosas"),
  ).toEqual({
    category: "buques",
    priceRange: "high",
    sortOrder: "price-asc",
    search: "rosas",
  });
});

test("parse: valores inválidos caem no default (validação defensiva)", () => {
  expect(parseFilters("?categoria=banana&preco=xyz&ordem=hack")).toEqual(
    DEFAULT_FILTERS,
  );
});

test("serialize: omite defaults -> string vazia", () => {
  expect(serializeFilters(DEFAULT_FILTERS)).toBe("");
});

test("serialize: usa tokens PT, faz trim do q e prefixa ?", () => {
  expect(
    serializeFilters({
      category: "cestas",
      priceRange: "mid",
      sortOrder: "name",
      search: "  amor ",
    }),
  ).toBe("?categoria=cestas&preco=medio&ordem=nome&q=amor");
});

test("round-trip: serialize(parse(x)) é canônico e idempotente (base da auto-limpeza)", () => {
  const sujo = "?categoria=banana&preco=alto&lixo=1";
  const limpo = serializeFilters(parseFilters(sujo));
  expect(limpo).toBe("?preco=alto"); // tira categoria inválida e param desconhecido
  expect(serializeFilters(parseFilters(limpo))).toBe(limpo);
});
