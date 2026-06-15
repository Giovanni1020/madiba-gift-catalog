import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Toast, { ToastData } from "../components/Toast";

interface ToastContextValue {
  // Mostra um aviso transitório. `durationMs` controla o auto-dismiss.
  showToast: (message: string, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const seq = useRef(0);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, durationMs = DEFAULT_DURATION) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      seq.current += 1;
      setToast({ id: seq.current, message });
      timerRef.current = setTimeout(() => setToast(null), durationMs);
    },
    [],
  );

  // Garante que nenhum timer fique pendente ao desmontar o provider.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast toast={toast} onClose={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}
