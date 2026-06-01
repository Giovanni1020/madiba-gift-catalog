import { useState, useMemo } from "react";
import { PRODUCTS, Product, Category } from "../data/products";

export type PriceRange = "all" | "low" | "mid" | "high";
export type SortOrder = "default" | "price-asc" | "price-desc" | "name";

function matchesPrice(price: number, range: PriceRange): boolean {
  const dollars = price / 100;
  if (range === "low")  return dollars < 30;
  if (range === "mid")  return dollars >= 30 && dollars <= 60;
  if (range === "high") return dollars > 60;
  return true;
}

function sortProducts(products: Product[], order: SortOrder): Product[] {
  const copy = [...products];
  if (order === "price-asc")  return copy.sort((a, b) => a.price - b.price);
  if (order === "price-desc") return copy.sort((a, b) => b.price - a.price);
  if (order === "name")       return copy.sort((a, b) => a.name.localeCompare(b.name));
  return copy; // "default" — preserves original order
}

export function useFilter() {
  const [category, setCategory] = useState<Category | "todos">("todos");
  const [priceRange, setPriceRange] = useState<PriceRange>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("default");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = PRODUCTS.filter((p) => {
      if (category !== "todos" && p.category !== category) return false;
      if (!matchesPrice(p.price, priceRange)) return false;
      if (p.inStock === false) return false;
      if (query && !p.name.toLowerCase().includes(query) && !p.description.toLowerCase().includes(query)) return false;
      return true;
    });

    return sortProducts(result, sortOrder);
  }, [category, priceRange, sortOrder, search]);

  return {
    // state
    category, setCategory,
    priceRange, setPriceRange,
    sortOrder, setSortOrder,
    search, setSearch,
    // derived
    filtered,
    total: filtered.length,
  };
}
