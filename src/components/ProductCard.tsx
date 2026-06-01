import React, { useState } from "react";
import { Product, CATEGORY_LABELS } from "../data/products";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

interface Props {
  product: Product;
  onOpenExtras: (product: Product) => void;
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProductCard({ product, onOpenExtras }: Props) {
  const [imgError, setImgError] = useState(false);
  const { addItem } = useCart();
  const {
    name,
    description,
    price,
    category,
    image,
    featured,
    inStock = true,
  } = product;

  const handleAdd = () => {
    if (category === "buques" || category === "cestas") {
      onOpenExtras(product);
    } else {
      addItem(product);
    }
  };

  return (
    <article className={`card${!inStock ? " card--oos" : ""}`}>
      <div className="card__img-wrap">
        {imgError ? (
          <div className="card__img-placeholder" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#f5ece9" />
              <path
                d="M20 10c-2 0-3.5 1.5-3.5 3.5 0 .8.27 1.53.72 2.1L12 15.75V18h2v9h12v-9h2v-2.25l-5.22-.15A3.5 3.5 0 0 0 23.5 13.5C23.5 11.5 22 10 20 10Zm0 2c.83 0 1.5.67 1.5 1.5S20.83 15 20 15s-1.5-.67-1.5-1.5S19.17 12 20 12Zm-6 8h5v5.5h-5V20Zm6 0h5v5.5h-5V20Z"
                fill="#c2567a"
              />
            </svg>
          </div>
        ) : (
          <img
            src={image}
            alt={name}
            className="card__img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
        {featured && (
          <span className="card__badge card__badge--featured">Destaque</span>
        )}
        {!inStock && (
          <span className="card__badge card__badge--oos">Indisponível</span>
        )}
      </div>

      <div className="card__body">
        <span className="card__category">{CATEGORY_LABELS[category]}</span>
        <h3 className="card__name">{name}</h3>
        <p className="card__desc">{description}</p>
        <div className="card__footer">
          <span className="card__price">{formatPrice(price)}</span>
          <button
            className="card__btn"
            disabled={!inStock}
            aria-label={`Adicionar ${name} ao carrinho`}
            onClick={handleAdd}
          >
            {inStock ? "Adicionar" : "Indisponível"}
          </button>
        </div>
      </div>
    </article>
  );
}
