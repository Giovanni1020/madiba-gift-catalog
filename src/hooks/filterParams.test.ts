import { test, expect } from "@jest/globals";
import {
  parseFilters,
  parseOpenItem,
  serializeFilters,
  DEFAULT_FILTERS,
} from "./filterParams";

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

test("parseOpenItem: id válido / inválido / ausente (validação defensiva)", () => {
  expect(parseOpenItem("?item=4")).toBe(4);
  expect(parseOpenItem("?categoria=cestas&item=13")).toBe(13);
  expect(parseOpenItem("")).toBeNull();
  expect(parseOpenItem("?item=abc")).toBeNull();
  expect(parseOpenItem("?item=-1")).toBeNull();
  expect(parseOpenItem("?item=0")).toBeNull();
});

test("serialize: inclui item por último; omite quando null", () => {
  expect(serializeFilters(DEFAULT_FILTERS, 4)).toBe("?item=4");
  expect(serializeFilters({ ...DEFAULT_FILTERS, category: "cestas" }, 13)).toBe(
    "?categoria=cestas&item=13",
  );
  expect(serializeFilters(DEFAULT_FILTERS, null)).toBe("");
});
