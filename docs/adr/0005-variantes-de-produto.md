# ADR-0005 — Variantes de produto (preço/imagem/chocolates por opção)

- **Status:** Aceito — 2026-06-15
- **Contexto do projeto:** SPA em Create React App (React 18.2, TS 4.9), **sem router** e
  **sem lib de estado**. Catálogo de ~24 itens, jornada majoritariamente mobile
  (ver [aparelhos-suportados.md](../aparelhos-suportados.md)). Produtos vivem em
  [`products.ts`](../../src/data/products.ts) (sem backend/CMS).

## Contexto

Um mesmo produto passa a ter **opções mutuamente exclusivas** que mudam principalmente o
**preço** — o caso disparador é o **Buquê Girassol**, com versões de **3** e **4 girassóis**.
Hoje cada produto tem **um** `price` ([`products.ts:9`](../../src/data/products.ts)), uma
imagem e um `maxChocolates` fixos. Modelar isso como **dois produtos separados** funcionaria
sem código, mas:

- duplica card, descrição e imagem no grid (4 produtos × 2 versões = 8 cards);
- não lê como "escolha um tamanho" — o cliente vê dois itens "quase iguais";
- não escala: a loja confirmou que **outros produtos** também ganharão variantes.

Queremos **um produto, um card, e a escolha dentro do fluxo** que o cliente já percorre.

Restrições do código atual que viram trade-off:

- O preço-base é lido como `item.product.price` em **5 lugares**: total do carrinho
  ([`CartContext.tsx:104`](../../src/context/CartContext.tsx)), linha do drawer
  ([`CartDrawer.tsx:161`](../../src/components/CartDrawer.tsx)), resumo do checkout
  ([`Checkout.tsx:223`](../../src/components/Checkout.tsx)), mensagem do WhatsApp
  ([`checkoutMessage.ts:46`](../../src/components/checkoutMessage.ts)) e rodapé do diálogo
  ([`BuqueExtrasDialog.tsx:770`](../../src/components/BuqueExtrasDialog.tsx)). Um override de
  preço que esqueça um desses pontos faz o **total divergir**.
- O `BuqueExtrasDialog` já é o lugar onde o buquê é montado (cartão/balão/plaquinha/chocolate)
  e já **reseta o estado por `product.id`** ([`BuqueExtrasDialog.tsx:214`](../../src/components/BuqueExtrasDialog.tsx)).
- `maxChocolates` controla a seção de chocolates ([`BuqueExtrasDialog.tsx:286`](../../src/components/BuqueExtrasDialog.tsx));
  se ele varia por variante, a seção precisa reagir à troca.

## Decisão

**D1 — Modelo.** `Product` ganha `variants?: ProductVariant[]`. A variante carrega
**preço absoluto** (não delta — fica legível na mensagem do WhatsApp) e pode sobrepor a
**imagem** e o **`maxChocolates`**:

```ts
interface ProductVariant {
  id: string;             // estável, ex.: "3-girassois"
  label: string;          // "3 girassóis"
  price: number;          // centavos — preço absoluto
  image?: string;         // opcional: troca a mídia (dado futuro)
  maxChocolates?: number; // opcional: sobrepõe o do produto
}
```

Quando há `variants`, os campos do produto são o **default/"a partir de"**: `price` = menor
variante, `image` = miniatura do card, `maxChocolates` = fallback. A variante escolhida
sobrepõe.

**D2 — Onde se escolhe.** **No diálogo**, não no card. Seção "Opção" no **topo do corpo**,
**obrigatória**, default na **primeira** variante (a menor). O card só abre o diálogo, como
hoje. Motivo: o buquê **já** precisa do diálogo pros adicionais — escolher a variante no card
partiria a decisão em duas telas e exigiria carregar a escolha pra dentro do diálogo.

**D3 — Genérico, não só buquê.** O mecanismo vive no produto + diálogo, então vale pra
qualquer item que passe pelo `BuqueExtrasDialog` (buquês hoje; **cestas** se um dia
precisarem — fica em aberto). Produtos que entram direto via `addItem`
([`CartContext.tsx:53`](../../src/context/CartContext.tsx)) ficam **fora** por ora; se
variantes chegarem lá, o dedup (`product.id && !extras`) terá de comparar também `variant.id`.

**D4 — Preço por helper.** Um helper puro `basePrice(product, variant)` (= `variant?.price ??
product.price`) substitui as **5 leituras** de `item.product.price`, eliminando o risco de
esquecer um ponto. O card usa `priceFrom(product)` (menor variante, ou `price` quando não há
variantes) com o rótulo **"a partir de"**.

**D5 — Carrinho.** `CartItem` ganha `variant?: ProductVariant`. Como buquê **sempre adiciona
linha nova** ([`CartContext.tsx:73`](../../src/context/CartContext.tsx)), cada
variante+adicionais já é sua própria entrada — **sem dedup** a resolver.

**D6 — Chocolates por variante.** `variant.maxChocolates` sobrepõe o do produto. Ao **trocar
de variante**, se a seleção atual **exceder** o novo limite, os chocolates são **zerados**;
caso contrário, preservados. Balão/plaquinha/cartão **nunca** são afetados pela troca.

**D7 — Imagem por variante.** `variant.image` sobrepõe a mídia **dentro do diálogo**
(poster do vídeo, `<img>` e zoom). O card usa a imagem do produto. A imagem por variante é
**dado futuro** — o caminho de resolução (`variant?.image ?? product.image`) já fica pronto.

**D8 — Saída (carrinho/WhatsApp).** A linha vira `Nome (label da variante)` e o preço usa
`basePrice`. O atendente lê a opção exata.

## Consequências

**Positivas**
- Um card por produto; o grid não incha. O card já fica pronto pros próximos produtos com
  variante (só dado).
- Reusa o diálogo e o reset por `product.id` que já existem; zero dependência nova.
- `basePrice`/`priceFrom` centralizam o preço — DRY, e o total não diverge.

**Negativas / custos**
- `CartItem` cresce; **todo** ponto de preço precisa passar por `basePrice` (a divergência é
  silenciosa se esquecer — mitigado pelo helper único e pelos testes do `checkoutMessage`).
- Trocar de variante pode **zerar chocolates** (decisão consciente — D6).
- Acopla "tamanho" ao diálogo, que já acumula responsabilidades (mídia, navegação ADR-0004,
  adicionais, agora variante).

## Alternativas consideradas

- **Produtos separados (sem código):** descartada — clutter no grid e não escala; era o
  baseline a bater.
- **Seletor de variante no card:** descartada — pro buquê a escolha ficaria partida entre
  card e diálogo, com estado a carregar entre os dois.
- **Preço como delta relativo ao `price`:** descartada — absoluto é mais legível na mensagem
  e evita aritmética implícita.
- **Rascunho de variante/adicionais por item ao navegar (ADR-0004):** mantido como está —
  navegar descarta; configurar vem depois.

## Notas de implementação

- **[`products.ts`](../../src/data/products.ts):** `ProductVariant`, `variants?` em `Product`,
  e os helpers puros `basePrice(product, variant)` e `priceFrom(product)`.
- **[`CartContext.tsx`](../../src/context/CartContext.tsx):** `variant?` em `CartItem`;
  `addBuque(product, extras, variant?)`; `totalPrice` e o `value` do `AddToCart` via
  `basePrice`.
- **[`BuqueExtrasDialog.tsx`](../../src/components/BuqueExtrasDialog.tsx):** estado `variant`
  (default na 1ª, reset por `product.id`); seção "Opção" no topo do corpo; `maxChoc` resolvido
  por variante; zera chocolates só quando a troca excede o limite; mídia/zoom via
  `variant?.image ?? product.image`; rodapé via `basePrice`; passa `variant` ao `addBuque`.
- **[`ProductCard.tsx`](../../src/components/ProductCard.tsx):** "a partir de" + `priceFrom`
  quando há `variants`.
- **[`CartDrawer.tsx`](../../src/components/CartDrawer.tsx) /
  [`Checkout.tsx`](../../src/components/Checkout.tsx) /
  [`checkoutMessage.ts`](../../src/components/checkoutMessage.ts):** preço via `basePrice`;
  rótulo da variante na linha.
