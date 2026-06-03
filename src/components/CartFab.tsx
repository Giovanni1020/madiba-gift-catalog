import React from "react";
import { useCart } from "../context/CartContext";
import "./CartFab.css";

/**
 * Botão flutuante do carrinho (FAB). Fixo no canto inferior direito,
 * acompanha o scroll e flutua sobre a lista de produtos.
 */
export default function CartFab() {
  const { totalCount, openCart, isOpen } = useCart();

  return (
    <button
      className="cart-fab"
      onClick={openCart}
      // Esconde quando o drawer está aberto (evita ficar atrás do backdrop).
      hidden={isOpen}
      aria-label={`Abrir carrinho — ${totalCount} ${totalCount === 1 ? "item" : "itens"}`}
    >
      <svg
        className="cart-fab__icon"
        width="24"
        height="24"
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
        <span className="cart-fab__badge" aria-hidden="true">
          {totalCount > 99 ? "99+" : totalCount}
        </span>
      )}
    </button>
  );
}
