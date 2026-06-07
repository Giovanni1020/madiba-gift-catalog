// (De)serialização dos filtros <-> query string. PURO e testável (sem React).
// O useFilter só liga estas funções ao window.location + replaceState.

import { Category } from "../data/products";

export type PriceRange = "all" | "low" | "mid" | "high";
export type SortOrder = "default" | "price-asc" | "price-desc" | "name";

export interface Filters {
  category: Category | "todos";
  priceRange: PriceRange;
  sortOrder: SortOrder;
  search: string;
}

export const DEFAULT_FILTERS: Filters = {
  category: "todos",
  priceRange: "all",
  sortOrder: "default",
  search: "",
};

// Valor interno -> token PT-BR na URL (link acessível e auto-explicativo).
const PRICE_TO_URL: Record<Exclude<PriceRange, "all">, string> = {
  low: "baixo",
  mid: "medio",
  high: "alto",
};
const SORT_TO_URL: Record<Exclude<SortOrder, "default">, string> = {
  "price-asc": "menor-preco",
  "price-desc": "maior-preco",
  name: "nome",
};

// Reverso (token PT -> valor interno) para a leitura/validação.
const URL_TO_PRICE: Record<string, PriceRange> = {
  baixo: "low",
  medio: "mid",
  alto: "high",
};
const URL_TO_SORT: Record<string, SortOrder> = {
  "menor-preco": "price-asc",
  "maior-preco": "price-desc",
  nome: "name",
};

const CATEGORIES: ReadonlyArray<Category | "todos"> = ["todos", "buques", "buques-cetim", "cestas"];

// query string -> Filters. Param inválido/ausente cai no default (URL é editável).
export function parseFilters(search: string): Filters {
  const p = new URLSearchParams(search);
  const cat = p.get("categoria");
  const preco = p.get("preco");
  const ordem = p.get("ordem");

  return {
    category:
      cat && (CATEGORIES as readonly string[]).includes(cat)
        ? (cat as Category | "todos")
        : "todos",
    priceRange: preco ? URL_TO_PRICE[preco] ?? "all" : "all",
    sortOrder: ordem ? URL_TO_SORT[ordem] ?? "default" : "default",
    search: p.get("q") ?? "",
  };
}

// Lê o `item` (id do produto aberto no diálogo — ADR-0004). Validação defensiva:
// só id inteiro positivo; qualquer outra coisa -> null. A EXISTÊNCIA do produto
// é checada por quem usa (App), contra a lista de produtos.
export function parseOpenItem(search: string): number | null {
  const raw = new URLSearchParams(search).get("item");
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Filters -> query string CANÔNICA (omite defaults; "" quando tudo padrão).
// Ser canônica é o que faz serialize(parse(url)) auto-limpar a URL.
export function serializeFilters(
  f: Filters,
  openItemId: number | null = null,
): string {
  const p = new URLSearchParams();
  if (f.category !== "todos") p.set("categoria", f.category);
  if (f.priceRange !== "all") p.set("preco", PRICE_TO_URL[f.priceRange]);
  if (f.sortOrder !== "default") p.set("ordem", SORT_TO_URL[f.sortOrder]);
  const q = f.search.trim();
  if (q) p.set("q", q);
  // `item` (ADR-0004): produto aberto no diálogo. Não é filtro, mas mora na
  // mesma query pra o link ser compartilhável e sobreviver a reload. Vem por
  // último (cosmético) e é omitido quando não há diálogo aberto.
  if (openItemId != null) p.set("item", String(openItemId));
  const s = p.toString();
  return s ? `?${s}` : "";
}
