import React from "react";
import { useCart } from "../context/CartContext";
import "./Header.css";

export default function Header() {
  const { totalCount, openCart } = useCart();

  return (
    <header className="header">
      <div className="header__inner">
        <a href="/" className="header__brand" aria-label="Gifted — início">
          <span className="header__mark" aria-hidden="true">
            <img
              src={"./images/madibaIcon.png"}
              alt="Madiba logo"
              width="48"
              height="48"
            />
          </span>
          <span className="header__wordmark">Catálogo de presentes</span>
        </a>

        <button
          className="header__cart-btn"
          onClick={openCart}
          aria-label={`Abrir carrinho — ${totalCount} ${totalCount === 1 ? "item" : "itens"}`}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 3h2l.8 4M7 13h9l2-7H5.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="17" r="1.3" fill="currentColor" />
            <circle cx="16" cy="17" r="1.3" fill="currentColor" />
          </svg>
          {totalCount > 0 && (
            <span className="header__cart-badge" aria-hidden="true">
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
