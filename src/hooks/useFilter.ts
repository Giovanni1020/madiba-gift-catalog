import { useCallback, useEffect, useMemo, useState } from "react";
import { PRODUCTS, Product } from "../data/products";
import { parseFilters, parseOpenItem, serializeFilters } from "./filterParams";
import type { Filters, PriceRange, SortOrder } from "./filterParams";

// Re-export para consumidores existentes (ex.: FilterBar) não mudarem o import.
export type { PriceRange, SortOrder } from "./filterParams";

function matchesPrice(price: number, range: PriceRange): boolean {
  const dollars = price / 100;
  if (range === "low") return dollars < 30;
  if (range === "mid") return dollars >= 30 && dollars <= 60;
  if (range === "high") return dollars > 60;
  return true;
}

function sortProducts(products: Product[], order: SortOrder): Product[] {
  const copy = [...products];

  if (order === "price-asc") copy.sort((a, b) => a.price - b.price);
  else if (order === "price-desc") copy.sort((a, b) => b.price - a.price);
  else if (order === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
  // "default" — preserves original order

  // Produtos "Popular" (featured) vêm primeiro, preservando a ordenação acima
  // entre os itens de cada grupo (Array.prototype.sort é estável).
  return copy.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false));
}

export function useFilter() {
  // Modelo (a): o estado React é a fonte do render; a URL é semeada na init
  // e sincronizada via replaceState (sem empilhar histórico — ADR-0001).
  const [filters, setFilters] = useState<Filters>(() =>
    parseFilters(window.location.search),
  );
  // Produto aberto no diálogo, espelhado em `?item=` (ADR-0004). Não é filtro,
  // mas mora aqui pra manter um ÚNICO escritor da URL (ADR-0001) — assim a
  // auto-limpeza não apaga o item e o link fica compartilhável.
  const [openItemId, setOpenItemId] = useState<number | null>(() =>
    parseOpenItem(window.location.search),
  );

  // Sincroniza a URL com o estado. serializeFilters é canônica (omite defaults
  // e tokens inválidos), então isto também AUTO-LIMPA uma URL inicial "suja".
  useEffect(() => {
    const qs = serializeFilters(filters, openItemId);
    if (qs !== window.location.search) {
      const url = window.location.pathname + qs + window.location.hash;
      window.history.replaceState(window.history.state, "", url);
    }
  }, [filters, openItemId]);

  const setCategory = useCallback(
    (category: Filters["category"]) => setFilters((f) => ({ ...f, category })),
    [],
  );
  const setPriceRange = useCallback(
    (priceRange: PriceRange) => setFilters((f) => ({ ...f, priceRange })),
    [],
  );
  const setSortOrder = useCallback(
    (sortOrder: SortOrder) => setFilters((f) => ({ ...f, sortOrder })),
    [],
  );
  const setSearch = useCallback(
    (search: string) => setFilters((f) => ({ ...f, search })),
    [],
  );

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    const result = PRODUCTS.filter((p) => {
      if (filters.category !== "todos" && p.category !== filters.category)
        return false;
      if (!matchesPrice(p.price, filters.priceRange)) return false;
      if (p.inStock === false) return false;
      if (
        query &&
        !p.name.toLowerCase().includes(query) &&
        !p.description.toLowerCase().includes(query)
      )
        return false;
      return true;
    });

    return sortProducts(result, filters.sortOrder);
  }, [filters]);

  return {
    // state (vindo do objeto filters)
    category: filters.category,
    setCategory,
    priceRange: filters.priceRange,
    setPriceRange,
    sortOrder: filters.sortOrder,
    setSortOrder,
    search: filters.search,
    setSearch,
    // estado do diálogo espelhado na URL (ADR-0004)
    openItemId,
    setOpenItemId,
    // derived
    filtered,
    total: filtered.length,
  };
}
