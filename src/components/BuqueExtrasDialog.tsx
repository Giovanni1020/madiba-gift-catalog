import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Product,
  BuqueExtras,
  ChocolateOption,
  CHOCOLATE_OPTIONS,
  BALAO_OPTIONS,
  PLAQUINHA_OPTIONS_BY_PAGE,
  BalaoOption,
  PlaquinhaOption,
  EXTRAS_PRICES,
  extrasTotal,
} from "../data/products";
import { useCart } from "../context/CartContext";
import { track } from "../lib/analytics/metaPixel";
import ImageLightbox from "./ImageLightbox";
import "./BuqueExtrasDialog.css";

// ─── Plaquinha image carousel ─────────────────────────────────────────────────

const PLAQUINHA_IMAGES = [
  { src: "/images/plaquinhas1.jpg", alt: "Plaquinhas — página 1" },
  { src: "/images/plaquinhas2.jpg", alt: "Plaquinhas — página 2" },
  { src: "/images/plaquinhas3.jpg", alt: "Plaquinhas — página 3" },
];

interface CarouselProps {
  current: number;
  onChange: (i: number) => void;
}

function PlaquinhaCarousel({ current, onChange }: CarouselProps) {
  const total = PLAQUINHA_IMAGES.length;
  const prev = () => onChange((current - 1 + total) % total);
  const next = () => onChange((current + 1) % total);

  return (
    <div className="plaq-carousel">
      <button
        className="plaq-carousel__arrow plaq-carousel__arrow--prev"
        onClick={prev}
        aria-label="Imagem anterior"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M10 3L5 8l5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="plaq-carousel__img-wrap">
        {PLAQUINHA_IMAGES.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            className={`plaq-carousel__img${i === current ? " plaq-carousel__img--active" : ""}`}
          />
        ))}
      </div>

      <button
        className="plaq-carousel__arrow plaq-carousel__arrow--next"
        onClick={next}
        aria-label="Próxima imagem"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M6 3l5 5-5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="plaq-carousel__dots">
        {PLAQUINHA_IMAGES.map((_, i) => (
          <button
            key={i}
            className={`plaq-carousel__dot${i === current ? " plaq-carousel__dot--active" : ""}`}
            onClick={() => onChange(i)}
            aria-label={`Ver página ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

interface Props {
  product: Product | null;
  onClose: () => void; // fecha sem mexer no histórico (após adicionar; o cart reusa o overlay)
  onDismiss: () => void; // descarta o overlay no "voltar"/X/fora/Esc
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const EMPTY_EXTRAS: BuqueExtras = {
  balao: null,
  plaquinha: null,
  chocolates: {},
};

export default function BuqueExtrasDialog({
  product,
  onClose,
  onDismiss,
}: Props) {
  const { addBuque } = useCart();
  const [extras, setExtras] = useState<BuqueExtras>(EMPTY_EXTRAS);
  const [plaquinhaPage, setPlaquinhaPage] = useState(0);
  // Imagem ampliada do produto (lightbox sobre o diálogo).
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  // Se o vídeo do produto falhar ao carregar, cai de volta para a imagem.
  const [videoFailed, setVideoFailed] = useState(false);
  // Expande a área de mídia (imagem ou vídeo) para vê-la inteira — empurra o
  // menu p/ baixo. Começa expandida; arrastar p/ cima minimiza, p/ baixo expande.
  const [mediaExpanded, setMediaExpanded] = useState(true);
  // Gesto de arraste vertical na mídia (estilo vídeo). Guarda o Y inicial e se
  // houve movimento real, para distinguir arraste de toque (toque amplia a imagem).
  const dragRef = useRef<{ startY: number } | null>(null);
  const didDragRef = useRef(false);

  // When the page changes, clear the plaquinha selection if it's not on the new page
  const handlePlaquinhaPage = (page: number) => {
    setPlaquinhaPage(page);
    setExtras((prev) => {
      if (!prev.plaquinha) return prev;
      const pageOptions = PLAQUINHA_OPTIONS_BY_PAGE[page] as readonly string[];
      if (!pageOptions.includes(prev.plaquinha))
        return { ...prev, plaquinha: null };
      return prev;
    });
  };

  const isOpen = product !== null;

  useEffect(() => {
    if (isOpen) {
      setExtras(EMPTY_EXTRAS);
      setPlaquinhaPage(0);
      setZoom(null);
      setVideoFailed(false);
      setMediaExpanded(true); // abre sempre com a mídia em tamanho cheio

      setTimeout(() => {
        setMediaExpanded(false); // automaticamente minimiza a mídia depois de um tempo, para mostrar o menu (mas deixa o vídeo expandido por mais tempo, pra dar tempo de assistir).
      }, 5000);
    }
  }, [product?.id, isOpen]);

  // ViewContent (funil): visualização do produto ao abrir/trocar o diálogo.
  useEffect(() => {
    if (product) {
      track("ViewContent", {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        content_category: product.category,
        value: product.price / 100,
        currency: "BRL",
      });
    }
  }, [product]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Com a imagem ampliada aberta, o Esc fecha só o lightbox (tratado lá).
      if (zoom) return;
      onDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDismiss, zoom]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const maxChoc = product?.maxChocolates ?? 0;
  const totalChocSelected = Object.values(extras.chocolates).reduce(
    (s, n) => s + (n ?? 0),
    0,
  );

  const setChocolate = useCallback(
    (id: ChocolateOption, delta: number) => {
      setExtras((prev) => {
        const current = prev.chocolates[id] ?? 0;
        const next = Math.max(0, current + delta);
        const newTotal = totalChocSelected + (next - current);
        if (newTotal > maxChoc) return prev;
        const updated = { ...prev.chocolates, [id]: next };
        if (updated[id] === 0) delete updated[id];
        return { ...prev, chocolates: updated };
      });
    },
    [totalChocSelected, maxChoc],
  );

  const handleAdd = () => {
    if (!product) return;
    addBuque(product, extras);
    onClose();
  };

  // ── Arraste vertical da mídia: ↑ minimiza, ↓ expande ──────────────────────
  const DRAG_THRESHOLD = 30; // px p/ confirmar a troca de estado
  const DRAG_TAP_SLOP = 8; // px abaixo disso ainda conta como toque

  const handleMediaPointerDown = (e: React.PointerEvent) => {
    // O "X" trata o próprio clique e não inicia arraste. A setinha pode iniciar
    // arraste (e ainda funciona como clique — o guard de didDrag evita o duplo).
    const target = e.target as HTMLElement;
    if (target.closest(".bed__close")) return;
    dragRef.current = { startY: e.clientY };
    didDragRef.current = false;
  };

  const handleMediaPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    if (Math.abs(e.clientY - dragRef.current.startY) > DRAG_TAP_SLOP) {
      didDragRef.current = true;
    }
  };

  const handleMediaPointerUp = (e: React.PointerEvent) => {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start) return;
    const dy = e.clientY - start.startY;
    if (dy <= -DRAG_THRESHOLD) setMediaExpanded(false);
    else if (dy >= DRAG_THRESHOLD) setMediaExpanded(true);
  };

  // Mesmos handlers na mídia e no header (o título é a alça mais intuitiva).
  const mediaDragHandlers = {
    onPointerDown: handleMediaPointerDown,
    onPointerMove: handleMediaPointerMove,
    onPointerUp: handleMediaPointerUp,
    onPointerCancel: () => {
      dragRef.current = null;
    },
  };

  if (!product) return null;

  const extrasCost = extrasTotal(extras);
  const showBalao = !product.includesBalao; // cesta que já vem com balão não oferece outro
  const exclusive = !!product.exclusiveExtras; // cestas: balão XOR plaquinha

  return (
    <>
      <div className="bed-backdrop" onClick={onDismiss} aria-hidden="true" />

      <div
        className="bed"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bed-title"
      >
        {/* Product media — vídeo (autoplay/loop, tipo GIF) ou imagem (clicar amplia).
            Arraste vertical ↑/↓ minimiza/expande a área (estilo vídeo). */}
        <div
          className={`bed__img-wrap${mediaExpanded ? " bed__img-wrap--expanded" : ""}`}
          {...mediaDragHandlers}
        >
          {product.video && !videoFailed ? (
            <video
              className="bed__img bed__video"
              src={product.video}
              poster={product.image}
              autoPlay
              loop
              muted
              playsInline
              preload={product.lazyVideo ? "metadata" : "auto"}
              tabIndex={-1}
              aria-label={product.name}
              disablePictureInPicture
              controlsList="nodownload noplaybackrate nofullscreen"
              onContextMenu={(e) => e.preventDefault()}
              onError={() => setVideoFailed(true)}
            />
          ) : (
            <button
              type="button"
              className="bed__img-btn"
              aria-label={`Ampliar imagem de ${product.name}`}
              onClick={() => {
                // Se foi arraste (redimensionou), não abre o zoom.
                if (didDragRef.current) {
                  didDragRef.current = false;
                  return;
                }
                setZoom({ src: product.image, alt: product.name });
              }}
            >
              <img
                src={product.image}
                alt={product.name}
                className="bed__img"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </button>
          )}
          <button
            className="bed__close"
            onClick={onDismiss}
            aria-label="Fechar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M1 1l14 14M15 1L1 15"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className="bed__media-toggle"
            onClick={() => {
              // Se foi arraste (já ajustou o tamanho), não alterna de novo.
              if (didDragRef.current) {
                didDragRef.current = false;
                return;
              }
              setMediaExpanded((v) => !v);
            }}
            aria-label={`${mediaExpanded ? "Diminuir" : "Aumentar"} ${product.video && !videoFailed ? "vídeo" : "imagem"}`}
            aria-expanded={mediaExpanded}
          >
            <svg
              className={`bed__media-toggle-icon${mediaExpanded ? " bed__media-toggle-icon--up" : ""}`}
              width="18"
              height="18"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M3.5 6l4.5 4.5L12.5 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Header — também serve de alça de arraste para expandir/minimizar a mídia */}
        <div className="bed__header bed__header--drag" {...mediaDragHandlers}>
          <div>
            <p className="bed__label">Adicionais para</p>
            <h2 className="bed__title" id="bed-title">
              {product.name}
            </h2>
            {exclusive && showBalao && (
              <p className="bed__exclusive-hint">
                Escolha balão <strong>ou</strong> plaquinha (não os dois).
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="bed__body">
          {/* ── Balão (escondido se a cesta já vem com balão) ───────────── */}
          {showBalao && (
            <div className="bed__section">
              <div className="bed__section-header">
                <h3 className="bed__section-title">Balão</h3>
                <span className="bed__section-price">
                  {formatPrice(EXTRAS_PRICES.balao)}
                </span>
              </div>

              {/* Reference image */}
              <div className="bed__ref-img-wrap">
                <img
                  src="/images/baloes.jpg"
                  alt="Opções de balão"
                  className="bed__ref-img"
                />
              </div>

              <div className="bed__select-row">
                <select
                  className="bed__select"
                  value={extras.balao ?? ""}
                  onChange={(e) => {
                    const val = e.target.value
                      ? (e.target.value as BalaoOption)
                      : null;
                    setExtras((p) => ({
                      ...p,
                      balao: val,
                      plaquinha: exclusive && val ? null : p.plaquinha,
                    }));
                  }}
                >
                  <option value="">— Não quero balão —</option>
                  {BALAO_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {extras.balao && (
                  <button
                    className="bed__clear-btn"
                    onClick={() => setExtras((p) => ({ ...p, balao: null }))}
                    aria-label="Remover balão"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Plaquinha ─────────────────────────────────────────────── */}
          <div className="bed__section">
            <div className="bed__section-header">
              <h3 className="bed__section-title">Plaquinha</h3>
              <span className="bed__section-price">
                {formatPrice(EXTRAS_PRICES.plaquinha)}
              </span>
            </div>

            {/* Carousel — controlled by plaquinhaPage */}
            <PlaquinhaCarousel
              current={plaquinhaPage}
              onChange={handlePlaquinhaPage}
            />

            <div className="bed__select-row">
              <select
                className="bed__select"
                value={extras.plaquinha ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                    ? (e.target.value as PlaquinhaOption)
                    : null;
                  setExtras((p) => ({
                    ...p,
                    plaquinha: val,
                    balao: exclusive && val ? null : p.balao,
                  }));
                }}
              >
                <option value="">— Não quero plaquinha —</option>
                {PLAQUINHA_OPTIONS_BY_PAGE[plaquinhaPage].map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {extras.plaquinha && (
                <button
                  className="bed__clear-btn"
                  onClick={() => setExtras((p) => ({ ...p, plaquinha: null }))}
                  aria-label="Remover plaquinha"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ── Chocolates (só quando o buquê aceita: maxChocolates > 0) ── */}
          {maxChoc > 0 && (
            <div className="bed__section">
              <div className="bed__section-header">
                <h3 className="bed__section-title">Chocolates</h3>
                <span className="bed__choc-counter">
                  {totalChocSelected}/{maxChoc} selecionados
                </span>
              </div>

              {/* Reference image */}
              <div className="bed__ref-img-wrap">
                <img
                  src="/images/chocolates.jpg"
                  alt="Opções de chocolate"
                  className="bed__ref-img"
                />
              </div>

              <p className="bed__section-hint">
                Escolha até {maxChoc} chocolate{maxChoc !== 1 ? "s" : ""} para
                acompanhar.
              </p>

              {CHOCOLATE_OPTIONS.map((choc) => {
                const qty = extras.chocolates[choc.id] ?? 0;
                const canAdd = totalChocSelected < maxChoc;
                return (
                  <div key={choc.id} className="bed__choc-row">
                    <div className="bed__choc-info">
                      <span className="bed__choc-name">{choc.name}</span>
                      <span className="bed__choc-price">
                        {formatPrice(choc.price)} / un.
                      </span>
                    </div>
                    <div className="bed__qty-ctrl">
                      <button
                        className="bed__qty-btn"
                        onClick={() => setChocolate(choc.id, -1)}
                        disabled={qty === 0}
                        aria-label={`Remover ${choc.name}`}
                      >
                        −
                      </button>
                      <span className="bed__qty-num">{qty}</span>
                      <button
                        className="bed__qty-btn"
                        onClick={() => setChocolate(choc.id, +1)}
                        disabled={!canAdd}
                        aria-label={`Adicionar ${choc.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bed__footer">
          <div className="bed__summary">
            <span className="bed__summary-label">
              {formatPrice(product.price)}
              {extrasCost > 0 && (
                <span className="bed__summary-extras">
                  {" "}
                  + {formatPrice(extrasCost)} em adicionais
                </span>
              )}
            </span>
            <span className="bed__summary-total">
              {formatPrice(product.price + extrasCost)}
            </span>
          </div>
          <button className="bed__add-btn" onClick={handleAdd}>
            Adicionar ao carrinho
          </button>
        </div>
      </div>

      {/* Imagem ampliada sobre o diálogo */}
      <ImageLightbox image={zoom} onDismiss={() => setZoom(null)} />
    </>
  );
}
