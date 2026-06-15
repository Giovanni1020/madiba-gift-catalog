import React, { useEffect } from "react";
import { useCart } from "../context/CartContext";
import { CHOCOLATE_OPTIONS, EXTRAS_PRICES, basePrice } from "../data/products";
import "./CartDrawer.css";

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function CartDrawer({ onCheckout }: { onCheckout: () => void }) {
  const {
    items,
    totalPrice,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCart();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeCart]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={`cart-backdrop${isOpen ? " cart-backdrop--visible" : ""}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        className={`cart-drawer${isOpen ? " cart-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
      >
        <div className="cart-drawer__header">
          <h2 className="cart-drawer__title">Carrinho</h2>
          <button
            className="cart-drawer__close"
            onClick={closeCart}
            aria-label="Fechar carrinho"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M2 2l14 14M16 2L2 16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-drawer__empty">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 14h28l-3.5 18H13.5L10 14Z"
                stroke="#ddd"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="18"
                cy="38"
                r="2.5"
                stroke="#ddd"
                strokeWidth="1.5"
                fill="none"
              />
              <circle
                cx="30"
                cy="38"
                r="2.5"
                stroke="#ddd"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M6 8h4l2 6"
                stroke="#ddd"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <p>Seu carrinho está vazio.</p>
          </div>
        ) : (
          <ul className="cart-drawer__list">
            {items.map(({ product, quantity, variant, extras }, index) => {
              // Build extras lines
              const extraLines: {
                label: string;
                price: number;
                free?: boolean;
              }[] = [];
              if (extras?.cartao)
                extraLines.push({
                  label: "💌 Com cartão",
                  price: 0,
                  free: true,
                });
              if (extras?.balao)
                extraLines.push({
                  label: `🎈 Balão — ${extras.balao}`,
                  price: EXTRAS_PRICES.balao,
                });
              if (extras?.plaquinha)
                extraLines.push({
                  label: `🪧 Plaquinha — ${extras.plaquinha}`,
                  price: EXTRAS_PRICES.plaquinha,
                });
              CHOCOLATE_OPTIONS.forEach((c) => {
                const qty = extras?.chocolates[c.id] ?? 0;
                if (qty > 0)
                  extraLines.push({
                    label: `🍫 ${c.name} ×${qty}`,
                    price: c.price * qty,
                  });
              });

              return (
                <li key={index} className="cart-item">
                  <div className="cart-item__img-wrap">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="cart-item__img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>

                  <div className="cart-item__info">
                    <p className="cart-item__name">{product.name}</p>
                    {variant && (
                      <p className="cart-item__variant">{variant.label}</p>
                    )}
                    <p className="cart-item__price">
                      {formatPrice(basePrice(product, variant))}
                    </p>

                    {/* Extras sub-lines */}
                    {extraLines.length > 0 && (
                      <ul className="cart-item__extras">
                        {extraLines.map((line) => (
                          <li
                            key={line.label}
                            className="cart-item__extra-line"
                          >
                            <span>{line.label}</span>
                            <span>{line.free ? "Grátis" : formatPrice(line.price)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="cart-item__qty">
                      <button
                        className="cart-item__qty-btn"
                        onClick={() => updateQuantity(index, quantity - 1)}
                        aria-label="Diminuir quantidade"
                      >
                        −
                      </button>
                      <span className="cart-item__qty-num">{quantity}</span>
                      <button
                        className="cart-item__qty-btn"
                        onClick={() => updateQuantity(index, quantity + 1)}
                        aria-label="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    className="cart-item__remove"
                    onClick={() => removeItem(index)}
                    aria-label={`Remover ${product.name}`}
                  >
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__total">
              <span>Total</span>
              <span className="cart-drawer__total-price">
                {formatPrice(totalPrice)}
              </span>
            </div>
            <button
              className="cart-drawer__checkout"
              onClick={onCheckout}
            >
              Finalizar pedido
            </button>
            <button className="cart-drawer__clear" onClick={clearCart}>
              Limpar carrinho
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
