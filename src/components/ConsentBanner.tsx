import React, { useEffect } from "react";
import { useConsent } from "../hooks/useConsent";
import { isPixelConfigured, loadPixel } from "../lib/analytics/metaPixel";
import { isAdsConfigured, loadGtag } from "../lib/analytics/googleAds";
import "./ConsentBanner.css";

// Banner de consentimento (LGPD, opt-in) do rastreamento de anúncios.
// Um único aceite cobre Meta Pixel e Google Ads (ADR-0008, D3): as duas tags
// servem à mesma finalidade — medir anúncios —, então separar em checkboxes
// daria mais atrito do que informação real ao visitante.
// - Visitante que já aceitou antes: o efeito religa as tags a cada visita.
// - Sem nenhuma das duas configurada, não há o que consentir → não renderiza nada.

export default function ConsentBanner() {
  const { consent, accept, reject } = useConsent();

  // Carrega as tags assim que houver consentimento (no clique de "Aceitar" ou
  // numa visita posterior de quem já aceitou). Ambas são idempotentes e viram
  // no-op se a respectiva variável de ambiente não estiver configurada.
  useEffect(() => {
    if (consent !== "granted") return;
    loadPixel();
    loadGtag();
  }, [consent]);

  if (!isPixelConfigured() && !isAdsConfigured()) return null;
  if (consent !== null) return null;

  return (
    <div className="consent" role="dialog" aria-label="Aviso de privacidade">
      <p className="consent__text">
        Usamos cookies da Meta (Facebook/Instagram) e do Google para medir
        nossos anúncios.
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
