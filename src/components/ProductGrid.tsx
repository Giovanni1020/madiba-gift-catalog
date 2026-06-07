import React from "react";
import { Product } from "../data/products";
import ProductCard from "./ProductCard";
import CustomBuqueCard from "./CustomBuqueCard";
import "./ProductGrid.css";

interface Props {
  products: Product[];
  onOpenExtras: (product: Product) => void;
}

export default function ProductGrid({ products, onOpenExtras }: Props) {
  if (products.length === 0) {
    return (
      <div className="grid__empty">
        <p>Nenhum presente encontrado para esses filtros.</p>
        <p className="grid__empty-hint">Tente ajustar a categoria ou o preço.</p>
      </div>
    );
  }

  // O card "Buquê customizado" fecha a seção de buquês naturais: entra logo após
  // o último item de categoria "buques". Na aba Buquês isso é o fim da lista; em
  // "Todos" cai entre os buquês naturais e os de cetim. Sem buquês naturais
  // visíveis (abas Cetim/Cestas) → índice -1 → o card não aparece.
  const lastBuqueIndex = products.reduce(
    (last, p, i) => (p.category === "buques" ? i : last),
    -1,
  );

  return (
    <ul className="grid" role="list">
      {products.map((product, i) => (
        <React.Fragment key={product.id}>
          <li className="grid__item">
            <ProductCard product={product} onOpenExtras={onOpenExtras} />
          </li>
          {i === lastBuqueIndex && (
            <li className="grid__item">
              <CustomBuqueCard />
            </li>
          )}
        </React.Fragment>
      ))}
    </ul>
  );
}
