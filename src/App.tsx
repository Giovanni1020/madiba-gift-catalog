import React, { useState } from "react";
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
  // TEMP (Passo 2 troca por flag de view real + pushState/popstate)
  const [view, setView] = useState<"catalogo" | "checkout">("catalogo");
  // Rascunho vive aqui (pai não desmonta) → sobrevive ao "Voltar".
  const checkoutForm = useCheckoutForm();

  if (view === "checkout") {
    return (
      <Checkout
        form={checkoutForm}
        onClose={() => setView("catalogo")}
        onSubmit={(cliente, entrega) => {
          // TEMP: só valida o shape. No Passo 2 isto monta o Pedido e abre o wa.me.
          console.log("PEDIDO →", { cliente, entrega });
          alert(JSON.stringify({ cliente, entrega }, null, 2));
        }}
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

      <CartDrawer />
      <BuqueExtrasDialog
        product={extrasProduct}
        onClose={() => setExtrasProduct(null)}
      />

      {/* TEMP (Passo 2 remove): atalho pra abrir o checkout e validar o form */}
      <button
        onClick={() => setView("checkout")}
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          zIndex: 50,
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          background: "#c2185b",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        TEMP: abrir checkout
      </button>
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
