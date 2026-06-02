import React, { useCallback, useEffect, useState } from "react";
import { CartProvider } from "./context/CartContext";
import { Product } from "./data/products";
import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import CartDrawer from "./components/CartDrawer";
import BuqueExtrasDialog from "./components/BuqueExtrasDialog";
import Checkout from "./components/Checkout";
import { useFilter } from "./hooks/useFilter";
import { useCheckoutForm } from "./hooks/useCheckoutForm";
import "./App.css";

function CatalogPage() {
  const filter = useFilter();
  const [extrasProduct, setExtrasProduct] = useState<Product | null>(null);
  // Checkout é VIEW, não rota (ADR-0001): pushState ao entrar; o "voltar" do
  // celular dispara popstate e fecha o checkout em vez de sair do site.
  const [view, setView] = useState<"catalogo" | "checkout">("catalogo");
  // Rascunho vive aqui (pai não desmonta) → sobrevive ao "Voltar".
  const checkoutForm = useCheckoutForm();

  const openCheckout = useCallback(() => {
    window.history.pushState({ checkout: true }, "");
    setView("checkout");
  }, []);
  const closeCheckout = useCallback(() => {
    window.history.back(); // → popstate → setView("catalogo")
  }, []);
  useEffect(() => {
    const onPop = () => setView("catalogo");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (view === "checkout") {
    return (
      <Checkout
        form={checkoutForm}
        onClose={closeCheckout}
        onSent={closeCheckout} // decisão C: volta pro catálogo, mantém carrinho
      />
    );
  }

  return (
    <div className="app">
      <Header />

      <main className="app__main">
        <div className="app__container">
          <FilterBar
            category={filter.category as any}
            setCategory={filter.setCategory}
            priceRange={filter.priceRange}
            setPriceRange={filter.setPriceRange}
            sortOrder={filter.sortOrder}
            setSortOrder={filter.setSortOrder}
            search={filter.search}
            setSearch={filter.setSearch}
            total={filter.total}
          />
          <ProductGrid
            products={filter.filtered}
            onOpenExtras={setExtrasProduct}
          />
        </div>
      </main>

      <CartDrawer onCheckout={openCheckout} />
      <BuqueExtrasDialog
        product={extrasProduct}
        onClose={() => setExtrasProduct(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <CatalogPage />
    </CartProvider>
  );
}
