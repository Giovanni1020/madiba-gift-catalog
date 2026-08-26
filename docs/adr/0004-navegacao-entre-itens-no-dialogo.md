# ADR-0004 — Navegação entre itens dentro do diálogo (swipe/setas) + `?item=` na URL

- **Status:** Aceito — 2026-06-07 · **revisado em 2026-08-25** por [ADR-0009](0009-migracao-nextjs.md) (D6 substituído)
- **Contexto do projeto:** SPA em Create React App (React 18.2, TS 4.9), **sem router** e
  **sem lib de estado**. Jornada majoritariamente mobile (ver [aparelhos-suportados.md](../aparelhos-suportados.md)).

## Contexto

Hoje, para olhar outro produto, o cliente precisa **fechar o `BuqueExtrasDialog` e abrir
outro card**. Isso quebra o ritmo de navegação — o catálogo tem ~20 itens e a jornada é de
"vitrine". Queremos um movimento **estilo reels**: trocar de item **dentro do diálogo já
aberto**, por **swipe horizontal** (mobile) e **setas ←/→** (desktop), sem fechar/reabrir.

Restrições que o código atual impõe (e que viram trade-off):

- O diálogo só conhece **um** `product` ([`BuqueExtrasDialog.tsx:96`](../../src/components/BuqueExtrasDialog.tsx)); o `App`
  passa `extrasProduct` solto ([`App.tsx:88`](../../src/App.tsx)). Navegar exige conhecer a **lista** e o **índice**.
- Já existe um gesto de arraste **vertical** na mídia e no header (↑ minimiza / ↓ expande —
  [`BuqueExtrasDialog.tsx:222-259`](../../src/components/BuqueExtrasDialog.tsx)). O gesto novo é **horizontal** e precisa conviver.
- O `useFilter` reescreve a query string e **limpa params desconhecidos** ([ADR-0001](0001-filtros-na-url.md)) — um
  `?item=` ingênuo seria **apagado** na próxima mudança de filtro.

## Decisão

**D1 — Contrato.** O diálogo deixa de ser "burro de 1 produto": o `App` (dono de
`filter.filtered`) passa a **lista** e o **produto atual**, mais `onPrev`/`onNext` (ou
`onNavigate`) e `hasPrev`/`hasNext`. O índice é calculado no `App`, não no diálogo.

**D2 — Lista percorrida.** É a **lista filtrada/ordenada atual** (`filter.filtered`). O
`CustomBuqueCard` é injetado só na grade ([`ProductGrid.tsx:38`](../../src/components/ProductGrid.tsx)) e **não** entra na sequência.

**D3 — Interação.** Swipe **horizontal** na **área da mídia** e no **backdrop** (perdoa
toques fora do modal). O **eixo dominante** decide: `|dx| > |dy|` → troca de item; vertical
segue minimizando/expandindo a mídia. No backdrop, **tap** (sem movimento) fecha como hoje;
**swipe** navega. No teclado, **←/→** trocam de item, **ignorando** quando o foco está em
`<select>`/`<input>`/`<textarea>` (senão sequestram a troca de opção do balão/plaquinha).

**D4 — Transição.** **Fade rápido** entre itens (sem slide — o corpo do diálogo é pesado).
`prefers-reduced-motion` → sem fade.

**D5 — Pontas.** **Parar** no primeiro/último (sem loop). Seta da ponta fica
escondida/desabilitada.

**D6 — Estado + URL.** O produto aberto continua **efêmero** no React, **espelhado** na URL
como `?item=<id>` via **`replaceState`** (entra na URL, **não empilha** histórico — coerente
com a ADR-0001). Benefício: **link compartilhável do produto** (ótimo pro WhatsApp) e
**sobrevive a reload**. Para não ser apagado pela auto-limpeza dos filtros, `item` vira um
**param conhecido** do pipeline de `filterParams`.

**D7 — Adicionais ao trocar.** **Descartados** — reaproveita o reset por `product.id` que já
existe ([`BuqueExtrasDialog.tsx:149-161`](../../src/components/BuqueExtrasDialog.tsx)). Navegar é "olhar"; configurar vem depois.

## Consequências

**Positivas**
- Navegação fluida; some a fricção de fechar/reabrir — é o objetivo de UX.
- Link compartilhável + sobrevive a reload, sem adicionar router (alinha ADR-0001).
- Reaproveita o reset de estado e o `ViewContent` já dispara por troca de produto
  ([`BuqueExtrasDialog.tsx:164-175`](../../src/components/BuqueExtrasDialog.tsx)).
- Zero dependência nova (CSS + History API + pointer events).

**Negativas / custos**
- Perde adicionais em andamento ao trocar (decisão consciente — D7).
- Acopla o diálogo à lista: contrato maior do que "1 produto".
- `?item=` vira **segundo escritor** da URL junto com os filtros → coordenação obrigatória
  em `filterParams` (risco de clobber).
- Dois eixos de gesto na mesma superfície → desambiguação por eixo (mais lógica de ponteiro).
- Setas de teclado exigem guard de foco para não brigar com os `<select>`.

## Alternativas consideradas

- **Visualizador/reels separado em tela cheia:** reescreve UI e amplia escopo; o valor está
  em navegar o **diálogo que já existe**. Rejeitada.
- **Estado puramente efêmero (sem URL):** mais simples, mas perde share/reload — e o catálogo
  vive de mandar **o item** no WhatsApp. Rejeitada em favor do `?item=` com `replaceState`.
- **Slide real estilo reels:** custo de perf no diálogo pesado; o fade entrega o essencial.
  Reavaliar se a navegação parecer "seca".
- **Loop nas pontas:** mais "infinito", porém desorientador num catálogo finito. Rejeitada.
- **Preservar rascunho de adicionais por item:** estado por item, complexidade alta para
  ganho incerto. Adiada.

## Notas de implementação

- **`App`:** passa `products = filter.filtered` + `product` atual; deriva prev/next; expõe
  `onNavigate`. Mantém o overlay único do histórico ([`overlayHistory.ts`](../../src/overlayHistory.ts)) — navegar **não**
  mexe no histórico, só no `?item=` via `replaceState`.
- **Seed no mount:** ler `?item=` e abrir o diálogo no produto correspondente **se** existir
  na lista atual; id inválido/ausente → ignora (defensivo, igual à auto-limpeza do ADR-0001).
- **`filterParams.ts`:** incluir `item` como param **preservado** no serialize/parse, para a
  mudança de filtro não apagá-lo.
- **Gesto:** estender os pointer handlers existentes ([`BuqueExtrasDialog.tsx:226-259`](../../src/components/BuqueExtrasDialog.tsx)) para
  medir `dx` também; eixo dominante decide navegar vs. redimensionar a mídia.
- **Teclado:** no `keydown`, pular quando `document.activeElement` for `SELECT`/`INPUT`/
  `TEXTAREA`; ←/→ chamam prev/next. Molde: o handler de `Esc` já existente.
- **`ViewContent`:** **debounce** (~300–500 ms) para não floodar a Meta no swipe rápido.
- **Reset de scroll** do `bed__body` ao trocar de item (não cair no meio do formulário).
- **A11y:** `aria-live` anuncia o novo produto; foco volta a um ponto estável (ex.: título)
  na troca.

## Revisão — 2026-08-25 ([ADR-0009](0009-migracao-nextjs.md))

A migração mantém **toda a UX** decidida aqui e **substitui o mecanismo** que a sustenta.

**Continua valendo:** D1 (contrato lista + índice), D2 (percorre a lista filtrada), D3
(swipe/setas, eixo dominante, guard de foco em `<select>`/`<input>`), D4 (fade + `prefers-reduced-motion`),
D5 (para nas pontas, sem loop) e D7 (descarta adicionais ao trocar). Nada disso depende de
framework.

**D6 é substituído:**

| Antes | Depois |
|---|---|
| Produto aberto = estado React espelhado em `?item=<id>` via `replaceState` | Produto aberto = **rota real** `/produto/<slug>` |
| Diálogo = overlay que finge navegação (`pushState({ overlay: true })`) | Diálogo = **Intercepting Route** (`@modal` + `(.)produto/[slug]`) |
| "Voltar" tratado à mão por 3 listeners de `popstate` | "Voltar" é **navegação nativa do router** |
| `item` como param preservado no pipeline de `filterParams` | Sai da query — deixa de disputar espaço com os filtros |
| Link compartilhável = SPA que precisa de JS para montar o produto | Link compartilhável = **página estática indexável, com OG próprio** |

**Por que a troca é ganho, não só adaptação:**

- Resolve uma colisão real: hoje gravamos estado nosso em `window.history.state`, que é
  justamente onde o App Router guarda o dele.
- **Elimina** [`overlayHistory.ts`](../../src/overlayHistory.ts) e os listeners de `popstate`
  em `App.tsx`, `CartContext.tsx` e `ExtrasDialog.tsx`.
- Some o "**segundo escritor da URL**" listado nas Consequências negativas — o risco de
  clobber entre `?item=` e os filtros deixa de existir por construção.
- O objetivo original de D6 (*"link compartilhável do produto, ótimo pro WhatsApp"*) passa a
  ser entregue **de verdade**: com preview próprio do produto, não com o card genérico do site.

**O que sobra do mecanismo antigo:** apenas o zoom da imagem (`ImageLightbox`), tratado em
ADR-0009 D6 — com a regra de **preservar** `window.history.state` em vez de sobrescrevê-lo.

**Compatibilidade obrigatória:** `?item=<id>` já circula em conversas de WhatsApp. ADR-0009 D4
exige **redirect 301** para o slug — nenhum link já compartilhado pode virar 404.
