import React, { useEffect, useState } from "react";
import { PRODUCTS } from "../data/products";
import "./MediaPreloader.css";

// Pré-carrega em background os vídeos "eager" (lazyVideo !== true) logo após a
// página pintar, em vez de só quando o BuqueExtrasDialog abre. Mantém um
// <video preload="auto"> oculto e sempre montado: o arquivo baixa UMA vez e fica
// no cache; quando o diálogo abre, o vídeo toca na hora (sem buffering) e, com o
// Cache-Control immutable de /vids/ (vercel.json), não há segundo download.
//
// O download é adiado pro "idle" pra não disputar banda com as imagens do
// catálogo no primeiro paint — é preload de background, não bloqueante.
const EAGER_VIDEOS = Array.from(
  new Set(
    PRODUCTS.filter((p) => p.video && !p.lazyVideo).map(
      (p) => p.video as string,
    ),
  ),
);

export default function MediaPreloader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (EAGER_VIDEOS.length === 0) return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true));
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return null;
  return (
    <div className="media-preloader" aria-hidden="true">
      {EAGER_VIDEOS.map((src) => (
        // Sem autoplay: o elemento só bufferiza (preload="auto"), não toca.
        <video key={src} src={src} preload="auto" muted playsInline tabIndex={-1} />
      ))}
    </div>
  );
}
