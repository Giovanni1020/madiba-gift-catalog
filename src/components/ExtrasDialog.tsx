import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Product,
  ProductVariant,
  BuqueExtras,
  ChocolateOption,
  CHOCOLATE_OPTIONS,
  PLAQUINHA_OPTIONS_BY_PAGE,
  BalaoOption,
  PlaquinhaOption,
  EXTRAS_PRICES,
  extrasTotal,
  basePrice,
} from "../data/products";
import { useCart } from "../context/CartContext";
import { track } from "../lib/analytics/metaPixel";
import ImageLightbox from "./ImageLightbox";
import "./ExtrasDialog.css";

// ─── Image carousel (plaquinha / balão) ───────────────────────────────────────

const PLAQUINHA_IMAGES = [
  { src: "/images/plaquinhas1.jpg", alt: "Plaquinhas — página 1" },
  { src: "/images/plaquinhas2.jpg", alt: "Plaquinhas — página 2" },
  { src: "/images/plaquinhas3.jpg", alt: "Plaquinhas — página 3" },
];

// Balões disponíveis hoje — uma imagem por modelo. A tipagem (BALAO_OPTIONS)
// continua maior: novos balões entram aqui sem mexer no tipo.
const BALAO_IMAGES = [
  { src: "/images/balao_te_amo.jpeg", alt: 'Balão "Te Amo"' },
  { src: "/images/balao_com_carinho.jpeg", alt: 'Balão "Com Carinho"' },
  { src: "/images/balao_parabens_rosa.jpeg", alt: 'Balão "Parabéns (Rosa)"' },
  { src: "/images/balao_parabens_vermelho.jpeg", alt: 'Balão "Parabéns (Verm.)"' },
];

// Opções de balão exibidas no select — só os modelos com imagem acima.
const BALAO_DISPLAY_OPTIONS: BalaoOption[] = [
  "Te Amo",
  "Com Carinho",
  "Parabéns (Rosa)",
  "Parabéns (Verm.)",
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
      <img src={src} alt={alt} loading="lazy" className="bed__ref-img" />
    </button>
  );
}

interface CarouselProps {
  images: { src: string; alt: string }[];
  current: number;
  onChange: (i: number) => void;
  onZoom: (img: ZoomImage) => void;
  dotLabel?: (i: number) => string;
  className?: string; // modificador opcional (ex.: área mais alta p/ balão)
}

function ImageCarousel({
  images,
  current,
  onChange,
  onZoom,
  dotLabel = (i) => `Ver imagem ${i + 1}`,
  className = "",
}: CarouselProps) {
  const total = images.length;
  const prev = () => onChange((current - 1 + total) % total);
  const next = () => onChange((current + 1) % total);

  return (
    <div className={`plaq-carousel${className ? ` ${className}` : ""}`}>
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
        {images.map((img, i) => (
          <img
            key={img.src}
            src={img.src}
            alt={img.alt}
            loading="lazy"
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
        {images.map((_, i) => (
          <button
            key={i}
            className={`plaq-carousel__dot${i === current ? " plaq-carousel__dot--active" : ""}`}
            onClick={() => onChange(i)}
            aria-label={dotLabel(i)}
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
  cartao: null,
  cartaoMensagem: "",
  chocolates: {},
};

// Texto do cartão "em branco": limite curto e sem emoji (cabe no cartão físico).
const CARTAO_MSG_MAX = 50;
// Barra emojis/pictogramas, bandeiras (regional indicators), seletor de variação
// e ZWJ (junta sequências de emoji). Mantém letras acentuadas e pontuação.
const EMOJI_RE =
  /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu;

export default function ExtrasDialog({
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
  // Variante escolhida (ADR-0005): default na 1ª (menor). null quando o produto não tem.
  const [variant, setVariant] = useState<ProductVariant | null>(
    product?.variants?.[0] ?? null,
  );
  const [plaquinhaPage, setPlaquinhaPage] = useState(0);
  const [balaoPage, setBalaoPage] = useState(0);
  // Aviso momentâneo (borda vermelha + texto) ao bater o limite do cartão.
  const [cartaoLimitHit, setCartaoLimitHit] = useState(false);
  const cartaoLimitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    setVariant(product?.variants?.[0] ?? null); // volta à variante default ao abrir/trocar
    setPlaquinhaPage(0);
    setBalaoPage(0);
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

  // maxChocolates da variante sobrepõe o do produto (ADR-0005).
  const maxChoc = (variant?.maxChocolates ?? product?.maxChocolates) ?? 0;
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

  // Trocar de variante (ADR-0005): preserva balão/plaquinha/cartão; só zera os
  // chocolates quando a seleção atual passa do limite da nova variante.
  const handleVariant = (v: ProductVariant) => {
    setVariant(v);
    const newMax = v.maxChocolates ?? product?.maxChocolates ?? 0;
    setExtras((prev) => {
      const total = Object.values(prev.chocolates).reduce(
        (s, n) => s + (n ?? 0),
        0,
      );
      return total > newMax ? { ...prev, chocolates: {} } : prev;
    });
  };

  // Texto do cartão: remove emoji e corta em CARTAO_MSG_MAX. Estourar o limite
  // (ou colar algo maior) acende o aviso vermelho por ~1,5s.
  const handleCartaoMensagem = useCallback((raw: string) => {
    const clean = raw.replace(EMOJI_RE, "");
    const clipped = clean.slice(0, CARTAO_MSG_MAX);
    if (clean.length > CARTAO_MSG_MAX) {
      setCartaoLimitHit(true);
      if (cartaoLimitTimer.current) clearTimeout(cartaoLimitTimer.current);
      cartaoLimitTimer.current = setTimeout(() => setCartaoLimitHit(false), 1500);
    }
    setExtras((p) => ({ ...p, cartaoMensagem: clipped }));
  }, []);

  // Limpa o timer do aviso ao desmontar (evita setState após unmount).
  useEffect(() => {
    return () => {
      if (cartaoLimitTimer.current) clearTimeout(cartaoLimitTimer.current);
    };
  }, []);

  const handleAdd = () => {
    if (!product) return;
    addBuque(product, extras, variant ?? undefined);
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
  const price = basePrice(product, variant); // preço-base da variante escolhida (ADR-0005)
  const media = variant?.image ?? product.image; // variante pode trocar a mídia
  const showBalao = !product.hideBalao; // item que não oferece balão como adicional
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
              poster={media}
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
                openZoom({ src: media, alt: product.name });
              }}
            >
              <img
                src={media}
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
          {/* ── Opção / variante (só quando o produto tem variantes — ADR-0005) ── */}
          {product.variants?.length ? (
            <div className="bed__section">
              <div className="bed__section-header">
                <h3 className="bed__section-title">Opção</h3>
              </div>
              <div
                className="bed__variants"
                role="radiogroup"
                aria-label="Opção do produto"
              >
                {product.variants.map((v) => {
                  const active = variant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`bed__variant${active ? " bed__variant--active" : ""}`}
                      onClick={() => handleVariant(v)}
                    >
                      <span className="bed__variant-label">{v.label}</span>
                      <span className="bed__variant-price">
                        {formatPrice(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* ── Cartão (grátis — só adiciona ou remove); primeiro da lista ── */}
          <div className="bed__section">
            <div className="bed__section-header">
              <h3 className="bed__section-title">Cartão</h3>
              <span className="bed__section-price">Grátis</span>
            </div>

            {/* Reference image */}
            <RefImage src="/images/cartao.jpeg" alt="Cartão" onZoom={openZoom} />

            {/* Tipo de cartão — botões segmentados (estilo das variantes). Sem
                default e sem seleção forçada: clicar no ativo desmarca. */}
            <div
              className="bed__cartao-opts"
              role="radiogroup"
              aria-label="Tipo de cartão"
            >
              {(
                [
                  { id: "branco", label: "Cartão em branco" },
                  { id: "pre_escrito", label: "Cartão pré-escrito" },
                ] as const
              ).map((opt) => {
                const active = extras.cartao === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`bed__cartao-opt${active ? " bed__cartao-opt--active" : ""}`}
                    onClick={() =>
                      setExtras((p) => ({
                        ...p,
                        cartao: active ? null : opt.id,
                      }))
                    }
                  >
                    <span className="bed__cartao-opt-label">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mensagem escrita pelo cliente (opcional) — vai junto no WhatsApp.
                Até 50 caracteres, sem emoji. */}
            {extras.cartao === "branco" && (
              <>
                <textarea
                  className={`bed__cartao-msg${cartaoLimitHit ? " bed__cartao-msg--limit" : ""}`}
                  value={extras.cartaoMensagem ?? ""}
                  onChange={(e) => handleCartaoMensagem(e.target.value)}
                  placeholder="Escreva a mensagem do cartão (opcional)"
                  rows={3}
                  aria-describedby="bed-cartao-msg-foot"
                />
                <div className="bed__cartao-msg-foot" id="bed-cartao-msg-foot">
                  <button
                    type="button"
                    className="bed__cartao-msg-clear"
                    onClick={() => handleCartaoMensagem("")}
                    disabled={!(extras.cartaoMensagem ?? "").length}
                  >
                    Limpar
                  </button>
                  {cartaoLimitHit && (
                    <span className="bed__cartao-msg-warn" role="alert">
                      Limite de {CARTAO_MSG_MAX} caracteres
                    </span>
                  )}
                  <span className="bed__cartao-msg-count">
                    {(extras.cartaoMensagem ?? "").length}/{CARTAO_MSG_MAX}
                  </span>
                </div>
              </>
            )}
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

              {/* Carousel — controlled by balaoPage. Área mais alta que a da
                  plaquinha: os balões são retratos e o 16/9 cortava o topo. */}
              <ImageCarousel
                images={BALAO_IMAGES}
                current={balaoPage}
                onChange={setBalaoPage}
                onZoom={openZoom}
                className="plaq-carousel--balao"
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
                  {BALAO_DISPLAY_OPTIONS.map((opt) => (
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
            <ImageCarousel
              images={PLAQUINHA_IMAGES}
              current={plaquinhaPage}
              onChange={handlePlaquinhaPage}
              onZoom={openZoom}
              dotLabel={(i) => `Ver página ${i + 1}`}
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
              {formatPrice(price)}
              {extrasCost > 0 && (
                <span className="bed__summary-extras">
                  {" "}
                  + {formatPrice(extrasCost)} em adicionais
                </span>
              )}
            </span>
            <span className="bed__summary-total">
              {formatPrice(price + extrasCost)}
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
