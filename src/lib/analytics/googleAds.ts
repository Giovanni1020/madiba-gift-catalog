// Integração do Google Ads — só a CONVERSÃO, nada de funil.
// Espelha o desenho do metaPixel.ts (mesmo ADR-0003 de consentimento), mas com
// escopo deliberadamente menor: um único evento, no clique que envia o carrinho
// pro WhatsApp (ver docs/google-ads.md e ADR-0008).
//
// Princípios:
// - O `send_to` vem de REACT_APP_GADS_SEND_TO (inlinado pelo CRA no build). Sem
//   a variável — ou com ela malformada — TUDO vira no-op; o build nunca quebra.
// - LGPD (opt-in): nada dispara antes do consentimento. `loadGtag()` só é
//   chamado pelo fluxo de consentimento (ver ConsentBanner). Sem Consent Mode:
//   quem recusa não carrega script nenhum do Google.

// Formato "AW-123456789/AbC-D_efGhIjK": o ID da conta (antes da barra) carrega o
// gtag.js; a string inteira identifica a ação de conversão no `send_to`.
const SEND_TO = process.env.REACT_APP_GADS_SEND_TO;
const SEND_TO_RE = /^AW-[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/;

// Parâmetros da conversão. NUNCA PII (telefone/endereço do cliente).
// `value` vai em BRL (reais, não centavos) — mesma convenção do Meta Pixel.
export interface ConversionParams {
  value?: number;
  currency?: "BRL";
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let loaded = false;

/**
 * O gtag.js exige que o dataLayer receba o objeto `arguments` cru — um array
 * comum não é interpretado como comando. Por isso `function` (e não arrow).
 */
function gtagCommand() {
  window.dataLayer?.push(arguments);
}

/** Há `send_to` válido configurado? Se não, toda a integração fica inerte. */
export function isAdsConfigured(): boolean {
  return typeof SEND_TO === "string" && SEND_TO_RE.test(SEND_TO);
}

/**
 * Injeta o gtag.js e configura a conta. Idempotente.
 * Deve ser chamado APENAS após o consentimento (opt-in).
 */
export function loadGtag(): void {
  if (loaded || !isAdsConfigured() || typeof window === "undefined") return;
  loaded = true;

  const accountId = (SEND_TO as string).split("/")[0];

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) window.gtag = gtagCommand;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${accountId}`;
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(script, first);

  window.gtag?.("js", new Date());
  window.gtag?.("config", accountId);
}

/**
 * Dispara a conversão. No-op se o gtag ainda não foi carregado (sem
 * consentimento) ou não está configurado.
 *
 * Só existe UM ponto de chamada: o envio do carrinho pelo WhatsApp. Cliques de
 * contato avulso (FAB, card de contato) NÃO contam — otimizar lance em cima
 * deles atrai quem só quer perguntar preço (ADR-0008, D2).
 */
export function trackConversion(params?: ConversionParams): void {
  if (!loaded) return;
  window.gtag?.("event", "conversion", { send_to: SEND_TO, ...params });
}
