import React, { useState } from "react";
import { STORE_PHONE } from "../config";
import { buildWhatsAppUrl } from "./checkoutMessage";
import "./ProductCard.css";
import "./CustomBuqueCard.css";

// Card fixo (não é um produto de tabela): sem preço nem "Adicionar". A ação é
// "Contatar" no WhatsApp com uma mensagem pronta. Usado para itens tratados por
// encomenda/orçamento (ex.: buquê customizado, buquê de noiva).
interface Props {
  category: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  whatsappMessage: string;
  contactAriaLabel: string;
}

export default function ContactCard({
  category,
  name,
  description,
  image,
  imageAlt,
  whatsappMessage,
  contactAriaLabel,
}: Props) {
  const href = buildWhatsAppUrl(STORE_PHONE, whatsappMessage);
  const [imgError, setImgError] = useState(false);

  return (
    <article className="card card--custom">
      <div className="card__img-wrap">
        {imgError ? (
          <div
            className="card__img-placeholder card__custom-art"
            aria-hidden="true"
          >
            <svg width="56" height="56" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#FDE8F3" />
              <path
                d="M20 10c-2 0-3.5 1.5-3.5 3.5 0 .8.27 1.53.72 2.1L12 15.75V18h2v9h12v-9h2v-2.25l-5.22-.15A3.5 3.5 0 0 0 23.5 13.5C23.5 11.5 22 10 20 10Zm0 2c.83 0 1.5.67 1.5 1.5S20.83 15 20 15s-1.5-.67-1.5-1.5S19.17 12 20 12Zm-6 8h5v5.5h-5V20Zm6 0h5v5.5h-5V20Z"
                fill="#c2567a"
              />
            </svg>
          </div>
        ) : (
          <img
            src={image}
            alt={imageAlt}
            className="card__img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        )}
      </div>

      <div className="card__body">
        <span className="card__category">{category}</span>
        <h3 className="card__name">{name}</h3>
        <p className="card__desc">{description}</p>
        <div className="card__footer card__footer--custom">
          <a
            className="card__contact-btn"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={contactAriaLabel}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Contatar
          </a>
        </div>
      </div>
    </article>
  );
}
