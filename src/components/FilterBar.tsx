import React, { useState } from "react";
import { CATEGORY_LABELS, Category } from "../data/products";
import { PriceRange, SortOrder } from "../hooks/useFilter";
import "./FilterBar.css";

const CATEGORIES: Array<Category | "todos"> = ["todos", "buques", "buques-cetim", "cestas", "doces"];

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
  // No mobile a barra começa compacta (só busca + seta); categorias e ordenação
  // ficam ocultas até o clique. No desktop o bloco é sempre visível (CSS).
  const [open, setOpen] = useState(false);
  // Indica filtro/ordenação ativos enquanto está colapsado.
  const hasActive = category !== "todos" || sortOrder !== "default";

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

        <button
          type="button"
          className={`filterbar__toggle${hasActive ? " filterbar__toggle--active" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="filterbar-collapsible"
          aria-label={open ? "Ocultar filtros" : "Mostrar filtros e ordenação"}
        >
          <span>Filtros</span>
          <svg
            className="filterbar__toggle-icon"
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 5l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div
          id="filterbar-collapsible"
          className={`filterbar__collapsible${open ? " is-open" : ""}`}
        >
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
    </div>
  );
}
