import React, { useCallback, useEffect, useRef, useState } from "react";
import { CartProvider } from "./context/CartContext";
import { PRODUCTS, Product } from "./data/products";
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
  const { openItemId, setOpenItemId } = filter;
  // Produto aberto vem do estado espelhado na URL (ADR-0004): fonte única, sem
  // clobber com os filtros (o useFilter é o único escritor da URL — ADR-0001).
  const extrasProduct =
    openItemId != null
      ? PRODUCTS.find((p) => p.id === openItemId) ?? null
      : null;
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
  const openExtras = useCallback(
    (product: Product) => {
      pushOverlayOnce();
      setOpenItemId(product.id);
    },
    [setOpenItemId],
  );
  const dismissExtras = useCallback(
    () => popOverlayOr(() => setOpenItemId(null)),
    [setOpenItemId],
  );
  // Trocar de item dentro do diálogo (setas/swipe): só muda o id → replaceState
  // via useFilter, sem empilhar histórico. Estável p/ não re-assinar o teclado.
  const selectProduct = useCallback(
    (p: Product) => setOpenItemId(p.id),
    [setOpenItemId],
  );

  // "Voltar" do celular (popstate) fecha qualquer overlay aberto → catálogo.
  useEffect(() => {
    const onPop = () => {
      setView("catalogo");
      setOpenItemId(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setOpenItemId]);

  // Reabrir via ?item= (reload/link, ADR-0004): no mount, se o id da URL existe,
  // garante a entrada de overlay pra o "voltar" fechar o diálogo; id inexistente
  // → limpa. Lê o id inicial via ref pra ser um efeito de mount (sem re-disparar).
  const mountItemRef = useRef(openItemId);
  useEffect(() => {
    const id = mountItemRef.current;
    if (id == null) return;
    if (PRODUCTS.some((p) => p.id === id)) pushOverlayOnce();
    else setOpenItemId(null);
  }, [setOpenItemId]);

  // Navegação entre itens dentro do diálogo (ADR-0004): percorre a lista
  // filtrada. Nas pontas o vizinho é null → a seta some (sem loop).
  const visible = filter.filtered;
  const extrasIndex = extrasProduct
    ? visible.findIndex((p) => p.id === extrasProduct.id)
    : -1;
  const prevProduct = extrasIndex > 0 ? visible[extrasIndex - 1] : null;
  const nextProduct =
    extrasIndex >= 0 && extrasIndex < visible.length - 1
      ? visible[extrasIndex + 1]
      : null;

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
        prevProduct={prevProduct}
        nextProduct={nextProduct}
        index={extrasIndex}
        total={visible.length}
        onSelect={selectProduct}
        onClose={() => setOpenItemId(null)}
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
