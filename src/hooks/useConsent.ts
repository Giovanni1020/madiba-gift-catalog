import { useCallback, useState } from "react";

// Consentimento de rastreamento (LGPD, opt-in). Persistido em localStorage —
// mesma família de decisão do ADR-0002 (PII/preferências só com opt-in).
// `null` = ainda não decidiu (mostra o banner).

export type ConsentState = "granted" | "denied";

const KEY = "madiba:consent:analytics";

function read(): ConsentState | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null; // localStorage indisponível (modo privado/SSR) → trata como indeciso
  }
}

export function useConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(() => read());

  const decide = useCallback((state: ConsentState) => {
    try {
      localStorage.setItem(KEY, state);
    } catch {
      /* sem persistência: ainda aplicamos a decisão nesta sessão */
    }
    setConsent(state);
  }, []);

  const accept = useCallback(() => decide("granted"), [decide]);
  const reject = useCallback(() => decide("denied"), [decide]);

  return { consent, accept, reject };
}
