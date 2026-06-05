import React, { useEffect } from "react";
import { useConsent } from "../hooks/useConsent";
import { isPixelConfigured, loadPixel } from "../lib/analytics/metaPixel";
import "./ConsentBanner.css";

// Banner de consentimento (LGPD, opt-in) do Meta Pixel.
// - Visitante que já aceitou antes: o efeito religa o pixel a cada visita.
// - Sem Pixel ID configurado, não há o que consentir → não renderiza nada.

export default function ConsentBanner() {
  const { consent, accept, reject } = useConsent();

  // Carrega o pixel assim que houver consentimento (no clique de "Aceitar" ou
  // numa visita posterior de quem já aceitou). loadPixel() é idempotente.
  useEffect(() => {
    if (consent === "granted") loadPixel();
  }, [consent]);

  if (!isPixelConfigured()) return null;
  if (consent !== null) return null;

  return (
    <div className="consent" role="dialog" aria-label="Aviso de privacidade">
      <p className="consent__text">
        Usamos cookies da Meta (Facebook/Instagram) para medir nossos anúncios.
      </p>
      <div className="consent__actions">
        <button
          type="button"
          className="consent__btn consent__btn--reject"
          onClick={reject}
        >
          Recusar
        </button>
        <button
          type="button"
          className="consent__btn consent__btn--accept"
          onClick={accept}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
