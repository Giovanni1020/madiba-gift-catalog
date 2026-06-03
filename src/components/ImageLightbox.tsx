import React, { useEffect } from "react";
import "./ImageLightbox.css";

interface Props {
  image: { src: string; alt: string } | null;
  onDismiss: () => void; // fecha por X / fora / Esc / "voltar" do celular
}

/**
 * Visualização ampliada da imagem do produto. É um overlay como os demais
 * (cart/extras): trava o scroll do body e fecha no Esc; o histórico ("voltar")
 * é gerido por quem abre, via overlayHistory.
 */
export default function ImageLightbox({ image, onDismiss }: Props) {
  const isOpen = image !== null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDismiss]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!image) return null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Imagem ampliada: ${image.alt}`}
      onClick={onDismiss}
    >
      <button className="lightbox__close" onClick={onDismiss} aria-label="Fechar imagem">
        <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
          <path d="M1 1l14 14M15 1L1 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>

      <img
        src={image.src}
        alt={image.alt}
        className="lightbox__img"
        // clicar na imagem não fecha; só o fundo/X/Esc fecham
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
