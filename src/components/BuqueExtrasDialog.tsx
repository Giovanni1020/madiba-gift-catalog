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

type ZoomImage = { src: string; alt: string };

// Imagem de referência de um adicional (balão, cartão, chocolates). Clicar
// amplia num lightbox, igual à imagem do produto sem vídeo.
function RefImage({
  src,
  alt,
  onZoom,
}: {
  src: string;
  alt: string;
  onZoom: (img: ZoomImage) => void;
}) {
  return (
    <button
      type="button"
      className="bed__ref-img-wrap bed__ref-img-btn"
      onClick={() => onZoom({ src, alt })}
      aria-label={`Ampliar imagem: ${alt}`}
    >
      <img src={src} alt={alt} className="bed__ref-img" />
    </button>
  );
}

interface CarouselProps {
  current: number;
  onChange: (i: number) => void;
  onZoom: (img: ZoomImage) => void;
}

function PlaquinhaCarousel({ current, onChange, onZoom }: CarouselProps) {
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
            onClick={() => i === current && onZoom({ src: img.src, alt: img.alt })}
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
  // Navegação entre itens (ADR-0004): vizinhos na lista filtrada (null nas
  // pontas → sem seta) e seletor para trocar o produto aberto.
  prevProduct?: Product | null;
  nextProduct?: Product | null;
  onSelect?: (p: Product) => void;
  index?: number; // posição na lista filtrada (0-based); -1/ausente esconde o contador
  total?: number;
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
  cartao: false,
  chocolates: {},
};

export default function BuqueExtrasDialog({
  product,
  prevProduct,
  nextProduct,
  onSelect,
  index,
  total,
  onClose,
  onDismiss,
}: Props) {
  const { addBuque } = useCart();
  const [extras, setExtras] = useState<BuqueExtras>(EMPTY_EXTRAS);
  const [plaquinhaPage, setPlaquinhaPage] = useState(0);
  // Imagem ampliada do produto (lightbox sobre o diálogo).
  const [zoom, setZoom] = useState<ZoomImage | null>(null);

  // O lightbox é um overlay ANINHADO sobre o diálogo: ganha a própria entrada de
  // histórico, para o "voltar" do celular fechar SÓ a imagem (o diálogo continua
  // aberto). O handler global de popstate (App) ignora o pop que volta ao nível
  // do diálogo (ainda há `overlay` no estado), e o listener abaixo zera o zoom.
  const openZoom = useCallback((img: ZoomImage) => {
    window.history.pushState({ overlay: true, zoom: true }, "");
    setZoom(img);
  }, []);
  const closeZoom = useCallback(() => {
    // Fecha por X / fundo / Esc: desfaz a entrada de histórico do zoom (o pop
    // dispara o popstate abaixo, que zera o estado). Sem a entrada, zera direto.
    if (window.history.state?.zoom) window.history.back();
    else setZoom(null);
  }, []);

  useEffect(() => {
    // "Voltar" do celular com o zoom aberto: fecha só a imagem. Inofensivo quando
    // o zoom já está fechado (o pop que fecha o diálogo também passa por aqui).
    const onPop = () => setZoom(null);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // Se o vídeo do produto falhar ao carregar, cai de volta para a imagem.
  const [videoFailed, setVideoFailed] = useState(false);
  // Expande a área de mídia (imagem ou vídeo) para vê-la inteira — empurra o
  // menu p/ baixo. Começa expandida; arrastar p/ cima minimiza, p/ baixo expande.
  const [mediaExpanded, setMediaExpanded] = useState(true);
  // Gesto de arraste vertical na mídia (estilo vídeo). Guarda o Y inicial e se
  // houve movimento real, para distinguir arraste de toque (toque amplia a imagem).
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const didDragRef = useRef(false);
  // Tap vs swipe horizontal no backdrop (ADR-0004): tap fecha, swipe troca item.
  const backdropRef = useRef<{ startX: number; startY: number } | null>(null);

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
    if (!isOpen) return;
    setExtras(EMPTY_EXTRAS);
    setPlaquinhaPage(0);
    setZoom(null);
    setVideoFailed(false);
    setMediaExpanded(true); // abre sempre com a mídia em tamanho cheio

    // Minimiza a mídia após um tempo p/ revelar o menu. O timer é guardado e
    // limpo no cleanup → ao trocar de item (ADR-0004) ele REINICIA em vez de
    // acumular (senão um timer antigo minimizava a mídia do novo item cedo demais).
    const t = setTimeout(() => setMediaExpanded(false), 5000);
    return () => clearTimeout(t);
  }, [product?.id, isOpen]);

  // ViewContent (funil): visualização do produto ao abrir/trocar o diálogo.
  // Debounce (ADR-0004): ao varrer itens rápido (setas/swipe), só dispara para
  // o item em que o usuário "assenta", evitando floodar a Meta.
  useEffect(() => {
    if (!product) return;
    const t = setTimeout(() => {
      track("ViewContent", {
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        content_category: product.category,
        value: product.price / 100,
        currency: "BRL",
      });
    }, 400);
    return () => clearTimeout(t);
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

  // Setas ←/→ trocam de produto (ADR-0004). Ignora quando o foco está num
  // controle de formulário (senão sequestra a troca de opção do <select>) e
  // quando a imagem ampliada está aberta.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (zoom) return;
      const tag = (document.activeElement?.tagName ?? "").toUpperCase();
      if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft" && prevProduct && onSelect) {
        e.preventDefault();
        onSelect(prevProduct);
      } else if (e.key === "ArrowRight" && nextProduct && onSelect) {
        e.preventDefault();
        onSelect(nextProduct);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevProduct, nextProduct, onSelect, zoom]);

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

  // ── Gestos da mídia: ↑/↓ redimensiona, ←/→ troca de item (ADR-0004) ────────
  const DRAG_THRESHOLD = 30; // px p/ confirmar a troca de estado (vertical)
  const DRAG_TAP_SLOP = 8; // px abaixo disso ainda conta como toque
  const SWIPE_THRESHOLD = 45; // px horizontais p/ confirmar a troca de item

  const handleMediaPointerDown = (e: React.PointerEvent) => {
    // O "X" e as setas de navegação tratam o próprio clique e não iniciam
    // arraste. A setinha de tamanho pode iniciar arraste (e ainda funciona como
    // clique — o guard de didDrag evita o duplo).
    const target = e.target as HTMLElement;
    if (target.closest(".bed__close") || target.closest(".bed__nav")) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY };
    didDragRef.current = false;
  };

  const handleMediaPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > DRAG_TAP_SLOP || Math.abs(dy) > DRAG_TAP_SLOP) {
      didDragRef.current = true;
    }
  };

  const handleMediaPointerUp = (e: React.PointerEvent) => {
    const start = dragRef.current;
    dragRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.startX;
    const dy = e.clientY - start.startY;
    // Eixo dominante decide: horizontal troca de item; vertical redimensiona.
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= SWIPE_THRESHOLD) {
      if (dx < 0 && nextProduct && onSelect) onSelect(nextProduct);
      else if (dx > 0 && prevProduct && onSelect) onSelect(prevProduct);
      return;
    }
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

  // Backdrop (ADR-0004): swipe horizontal troca de item; tap fecha o diálogo.
  const handleBackdropPointerDown = (e: React.PointerEvent) => {
    backdropRef.current = { startX: e.clientX, startY: e.clientY };
  };
  const handleBackdropPointerUp = (e: React.PointerEvent) => {
    const start = backdropRef.current;
    backdropRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.startX;
    const dy = e.clientY - start.startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= SWIPE_THRESHOLD) {
      if (dx < 0 && nextProduct && onSelect) onSelect(nextProduct);
      else if (dx > 0 && prevProduct && onSelect) onSelect(prevProduct);
      return;
    }
    // Só conta como "clicar fora" se foi um tap (sem arraste real).
    if (Math.abs(dx) < DRAG_TAP_SLOP && Math.abs(dy) < DRAG_TAP_SLOP) onDismiss();
  };

  if (!product) return null;

  const extrasCost = extrasTotal(extras);
  const showBalao = !product.includesBalao; // cesta que já vem com balão não oferece outro
  const exclusive = !!product.exclusiveExtras; // cestas: balão XOR plaquinha

  return (
    <>
      <div
        className="bed-backdrop"
        onPointerDown={handleBackdropPointerDown}
        onPointerUp={handleBackdropPointerUp}
        aria-hidden="true"
      />

      <div
        className="bed"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bed-title"
      >
        {/* Conteúdo do item — `key` por id re-dispara o fade rápido e reseta o
            scroll do corpo ao trocar de produto (ADR-0004). */}
        <div className="bed__content" key={product.id}>
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
                openZoom({ src: product.image, alt: product.name });
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

          {/* Navegação entre itens (ADR-0004) — setas nas bordas da mídia; somem
              nas pontas (prev/next null). Distintas das setas do carrossel de
              plaquinha, que ficam no corpo. */}
          {prevProduct && onSelect && (
            <button
              type="button"
              className="bed__nav bed__nav--prev"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(prevProduct);
              }}
              aria-label={`Ver anterior: ${prevProduct.name}`}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {nextProduct && onSelect && (
            <button
              type="button"
              className="bed__nav bed__nav--next"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(nextProduct);
              }}
              aria-label={`Ver próximo: ${nextProduct.name}`}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {typeof index === "number" &&
            index >= 0 &&
            typeof total === "number" &&
            total > 1 && (
              <span className="bed__counter" aria-hidden="true">
                {index + 1} / {total}
              </span>
            )}
        </div>

        {/* Header — também serve de alça de arraste para expandir/minimizar a mídia */}
        <div className="bed__header bed__header--drag" {...mediaDragHandlers}>
          <div aria-live="polite">
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
          {/* ── Cartão (grátis — só adiciona ou remove); primeiro da lista ── */}
          <div className="bed__section">
            <div className="bed__section-header">
              <h3 className="bed__section-title">Cartão</h3>
              <span className="bed__section-price">Grátis</span>
            </div>

            {/* Reference image */}
            <RefImage src="/images/cartao.jpeg" alt="Cartão" onZoom={openZoom} />

            <div className="bed__select-row">
              <button
                type="button"
                className={`bed__cartao-btn${extras.cartao ? " bed__cartao-btn--active" : ""}`}
                onClick={() => setExtras((p) => ({ ...p, cartao: !p.cartao }))}
                aria-pressed={extras.cartao}
              >
                {extras.cartao ? "Cartão adicionado ✓" : "Adicionar cartão"}
              </button>
              {extras.cartao && (
                <button
                  className="bed__clear-btn"
                  onClick={() => setExtras((p) => ({ ...p, cartao: false }))}
                  aria-label="Remover cartão"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

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
              <RefImage
                src="/images/baloes.jpg"
                alt="Opções de balão"
                onZoom={openZoom}
              />

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
              onZoom={openZoom}
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
              <RefImage
                src="/images/chocolates.jpg"
                alt="Opções de chocolate"
                onZoom={openZoom}
              />

              <p className="bed__section-hint">
                Escolha até {maxChoc} chocolate{maxChoc !== 1 ? "s" : ""} para
                acompanhar.
              </p>

              {CHOCOLATE_OPTIONS.map((choc) => {
                const qty = extras.chocolates[choc.id] ?? 0;
                const canAdd = totalChocSelected < maxChoc;
                if (choc.unavailable) {
                  return (
                    <div
                      key={choc.id}
                      className="bed__choc-row bed__choc-row--unavailable"
                    >
                      <div className="bed__choc-info">
                        <span className="bed__choc-name">{choc.name}</span>
                        <span className="bed__choc-price">Indisponível</span>
                      </div>
                    </div>
                  );
                }
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
        {/* /.bed__content */}
      </div>

      {/* Imagem ampliada sobre o diálogo */}
      <ImageLightbox image={zoom} onDismiss={closeZoom} />
    </>
  );
}
