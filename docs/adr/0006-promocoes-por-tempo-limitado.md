# ADR-0006 — Promoções por tempo limitado

- **Status:** Aceito — 2026-10-23
- **Contexto do projeto:** SPA em Create React App (React 18.2, TS 4.9), build **estático**
  na Vercel, **sem backend**. Produtos vivem em
  [`products.ts`](../../src/data/products.ts). Migração para Next.js em andamento
  ([ADR-0009](0009-migracao-nextjs.md)) — nada aqui depende de CRA.

## Contexto

A loja quer baixar o preço de **um** item por um período curto e anunciar isso na vitrine.
O caso disparador é o **Buquê 5 Rosas Nacionais**: R$99,90 → R$89,90 até 31/10/2026.

Promoção é **exceção, não rotina**: a expectativa é um item por vez, raramente, não uma
vitrine inteira em oferta. Isso é um dado de projeto, não um detalhe — é o que justifica a
faixa do topo nomear o produto e o preço em vez de só contar itens, e é o que torna
aceitável um tratamento visual forte no card.

Restrições do código que viram trade-off:

- O preço-base já tem **ponto único de verdade**: `basePrice(product, variant)`
  ([`products.ts`](../../src/data/products.ts)), consumido por carrinho
  ([`CartContext.tsx`](../../src/context/CartContext.tsx)), drawer, checkout, mensagem do
  WhatsApp ([`checkoutMessage.ts`](../../src/components/checkoutMessage.ts)), diálogo de
  extras e pelos dois pixels de conversão (Meta e Google Ads). Se a promoção entrar por
  aí, nenhum desses pontos precisa mudar.
- **Variantes carregam preço absoluto** ([ADR-0005](0005-variantes-de-produto.md)), não
  delta. Não existe forma de "aplicar −10%" sobre uma variante sem inventar semântica nova.
- O build é **estático**: não há "hoje" do servidor para comparar com a data de validade.
- `featured` (selo "Popular") já ocupa o canto superior esquerdo da imagem e já leva o item
  ao topo da ordenação ([`useFilter.ts`](../../src/hooks/useFilter.ts)).

## Decisão

**D1 — Modelo.** `Product` ganha `promo?: ProductPromo`, com **preço absoluto** em centavos
e a data do **último dia válido** em ISO:

```ts
interface ProductPromo {
  price: number;     // 8990 = R$89,90
  expiresAt: string; // "2026-10-31" — inclusive
}
```

`product.price` **continua sendo o preço original**. A vitrine precisa dos dois para mostrar
o riscado, e manter o original no campo canônico evita quebrar silenciosamente a ordenação
e o filtro de faixa de preço.

ISO `YYYY-MM-DD` em vez de `31/10/26`: compara com `<=` em ordem lexicográfica, o que
dispensa parser e fuso horário, e não é ambíguo entre dia/mês.

**D2 — Funções puras, "hoje" como parâmetro.** `activePromo(product, today)`,
`promoDaysLeft(promo, today)` e `promoDiscountPct(product, promo)` recebem a data; o default
`todayISO()` existe só por conveniência nos componentes. Assim os testes fixam a data e não
quebram em 01/11/2026. `promoDaysLeft` **conta o dia de hoje** (1 = último dia, 0 = vencida)
e faz a conta em UTC nas duas pontas, para horário de verão não deslocar um dia.

**D3 — A promoção entra pelo `basePrice`.** `basePrice` passa a devolver
`variant?.price ?? activePromo(product)?.price ?? product.price`. Com isso o preço
promocional é o preço **real** em carrinho, total, checkout, mensagem do WhatsApp e no
`value` das conversões, sem tocar nesses seis arquivos.

**D4 — Promoção + variantes não é suportado.** `activePromo` devolve `null` quando o produto
tem variantes. Preço de variante é absoluto (D1 do ADR-0005) e venceria a promoção, então o
card anunciaria um desconto que o carrinho não aplica. Falhar explícito no domínio é melhor
que divergência de total.

**D5 — O selo de promoção substitui o "Popular".** Os dois não coexistem: empilhariam no
mesmo canto, e um item em promoção é naturalmente o item popular do momento. O selo mostra o
desconto (`−10%`), e a promoção entra na ordenação **acima** de `featured`.

**D6 — Duas cores, duas informações.** Vermelho (`--promo`) para desconto, âmbar
(`--urgent`) para prazo. São perguntas diferentes ("é barato" vs. "é agora"); com uma cor só,
a contagem de dias vira ruído e não é lida.

**D7 — O preço antigo mora FORA do footer do card.** O footer tem `min-height` fixa e abriga
só o preço efetivo e o botão. O preço riscado e a contagem ficam numa linha acima. Razão: o
footer precisa ter a **mesma altura** com e sem promoção, senão o botão "Adicionar" sai da
linha dos cards vizinhos na grade do desktop.

**D8 — A faixa do topo não é clicável.** Filtrar só promoções exigiria um parâmetro novo na
URL e mexeria no contrato de escritor único do [ADR-0001](0001-filtros-na-url.md). Com
promoção sendo exceção e o item já aparecendo no topo da ordenação (D5), o filtro não se
paga. A faixa lê o **catálogo inteiro**, não a lista filtrada, para não desaparecer quando o
filtro ativo esconde o item em promoção.

## Consequências

- Mudar uma promoção é editar duas linhas em `products.ts`; nenhum componente muda.
- A promoção **expira sozinha**: vencida, `activePromo` devolve `null`, o card volta ao preço
  cheio, o selo e a faixa desaparecem e a ordenação volta ao normal. Não é preciso deploy
  para encerrar — mas é preciso um deploy para **limpar** o campo morto.
- **O relógio é o do visitante.** Build estático não tem hora de servidor. Data errada no
  dispositivo → preço errado para aquele cliente. Aceito: a alternativa (buscar a hora de um
  endpoint no load) adiciona latência e um ponto de falha na vitrine toda, por R$10 de
  diferença. Se promoções virarem rotina ou os valores crescerem, revisar.
- `price-asc`/`price-desc` e o filtro de faixa passam a usar o preço **efetivo**, que é o
  anunciado no card. Um item promocional pode mudar de faixa de preço durante a promoção.
- Promoção com variantes fica pendente de decisão (D4). Se for preciso, o caminho é promoção
  **por variante**, não por produto.
