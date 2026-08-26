# ADR-0009 — Migração para Next.js (App Router)

- **Status:** Proposto — 2026-08-25 (vira *Aceito* no merge do PR)
- **Contexto do projeto:** SPA em Create React App (React 18.2, TS 4.9), **sem router**, sem
  lib de estado, sem backend. Build estático na Vercel. Zero dependências de runtime além de
  `react`/`react-dom`.
- **Revisa:** [ADR-0001](0001-filtros-na-url.md) · [ADR-0004](0004-navegacao-entre-itens-no-dialogo.md) · [ADR-0007](0007-carregamento-de-imagens.md)
- **Escopo da versão:** [escopo-v1.2.md](../escopo-v1.2.md)

## Contexto

### O que motivou

O objetivo declarado da v1.2 é **busca orgânica e qualidade dos anúncios no Google**. Três
defeitos estruturais impedem isso hoje, e **nenhum deles se resolve dentro do CRA**:

1. **A página é HTML vazio.** [`public/index.html`](../../public/index.html) entrega
   `<div id="root"></div>`; todo o conteúdo nasce de 215 KB de JS no cliente (CSR). O
   Googlebot até executa JS, mas numa fila separada, com atraso e menor confiabilidade —
   e não há uma linha de texto de produto no código-fonte.
2. **Produto não tem endereço próprio.** O item aberto vive em `?item=<id>` sobre uma rota
   única ([ADR-0004](0004-navegacao-entre-itens-no-dialogo.md), D6). Sem URL por produto,
   nenhum buquê pode ranquear individualmente.
3. **O preview de link é único e genérico.** As tags Open Graph são estáticas no
   `index.html`. Qualquer link compartilhado no WhatsApp — inclusive `?item=40` — mostra o
   mesmo card "Madiba Garden — Buquês & Cestas". Num negócio cujo funil **termina no
   WhatsApp**, isso é perda direta de conversão.

Somam-se dois problemas de custo:

4. **Imagens cruas.** 4,3 MB em `public/images`, servidas como `<img>` sem `srcset` nem
   formato moderno. LCP ruim penaliza o Índice de qualidade do Google Ads
   ([ADR-0008](0008-conversoes-google-ads.md)) → CPC mais caro pelo mesmo clique.
5. **CRA descontinuado.** `react-scripts@5.0.1` é de 2022 e saiu da documentação oficial do
   React. O custo já é visível: TypeScript preso em ~4.9, `ignoreDeprecations: "6.0"` no
   `tsconfig.json`, `overrides` de `typescript` no `package.json`, e `@types/react`
   desalinhado (pendência aberta em [escopo-v1.md](../escopo-v1.md)).

### O que o projeto tem a favor

- **Zero dependências de runtime** além do React — nada para quebrar por incompatibilidade.
- Domínio já isolado em **funções puras** (`filterParams.ts`, `checkoutMessage.ts`,
  `frete.ts`): portam sem uma linha alterada.
- **Nenhum padrão removido no React 19** em uso (`defaultProps`, `propTypes`, string refs,
  class components) — verificado no código.
- Deploy já na Vercel.

### O destino de longo prazo

A v1.2 é o primeiro passo de um roteiro acordado: v1.3 (produtos no servidor), v1.4
(entregas), v1.5 (pagamento online) — ver [escopo-v1.2.md](../escopo-v1.2.md). Isso **não é
justificativa** da migração; o SEO se sustenta sozinho. Mas decide escolhas abaixo,
sobretudo D2.

Nota: o [ADR-0006](0006-frete-por-distancia.md) já aceitou (2026-07-06) uma **função
serverless** `/api/frete` com chave de provedor no servidor — o invariante "100% estático"
já estava rompido por decisão anterior. No Next, aquilo vira um **Route Handler** nativo, sem
`vercel dev` à parte.

## Decisão

### D1 — Next.js, App Router

Pages Router está excluído: é o modelo legado, não tem Server Components nem
*intercepting routes* (que D5 usa), e **proíbe import de CSS global fora do `_app`** — o
projeto tem **15** imports de `.css` dentro de componentes.

### D2 — SSG por padrão; **sem** `output: "export"`

O app roda como aplicação Next na Vercel, não como export estático puro. Na v1.2 o dado ainda
vem de [`src/data/products.ts`](../../src/data/products.ts), então o build gera HTML estático
de qualquer forma — a diferença é que **não fechamos a porta**: ISR, Route Handlers e Server
Actions ficam disponíveis na v1.3/v1.4 **sem uma segunda migração**. Custo aceito: mais
acoplamento à Vercel (ver Consequências).

### D3 — Rotas

| Rota | Renderização | Indexável |
|---|---|---|
| `/` (catálogo) | SSG — todos os produtos no HTML | sim |
| `/buques`, `/buques-cetim`, `/cestas`, `/doces` | SSG — lista da categoria (D10) | sim |
| `/produto/[slug]` | SSG via `generateStaticParams` | sim |
| `/carrinho` | client, interceptada (D5) | `noindex` |
| `/checkout` | client | `noindex` |

### D4 — Slug estável, e `?item=` não morre

`Product` ganha um campo **`slug` explícito e imutável** (ex.: `"buque-3-rosas-vermelhas-importadas"`).
**Não** derivar do `name` em runtime: nome é texto de vitrine e muda; URL indexada não pode.

Links `?item=<id>` já compartilhados no WhatsApp recebem **redirect 301** para o slug
correspondente — o mapa `id → slug` já existe em `products.ts`. Link compartilhado é ativo do
negócio; nenhum pode virar 404.

### D5 — O diálogo vira Intercepting Route; `overlayHistory.ts` é **deletado**

Esta é a decisão central da migração.

Hoje o diálogo é um overlay que **finge ser navegação**: `pushState({ overlay: true })` em
[`overlayHistory.ts`](../../src/overlayHistory.ts) + listeners de `popstate` espalhados por
[`App.tsx`](../../src/App.tsx), [`CartContext.tsx`](../../src/context/CartContext.tsx) e
[`ExtrasDialog.tsx`](../../src/components/ExtrasDialog.tsx). É engenhoso — e é o **maior
risco** da migração, porque o App Router também guarda estado interno em
`window.history.state`. Portar o truque seria disputar território com o roteador.

Em vez disso, ele é substituído pelo recurso nativo feito exatamente para este caso —
**Parallel + Intercepting Routes** (slot `@modal` + segmento `(.)produto/[slug]`):

- clique no card → URL vira `/produto/<slug>`, renderizado **como modal sobre o catálogo**
  (comportamento visual idêntico ao de hoje);
- acesso direto, reload ou crawler → **página inteira** de produto, estática e indexável;
- **o "voltar" do celular passa a ser navegação real do router** — sem `pushState` manual,
  sem `popstate`, sem `history.state.overlay`.

Mesmo tratamento para o carrinho (`/carrinho`, interceptado → drawer). O checkout, que já é
view de tela cheia (`view === "checkout"` em `App.tsx`), vira rota real `/checkout`.

**Resultado: `src/overlayHistory.ts` deixa de existir** — o maior risco técnico vira uma
deleção de código, não uma reescrita.

### D6 — Lightbox: o único overlay que permanece client

O zoom da imagem ([`ImageLightbox.tsx`](../../src/components/ImageLightbox.tsx)) é
modal-sobre-modal; virar rota é desproporcional. Continua overlay client, **e mantém a
integração com o "voltar"** — tentar fechar o zoom com a seta do telefone é o comportamento
que o usuário espera, e não será sacrificado pela migração.

**Regra obrigatória:** o `pushState` precisa **preservar** o state do Next —
`{ ...window.history.state, zoom: true }` — nunca sobrescrevê-lo como hoje
([`ExtrasDialog.tsx:216`](../../src/components/ExtrasDialog.tsx)). Sobrescrever apaga a
árvore de rotas interna do App Router e quebra o back/forward do **roteador inteiro**, não só
o do lightbox. É o único ponto do código onde ainda tocamos `history` na mão — por isso a
regra vira item de revisão de PR.

**Verificação obrigatória em QA:** abrir produto → zoom → "voltar" fecha **só** o zoom
(diálogo permanece) → "voltar" de novo fecha o diálogo e volta ao catálogo. Em iOS Safari
**e** Chrome Android.

### D7 — `next/image` em toda mídia

Substitui `<img>` em `ProductCard`, `ExtrasDialog` (mídia principal + carrosséis de plaquinha
e balão) e `ImageLightbox`. Traz AVIF/WebP, `srcset` e dimensionamento automáticos.
**Revisa o [ADR-0007](0007-carregamento-de-imagens.md)** — seu baseline (`loading="lazy"`
nativo, sem lib nova) fica absorvido pelo framework — e **fecha o card #14** da v1.1.

### D8 — SEO técnico

- **Metadata API** em `app/layout.tsx` substitui as tags de `public/index.html`.
- **`generateMetadata()` por produto**: `title`, `description` e **OG com a foto do produto**
  — resolve o defeito 3 do Contexto.
- **`app/sitemap.ts`** e **`app/robots.ts`** gerados.
- **JSON-LD**: `Product` (com `offers` e preço) nas páginas de produto; `LocalBusiness` no
  layout. É também o insumo estruturado que o Google Merchant Center vai exigir na v1.5.

### D9 — Filtros: princípio mantido, mecanismo trocado

O [ADR-0001](0001-filtros-na-url.md) continua valendo no que importa: filtro é **estado de
navegação**, mora na **query string**, em tokens PT-BR, canônica e auto-limpante. Muda só a
mecânica: `URLSearchParams` + `history.replaceState` na mão → **`useSearchParams()`** +
`router.replace(url, { scroll: false })`.

**Restrição crítica:** `useSearchParams()` empurra a rota para renderização dinâmica. Para `/`
continuar SSG — que é o ponto da migração — o consumo dos params fica **dentro de um Client
Component sob `<Suspense>`**, e a página renderiza **todos os produtos** no HTML estático.
Numa URL filtrada, a lista completa aparece por um instante antes de o filtro aplicar no
cliente: comportamento idêntico ao de hoje (CSR) e irrelevante para o crawler, que vê os 40
produtos.

### D10 — Categorias como rotas indexáveis

`/buques`, `/buques-cetim`, `/cestas`, `/doces` viram rotas SSG que renderizam a lista já
filtrada **no servidor**, cada uma com `<h1>`, `title` e `description` próprios. É o que
permite ranquear em "buquê de rosas <cidade>" em vez de depender só da home.

**Efeito sobre o [ADR-0001](0001-filtros-na-url.md):** `categoria` **deixa de ser query param
e vira segmento de rota**. Os demais filtros continuam na query. A régua:

| Dimensão | Onde mora | Por quê |
|---|---|---|
| `categoria` | **segmento de rota** (`/buques`) | é um *lugar*: tem página, título e intenção de busca próprios |
| `preco`, `ordem`, `q` | query string (como hoje) | são *refinamentos de uma vista*: mesmo conteúdo, outra apresentação — sem valor de SEO |

**Regra de URL canônica** — evita que o Google veja o mesmo conteúdo em endereços diferentes
e divida o sinal entre eles:

1. `/`, as quatro categorias e `/produto/<slug>` são **canônicas de si mesmas**.
2. `?categoria=<x>` na home → **301 para `/<x>`**. O duplicado é eliminado na origem, não
   apenas sinalizado — redirect é **diretiva**, `canonical` é só **dica** que o Google pode
   ignorar. Mesmo mecanismo do 301 de `?item=` (D4).
3. `?preco=`, `?ordem=`, `?q=` **não criam URL nova aos olhos do Google**: são consumidos no
   cliente sobre HTML estático, então toda variante serve o **mesmo arquivo**, que declara
   `canonical` da rota sem query. Isso não exige código — exige **não** emitir canonical
   dinâmico (que forçaria render dinâmico e derrubaria o SSG, contra D9).
4. `sitemap.ts` lista **apenas** canônicas: `/`, as quatro categorias e os produtos. Nenhuma
   variante com query.
5. Os chips de categoria da `FilterBar` viram `<Link href="/buques">` — **navegação**, não
   mudança de estado. Os demais controles seguem escrevendo query.

Efeito colateral bem-vindo: o [ADR-0007](0007-carregamento-de-imagens.md) previa "segmentação
por categoria" como dívida futura para quando a grade única pesasse. As rotas de categoria
entregam isso de graça — cada rota renderiza só os seus produtos.

## Consequências

**Positivas**
- Conteúdo no HTML: produto indexável, com nome, descrição e preço no código-fonte.
- **Preview de link por produto no WhatsApp** — ganho direto no canal principal do negócio.
- `next/image`: menos bytes, LCP melhor, Índice de qualidade do Ads melhor → CPC menor.
- **Menos código de risco**: `overlayHistory.ts` deletado e três listeners de `popstate`
  removidos.
- Sai do CRA: TypeScript, React e toolchain voltam a acompanhar as versões correntes.
- Infra pronta para v1.3–v1.5 (inclusive o `/api/frete` do ADR-0006) sem outra migração.

**Negativas / custos**
- Modelo mental novo: Server vs. Client Components e o **cache do App Router** — a maior
  fonte de bug e confusão do framework.
- Mais acoplamento à Vercel (D2). Aceito: v1.4/v1.5 exigem servidor de qualquer forma.
- O runtime do App Router é maior que os 215 KB atuais **se tudo virar client**; o ganho
  depende de manter Server Components de verdade.
- Todo o CSS de mídia (`card__img-wrap`, `object-fit`, aspect ratios — 2.368 linhas de CSS)
  precisa ser reconferido contra o wrapper do `next/image`.
- Upgrade React 18.2 → 19 embutido: sem bloqueadores detectados, mas é superfície de regressão.
- Janela em que a v1.1 segue em produção: hotfix precisa ser aplicado nas duas bases
  (mitigação em [escopo-v1.2.md](../escopo-v1.2.md)).

## Alternativas consideradas

- **Vite + React.** Resolve o "CRA descontinuado" em poucas horas, sem risco e sem invalidar
  ADR nenhum. **Rejeitada:** não entrega SSR/SSG e portanto não resolve **nenhum** dos três
  defeitos de SEO — que são o objetivo da versão.
- **Ficar no CRA + serviço de prerender para bots.** Mantém duas verdades (HTML pro robô,
  SPA pro humano), custo recorrente e fragilidade perante mudança de política do Google.
  Rejeitada.
- **Next com `output: "export"`.** Mantém deploy 100% estático e portável. Rejeitada por D2:
  fecharia a porta de ISR/Route Handlers e obrigaria uma segunda migração na v1.3/v1.4.
- **Pages Router.** Curva menor. Rejeitada: legado, sem intercepting routes (D5), e quebra os
  15 imports de CSS global.
- **Astro.** Ótimo para conteúdo estático. Rejeitada: o app é fortemente interativo (carrinho,
  diálogo, checkout) e o destino é transacional — as "ilhas" seriam a aplicação inteira.
- **Portar `overlayHistory.ts` como está.** Rejeitada por D5: manteria a colisão com o
  `history.state` do router e desperdiçaria a chance de ter rotas indexáveis de produto.

## Notas de implementação

- **Ordem inegociável:** scaffold → mover `src/` → `app/layout.tsx` com a metadata do
  `index.html` → `app/page.tsx` funcionando com tudo `"use client"` → **build verde + E2E
  verdes** → só então refinar (server/client split, `next/image`, intercepting routes,
  JSON-LD). Lift-and-shift primeiro; otimização depois.
- **E2E antes de tudo** (Playwright), escritos **contra o app CRA atual**: filtro→URL,
  `?item=` reabre no reload, **"voltar" fecha overlay**, carrinho→checkout→URL do `wa.me`,
  banner LGPD recusado ⇒ nenhum script de terceiro. São o **contrato de aceite** da migração.
- **`useFilter`:** hoje lê `window.location.search` no *initializer* do `useState`
  ([`useFilter.ts:33`](../../src/hooks/useFilter.ts)) — mismatch garantido na hidratação.
  Migrar para `useSearchParams` sob `<Suspense>` (D9).
- **Env:** `REACT_APP_FB_PIXEL_ID` → `NEXT_PUBLIC_FB_PIXEL_ID`; `REACT_APP_GADS_SEND_TO` →
  `NEXT_PUBLIC_GADS_SEND_TO`. Reconfigurar na Vercel (Production **e** Preview) e **refazer o
  deploy** — ambos são inlinados no build.
- **Analytics:** [`metaPixel.ts`](../../src/lib/analytics/metaPixel.ts) e
  [`googleAds.ts`](../../src/lib/analytics/googleAds.ts) injetam script à mão em
  `document.head`; seguem funcionando em client components. Avaliar `next/script` com
  `strategy="afterInteractive"`. O opt-in dos ADR-0003/0008 **não muda**.
- **`vercel.json`:** o header de cache de `/vids/(.*)` migra para `headers()` no `next.config`.
- **`products.ts` congelado** durante a janela: idêntico byte a byte nas duas bases, para
  hotfix de catálogo aplicar limpo (`git checkout main -- src/data/products.ts`).
- **Baseline antes de começar:** Lighthouse/PageSpeed em produção (LCP, CLS, TBT, peso) +
  print do Search Console. Sem número de "antes", não há como provar o ganho.
- **Testes:** `react-scripts test` sai; entra **Vitest**. Os dois arquivos existentes são de
  funções puras e passam sem alteração.
- **QA obrigatório** nos aparelhos de [aparelhos-suportados.md](../aparelhos-suportados.md),
  com foco no "voltar" em iOS Safari e Chrome Android.
- **Rollback:** promoção `main → production` só com permissão humana
  ([branches-e-deploy.md](../branches-e-deploy.md)); o deploy anterior da Vercel volta em um
  clique pelo painel.

## Pontos resolvidos na redação (2026-08-25)

Registrados aqui porque foram decididos **depois** do primeiro rascunho — o texto acima já
reflete todos.

- **D10 — confirmado.** Categorias viram rotas indexáveis, com a regra de canônica acima.
  Consequência: `categoria` sai da query e vira rota, revisando o [ADR-0001](0001-filtros-na-url.md).
- **D6 — confirmado.** O lightbox mantém a integração com o "voltar": fechar overlay com a
  seta do telefone é comportamento esperado e não se sacrifica por conveniência de migração.
- **[ADR-0007](0007-carregamento-de-imagens.md) — revisado, não substituído.** O princípio
  (imagem de conteúdo nasce adiada) continua; o `next/image` passa a ser o mecanismo.
- **[ADR-0006](0006-frete-por-distancia.md) — dorme até a v1.4.** Está aceito desde
  2026-07-06, mas vive só na branch `feat/frete-distancia`, fora da `main` — por isso **não**
  aparece no índice do [README](../README.md). A ausência é **decisão consciente**, não
  esquecimento: a documentação é mergeada quando a v1.4 abrir, junto do código de frete que
  a acompanha.
