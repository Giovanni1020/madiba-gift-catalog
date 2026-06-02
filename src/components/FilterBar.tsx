import React from "react";
import { CATEGORY_LABELS, Category } from "../data/products";
import { PriceRange, SortOrder } from "../hooks/useFilter";
import "./FilterBar.css";

const CATEGORIES: Array<Category | "todos"> = ["todos", "buques", "buques-cetim", "cestas"];

interface Props {
  category: Category | "todos";
  setCategory: (c: Category | "todos") => void;
  priceRange: PriceRange;
  setPriceRange: (p: PriceRange) => void;
  sortOrder: SortOrder;
  setSortOrder: (s: SortOrder) => void;
  search: string;
  setSearch: (s: string) => void;
  total: number;
}

export default function FilterBar({
  category,
  setCategory,
  priceRange,
  setPriceRange,
  sortOrder,
  setSortOrder,
  search,
  setSearch,
  total,
}: Props) {
  return (
    <div className="filterbar-sticky">
      <div className="filterbar">
        <div className="filterbar__search">
          <svg
            className="filterbar__search-icon"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="6.5"
              cy="6.5"
              r="4.5"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M10 10l3 3"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            className="filterbar__search-input"
            placeholder="Buscar presentes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar produtos"
          />
        </div>

        <div
          className="filterbar__pills"
          role="group"
          aria-label="Filtrar por categoria"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filterbar__pill${category === cat ? " filterbar__pill--active" : ""}`}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
            >
              {cat === "todos" ? "Todos" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="filterbar__controls">
          {/*<label className="filterbar__label" htmlFor="price-filter">
            Preço
          </label>

          <select
            id="price-filter"
            className="filterbar__select"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value as PriceRange)}
          >
            <option value="all">Qualquer</option>
            <option value="low">Até R$30</option>
            <option value="mid">R$30 – R$60</option>
            <option value="high">Acima de R$60</option>
          </select>*/}

          <label className="filterbar__label" htmlFor="sort-order">
            Ordenar
          </label>
          <select
            id="sort-order"
            className="filterbar__select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          >
            <option value="default">Padrão</option>
            <option value="price-asc">Menor preço</option>
            <option value="price-desc">Maior preço</option>
            <option value="name">Nome A–Z</option>
          </select>
          <span className="filterbar__count">
            {total} {total !== 1 ? "itens" : "item"}
          </span>
        </div>
      </div>
    </div>
  );
}
