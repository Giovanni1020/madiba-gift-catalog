import "./Toast.css";

export interface ToastData {
  id: number;
  message: string;
}

interface Props {
  toast: ToastData | null;
  onClose: () => void;
}

// A região aria-live fica SEMPRE montada: o leitor de tela só anuncia a TROCA de
// conteúdo de uma região viva já existente. Montar a região junto da mensagem
// costuma "engolir" o anúncio. O `key` força re-animação quando a msg se repete.
export default function Toast({ toast, onClose }: Props) {
  return (
    <div className="toast-viewport" role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id}>
          <span className="toast__icon" aria-hidden="true">✓</span>
          <span className="toast__msg">{toast.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={onClose}
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
