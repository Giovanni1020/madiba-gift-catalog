import React, { useState } from "react";
import { CartProvider } from "./context/CartContext";
import { Product } from "./data/products";
import Header from "./components/Header";
import FilterBar from "./components/FilterBar";
import ProductGrid from "./components/ProductGrid";
import CartDrawer from "./components/CartDrawer";
import BuqueExtrasDialog from "./components/BuqueExtrasDialog";
import { useFilter } from "./hooks/useFilter";
import "./App.css";

function CatalogPage() {
  const filter = useFilter();
  const [extrasProduct, setExtrasProduct] = useState<Product | null>(null);

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
