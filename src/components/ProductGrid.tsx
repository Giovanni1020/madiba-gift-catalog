import React from "react";
import { Product } from "../data/products";
import ProductCard from "./ProductCard";
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

  return (
    <ul className="grid" role="list">
      {products.map((product) => (
        <li key={product.id} className="grid__item">
          <ProductCard product={product} onOpenExtras={onOpenExtras} />
        </li>
      ))}
    </ul>
  );
}
