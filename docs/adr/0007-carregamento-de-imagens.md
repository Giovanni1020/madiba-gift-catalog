# ADR-0007 — Estratégia de carregamento (lazy loading) das imagens

- **Status:** Aceito — 2026-07-24
- **Contexto do projeto:** SPA em CRA (React 18.2, TS 4.9), estático na Vercel, sem
  backend; jornada majoritariamente mobile. Origem: card #14 (a descrição do card estava
  desatualizada — ver "Premissa medida" abaixo).

## Contexto

A motivação original do card — *"o site carrega todas as imagens de uma vez"* — **não se
confirma no código atual**. A leitura dos componentes mostra que os pontos de imagem que
importam já usam `loading="lazy"` nativo, e o "provável principal ofensor" apontado no card
(carrossel de plaquinhas) já foi corrigido.

### Premissa medida (estado real do código)

| Imagem | Onde | Carregamento |
|---|---|---|
| Card da grade do catálogo | `ProductCard.tsx:89` | `lazy` ✅ |
| Carrossel de plaquinhas + imgs de referência | `ExtrasDialog.tsx:65,115` | `lazy` ✅ |
| Cartão de contato | `ContactCard.tsx:54` | `lazy` ✅ |
| Thumbnail do item no carrinho | `CartDrawer.tsx:148` | eager, mas **fora da 1ª dobra** (só renderiza com a gaveta aberta) |
| Mídia do produto no diálogo | `ExtrasDialog.tsx:528` | eager, mas **só renderiza com o diálogo aberto** |
| Lightbox (zoom) | `ImageLightbox.tsx:62` | eager, mas **só renderiza no zoom** |
| Logo do cabeçalho | `Header.tsx:11` | eager **de propósito** (1ª dobra), com `width`/`height` |

O catálogo é uma **grade única** (`ProductGrid`) filtrada no cliente; o `lazy` nativo do
navegador já adia as imagens abaixo da dobra. Não há, hoje, carregamento ansioso em massa
a combater. (Nota: vídeos de destaque têm pré-carga própria e ficam **fora** do escopo
deste ADR — ver `MediaPreloader.tsx`.)

## Decisão

1. **Baseline: `loading="lazy"` nativo do navegador** como a estratégia de carregamento das
   imagens do catálogo. Já é o que está em uso; fica **registrado como a decisão**, não como
   acidente. Toda nova `<img>` de conteúdo nasce com `loading="lazy"`; exceção só para
   imagem de primeira dobra conhecida (ex.: logo), que é eager e leva `width`/`height`
   (ou `aspect-ratio`) para não causar layout shift (CLS).
2. **Sem dependência nova.** Não entram lib de imagem, `IntersectionObserver` manual, nem
   blur-up/LQIP no v1. O ganho não justifica o custo no volume atual de produtos.
3. **Estratégia de crescimento — segmentação por categoria (adiada até fazer falta).**
   Quando o catálogo crescer a ponto de a grade única pesar, carregar **apenas a categoria
   inicial** e **adiar as demais** para depois do carregamento inicial (render/prefetch por
   categoria conforme o cliente navega pelos filtros), evitando trazer imagens demais de uma
   vez. É a evolução natural sobre o `ProductGrid` + filtros, **sem** exigir backend.
4. **Gatilho para reabrir:** a segmentação vira tarefa própria **quando** houver sinal real
   de peso — muitos produtos por categoria, LCP/latência medidos ruins no mobile, ou
   reclamação. Até lá, o baseline lazy é suficiente. A validação empírica (aba Network /
   Lighthouse) fica com o time quando o gatilho ocorrer.

## Consequências

**Positivas**
- Zero dependência nova e zero código novo agora — o baseline já está implementado.
- Imagens abaixo da dobra não competem com a primeira pintura; boa base de performance mobile.
- O caminho de crescimento (segmentar por categoria) está desenhado e é incremental sobre a
  arquitetura atual (grade + filtros), sem backend.

**Negativas / custos**
- A decisão é, em parte, "manter o que existe" — o valor está em **congelar a intenção** e
  impedir regressão (ex.: alguém adicionar `<img>` eager sem querer).
- A segmentação por categoria fica como dívida planejada; se o catálogo crescer rápido,
  o gatilho precisa ser observado para não virar problema de UX antes de agir.
- Imagens eager que hoje são inofensivas por estarem fora da dobra (carrinho, diálogo,
  lightbox) permanecem eager; se algum dia passarem a renderizar na 1ª dobra, revisar.

## Alternativas consideradas

- **`IntersectionObserver` manual / controle fino de pré-carga:** mais poder (prefetch antes
  de entrar na viewport), mas código próprio a manter sem ganho claro sobre o `lazy` nativo
  no volume atual. Preterida.
- **Blur-up / LQIP (placeholder borrado):** melhora a percepção de carregamento, mas exige
  gerar/servir versões de baixa qualidade e mais CSS/JS. Custo > benefício no v1. Reavaliar
  junto da segmentação, se a percepção de carregamento virar queixa.
- **Lib de imagem (ex.: componente `<Image>`):** traria otimização automática, mas CRA
  estático na Vercel sem framework de imagem tornaria a adoção pesada. Rejeitada.
- **`fetchpriority="high"` no LCP da 1ª dobra:** hoje o LCP provável é a logo (já eager com
  dimensões). Micro-otimização sem medição que a justifique; adiada.
