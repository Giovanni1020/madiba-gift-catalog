// Integração do Meta Pixel — rastreamento SÓ pelo navegador (browser-only).
// Sem Conversions API (CAPI): a venda fecha no WhatsApp, fora do site, então o
// servidor também não veria a compra concluída (ver docs/meta-pixel.md e ADR-0003).
//
// Princípios:
// - O Pixel ID vem de REACT_APP_FB_PIXEL_ID (inlinado pelo CRA no build). Sem a
//   variável, TUDO vira no-op — o build/app nunca quebra por falta de pixel.
// - LGPD (opt-in): nada dispara antes do consentimento. `loadPixel()` só é
//   chamado pelo fluxo de consentimento (ver ConsentBanner). Antes disso, e sem
//   Pixel ID, `track()` é no-op.

const PIXEL_ID = process.env.REACT_APP_FB_PIXEL_ID;

// Eventos padrão da Meta que usamos no funil. Tipar evita typo silencioso.
export type PixelEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Lead";

// Parâmetros enviados nos eventos. NUNCA PII (telefone/endereço do cliente).
// `value` vai em BRL (reais, não centavos).
export interface PixelParams {
  content_ids?: (string | number)[];
  content_name?: string;
  content_type?: "product";
  content_category?: string;
  value?: number;
  currency?: "BRL";
  num_items?: number;
}

interface Fbq {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded: boolean;
  version: string;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let loaded = false;

/** Há Pixel ID configurado? Se não, toda a integração fica inerte. */
export function isPixelConfigured(): boolean {
  return typeof PIXEL_ID === "string" && PIXEL_ID.length > 0;
}

/**
 * Injeta o fbevents.js, inicializa o pixel e dispara o primeiro PageView.
 * Idempotente. Deve ser chamado APENAS após o consentimento (opt-in).
 */
export function loadPixel(): void {
  if (loaded || !isPixelConfigured() || typeof window === "undefined") return;
  loaded = true;

  if (!window.fbq) {
    // Stub oficial da Meta: enfileira chamadas até o fbevents.js assíncrono
    // carregar e instalar o `callMethod` real.
    const stub = function (...args: unknown[]) {
      const f = window.fbq;
      if (!f) return;
      if (f.callMethod) f.callMethod(...args);
      else f.queue.push(args);
    } as unknown as Fbq;
    stub.queue = [];
    stub.loaded = true;
    stub.version = "2.0";
    window.fbq = stub;
    if (!window._fbq) window._fbq = stub;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    const first = document.getElementsByTagName("script")[0];
    first?.parentNode?.insertBefore(script, first);
  }

  window.fbq?.("init", PIXEL_ID as string);
  window.fbq?.("track", "PageView");
}

/**
 * Dispara um evento de funil. No-op se o pixel ainda não foi carregado
 * (sem consentimento) ou não está configurado.
 */
export function track(event: PixelEvent, params?: PixelParams): void {
  if (!loaded) return;
  if (params) window.fbq?.("track", event, params);
  else window.fbq?.("track", event);
}
