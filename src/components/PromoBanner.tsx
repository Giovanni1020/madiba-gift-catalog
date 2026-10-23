import { Product, activePromo, promoDaysLeft } from "../data/products";
import "./PromoBanner.css";

interface Props {
  products: Product[]; // catálogo inteiro, não a lista filtrada
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function prazoLabel(dias: number): string {
  if (dias <= 1) return "último dia";
  return `faltam ${dias} dias`;
}

/**
 * Aviso acima da grade quando há promoção ativa (ADR-0006).
 *
 * Promoção é exceção, não rotina: com um único item ativo a faixa nomeia o
 * produto e o preço. Com mais de um ela resume, porque listar nomes cresceria
 * sem limite. Sem promoção ativa não renderiza nada.
 *
 * Não é clicável de propósito: filtrar só promoções exigiria um parâmetro novo
 * na URL, e a vitrine já traz esses itens no topo da ordenação.
 */
export default function PromoBanner({ products }: Props) {
  const emPromo = products
    .map((product) => ({ product, promo: activePromo(product) }))
    .filter((p): p is { product: Product; promo: NonNullable<typeof p.promo> } =>
      p.promo !== null,
    );

  if (emPromo.length === 0) return null;

  // Menor prazo entre as promoções ativas: é o que realmente urge.
  const menorPrazo = Math.min(
    ...emPromo.map(({ promo }) => promoDaysLeft(promo)),
  );

  if (emPromo.length === 1) {
    const { product, promo } = emPromo[0];
    return (
      <aside className="promo-banner" aria-label="Promoção em andamento">
        <strong className="promo-banner__lead">Promoção!</strong>
        <span className="promo-banner__body">
          {product.name} por apenas{" "}
          <strong className="promo-banner__price">
            {formatPrice(promo.price)}
          </strong>
        </span>
        <span className="promo-banner__meta">
          de {formatPrice(product.price)} · {prazoLabel(promoDaysLeft(promo))}
        </span>
      </aside>
    );
  }

  const menorPreco = Math.min(...emPromo.map(({ promo }) => promo.price));
  return (
    <aside className="promo-banner" aria-label="Promoções em andamento">
      <strong className="promo-banner__lead">
        {emPromo.length} itens em promoção
      </strong>
      <span className="promo-banner__body">
        a partir de{" "}
        <strong className="promo-banner__price">
          {formatPrice(menorPreco)}
        </strong>
      </span>
      <span className="promo-banner__meta">
        a primeira termina em {menorPrazo <= 1 ? "hoje" : `${menorPrazo} dias`}
      </span>
    </aside>
  );
}
