import React, { useCallback, useEffect, useState } from "react";
import { CartProvider } from "./context/CartContext";
import { Product } from "./data/products";
import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import CartDrawer from "./components/CartDrawer";
import CartFab from "./components/CartFab";
import SocialFab from "./components/SocialFab";
import BuqueExtrasDialog from "./components/BuqueExtrasDialog";
import Checkout from "./components/Checkout";
import ConsentBanner from "./components/ConsentBanner";
import { useFilter } from "./hooks/useFilter";
import { useCheckoutForm } from "./hooks/useCheckoutForm";
import { pushOverlayOnce, popOverlayOr } from "./overlayHistory";
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
    pushOverlayOnce(); // reusa a entrada de overlay do cart (não empilha)
    setView("checkout");
  }, []);
  const closeCheckout = useCallback(() => {
    popOverlayOr(() => setView("catalogo"));
  }, []);

  // Diálogo de extras = overlay (mesmo tratamento de histórico do cart/checkout).
  const openExtras = useCallback((product: Product) => {
    pushOverlayOnce();
    setExtrasProduct(product);
  }, []);
  const dismissExtras = useCallback(() => {
    popOverlayOr(() => setExtrasProduct(null));
  }, []);

  // "Voltar" do celular (popstate) fecha qualquer overlay aberto → catálogo.
  useEffect(() => {
    const onPop = () => {
      setView("catalogo");
      setExtrasProduct(null);
    };
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
          <ProductGrid products={filter.filtered} onOpenExtras={openExtras} />
        </div>
      </main>

      <CartFab />
      <SocialFab />
      <CartDrawer onCheckout={openCheckout} />
      <BuqueExtrasDialog
        product={extrasProduct}
        onClose={() => setExtrasProduct(null)}
        onDismiss={dismissExtras}
      />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <CatalogPage />
      {/* Banner LGPD: liga o Meta Pixel só após consentimento (opt-in). */}
      <ConsentBanner />
    </CartProvider>
  );
}
