import { useEffect } from "react";
import { PRODUCTS } from "../data/products";

// Pré-carrega em background os vídeos "eager" (lazyVideo !== true) logo após a
// página pintar, em vez de só quando o ExtrasDialog abre.
//
// Usa <link rel="prefetch"> injetado no <head> — links não são renderizados, então
// têm ZERO impacto de layout (uma abordagem anterior com <video> ocultos quebrava
// o layout em telas muito largas). `prefetch` é baixa prioridade, "para uso futuro",
// sem o warning de "preloaded but not used". Com o Cache-Control immutable de /vids/
// (vercel.json), o arquivo baixa uma vez e o <video> do diálogo lê do cache.
//
// Adiado pro "idle" pra não disputar banda com as imagens do catálogo no 1º paint.
// (Safari ignora rel=prefetch → degrada p/ o comportamento antigo: carrega ao abrir.)
const EAGER_VIDEOS = Array.from(
  new Set(
    PRODUCTS.filter((p) => p.video && !p.lazyVideo).map(
      (p) => p.video as string,
    ),
  ),
);

export default function MediaPreloader() {
  useEffect(() => {
    if (EAGER_VIDEOS.length === 0) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let links: HTMLLinkElement[] = [];
    const inject = () => {
      links = EAGER_VIDEOS.map((src) => {
        const link = document.createElement("link");
        link.rel = "prefetch";
        link.href = src;
        document.head.appendChild(link);
        return link;
      });
    };

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(inject);
    else timeoutId = window.setTimeout(inject, 1500);

    return () => {
      if (idleId != null) w.cancelIdleCallback?.(idleId);
      if (timeoutId != null) clearTimeout(timeoutId);
      links.forEach((l) => l.remove());
    };
  }, []);

  return null;
}
