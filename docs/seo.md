# SEO do site — plano

> **O que este documento é:** o **plano** para tirar o site (`https://madibagarden.com/`) da
> invisibilidade na busca orgânica do Google. Diagnóstico medido + tarefas em ordem + estado
> de cada uma.
>
> **O que ele não é:** não cobre o que é do Google mas não é do site — Perfil da Empresa,
> bloco "Locais", Shopping, Ads. Isso vive em [`google-canais.md`](google-canais.md), que é
> um manual não-técnico. São dois canais distintos, com ferramentas e prazos distintos.
>
> **Estado medido em 2026-08-27**, contra o build em produção e o código da `main`.
> Toda afirmação de estado foi verificada no código ou no HTML servido.

## Como ler o estado das tarefas

Parte deste plano foi adiantada antes de o plano existir: o [ADR-0009](adr/0009-migracao-nextjs.md)
e o [`escopo-v1.2.md`](escopo-v1.2.md) (mergeados em 2026-08-25) já registram as decisões da
migração para Next.js. O plano **absorve** essas decisões — elas aparecem aqui marcadas, não
re-discutidas. Discordância com uma delas se resolve revisando o ADR, não ignorando-o.

| Marca | Significado |
|---|---|
| ✅ | **Feito em código** — está na `main` / em produção. |
| 📋 | **Decidido no papel** — registrado em ADR/escopo, mas **nenhuma linha de código existe**. |
| ⏳ | **Pendente** — nem decidido formalmente, nem executado. |
| ⏸️ | **Adiado de propósito** — fazer agora seria retrabalho (o motivo está no item). |

**Ponto de partida honesto (2026-08-27):** a migração inteira está em 📋. A `main` ainda é
CRA (`react-scripts 5.0.1`) e não existe branch de Next.js. O que já está ✅ é pouco e
pontual: redirect do domínio, lazy loading ([ADR-0007](adr/0007-carregamento-de-imagens.md))
e a instrumentação de conversão do Ads ([ADR-0008](adr/0008-conversoes-google-ads.md)).

---

## Parte 1 — Diagnóstico

### 1.1 O que NÃO é problema

Começar por aqui evita gastar esforço no lugar errado.

| Suspeita | Realidade |
|---|---|
| **"O checkout sai para o WhatsApp — isso prejudica o ranking."** | **Não.** O Google não tem sinal de ranqueamento para "a venda fecha dentro do site". Ele indexa e ranqueia **conteúdo**. Checkout interno **não subiria uma posição**. (Onde o WhatsApp *de fato* custa algo é no Merchant Center — ver [`google-canais.md`](google-canais.md).) |
| **Domínio duplicado** (`.vercel.app` + `madibagarden.com`) | ✅ Resolvido. `madiba-garden.vercel.app` responde **308** para o domínio canônico. |
| **`robots.txt` bloqueando algo** | [`robots.txt`](../public/robots.txt) é `User-agent: * / Allow: /`. Correto. |
| **Peso do bundle** | `main.js` = **214 KB** servido. Não é o gargalo de indexação. (É custo de LCP — pesa no Índice de qualidade do Ads.) |
| **Imagens carregando de uma vez** | ✅ Já resolvido — `loading="lazy"` como baseline ([ADR-0007](adr/0007-carregamento-de-imagens.md)). |
| **Telefone divergente entre site e Google** | ✅ Batem. [`config.ts`](../src/config.ts) tem `555186103494` = (51) 98610-3494, igual ao do Perfil da Empresa. |

**Conclusão:** não é performance nem configuração. É **arquitetura de URL e ausência de conteúdo**.

### 1.2 O gargalo central: uma URL só

O app é **CRA com CSR puro** — sem SSR, sem prerender, sem geração estática. O HTML servido
em produção é o shell:

```html
<div id="root"></div>
<script defer src="/static/js/main.bcdabd30.js"></script>
```

E o estado de navegação **não cria URL nova**:

| O que o usuário navega | Como vive na URL | Para o Google |
|---|---|---|
| Produto aberto | `?item=<id>` via `replaceState` ([ADR-0004](adr/0004-navegacao-entre-itens-no-dialogo.md)) | Não é rota. Não é descoberta. |
| Categoria / preço / ordem / busca | `?categoria=`, `?preco=`, `?ordem=`, `?busca=` ([ADR-0001](adr/0001-filtros-na-url.md)) | Idem. |
| Checkout | View em estado de componente ([`App.tsx:29`](../src/App.tsx#L29)) | Inexistente. |

**Resultado medido:** os **39 produtos** de [`products.ts`](../src/data/products.ts)
(contagem de 2026-08-27 — o número muda com o catálogo; a fonte é o arquivo) não têm página
nenhuma. O Google conhece **1 (uma)** URL do site.

**Por que isso é fatal:** uma URL compete pelos termos que cabem no seu `<title>`, `<h1>` e
corpo. Não existe página sobre "buquê de girassol com chocolate", então **não há o que
ranquear** para essa busca. Multiplique por ~39 produtos × cada intenção (ocasião, flor, faixa
de preço). Nenhuma meta tag fura esse teto.

**Agravante — nenhum link rastreável:** os cards são `<article>` com `onClick`
([`ProductCard.tsx:69`](../src/components/ProductCard.tsx#L69)), não `<a href>`. Googlebot
segue `href`, não `onClick`. Mesmo renderizando o JS (e ele renderiza), **não há destino para
descobrir**. Os dois problemas se reforçam: criar URLs sem links não resolve, e vice-versa.

**Terceiro efeito, que não é sobre Google:** o preview de link do WhatsApp também sai do
`index.html` único. **Qualquer** link compartilhado — inclusive `?item=40` — mostra o mesmo
card genérico "Madiba Garden — Buquês & Cestas". Num negócio cujo funil fecha no WhatsApp,
isso é perda direta de conversão. E é o ganho de prazo mais curto do plano inteiro: OG por
produto paga em **dias**, não meses.

### 1.3 Estado atual, item por item

| # | Item | Estado | Onde | Resolve sem migrar? |
|---|---|---|---|---|
| 1 | URLs por produto | ❌ Inexistentes | — | **Não** |
| 2 | Links `<a href>` internos | ❌ Nenhum | [`ProductCard.tsx:69`](../src/components/ProductCard.tsx#L69) | **Não** |
| 3 | JSON-LD `Product` / rich result | ❌ Ausente (exige página por produto) | — | **Não** |
| 4 | Open Graph / Twitter Card | ⚠️ Completos, mas **estáticos** — um preview só para o site inteiro | [`index.html`](../public/index.html) | **Não** |
| 5 | `sitemap.xml` | ❌ Devolve `200 text/html` (shell do SPA) | — | Sim, mas ⏸️ (B7) |
| 6 | 404 real | ❌ Qualquer URL devolve `200` com a home → *soft 404* | [`vercel.json`](../vercel.json) | Sim, mas ⏸️ |
| 7 | `<link rel="canonical">` | ❌ Ausente | [`index.html`](../public/index.html) | Sim, mas ⏸️ |
| 8 | `<h1>` | ❌ **Não existe.** Maior heading da página é `<h3>` | [`Header.tsx:6`](../src/components/Header.tsx#L6) | Sim → A1 |
| 9 | JSON-LD do negócio (`Florist`) | ❌ Ausente | — | Sim → A4 |
| 10 | Cidade / região no conteúdo | ❌ **Zero menções** a Alvorada, endereço ou bairro | grep em `src/` + `public/` | Sim → A3, A9 |
| 11 | `<title>` / `description` | ⚠️ Genéricos, sem termo de cabeça nem localidade | [`index.html:42`](../public/index.html#L42) | Sim → A2 |
| 12 | Conteúdo textual | ⚠️ Só nomes e descrições curtas de produto | — | Sim → A9 |
| 13 | `alt` das imagens | ⚠️ Presentes mas rasos (`alt={name}`) | [`ProductCard.tsx:86`](../src/components/ProductCard.tsx#L86) | Sim → A8 |
| 14 | Search Console | ❌ Sem verificação no HTML | — | Sim → A0 |
| 15 | Hierarquia de headings | ⚠️ `h3` sem `h2` acima | [`ProductGrid.tsx`](../src/components/ProductGrid.tsx) | Sim → A8 |
| 16 | `lang` do documento | ✅ `pt-BR` | [`index.html:2`](../public/index.html#L2) | — |

> **Item 10 é o achado mais desproporcional.** A loja fica em **Alvorada/RS** e o site não diz
> isso em lugar nenhum. Busca de flor é busca com localidade. Custa uma tarde e não depende
> de framework nenhum.

---

## Parte 2 — O que já foi adiantado na `main`

Inventário do que existe hoje, para o plano não refazer nem contradizer:

| O quê | Estado | Onde |
|---|---|---|
| Decisão de migrar para **Next.js App Router, SSG, sem `output: "export"`** | 📋 | [ADR-0009](adr/0009-migracao-nextjs.md) D1, D2 |
| Rotas: `/produto/[slug]`, `/buques` etc.; `slug` estável escrito à mão; **301 de `?item=` e `?categoria=`** | 📋 | D3, D4, D10 |
| Diálogo/carrinho viram **intercepting routes**; `overlayHistory.ts` **deletado**; checkout vira rota | 📋 | D5 |
| Lightbox mantém "voltar", preservando `history.state` do Next | 📋 | D6 |
| `next/image` em toda mídia | 📋 | D7 (revisa [ADR-0007](adr/0007-carregamento-de-imagens.md)) |
| Metadata API, `generateMetadata()` por produto (OG com foto), `sitemap.ts`, `robots.ts`, JSON-LD `Product` + negócio | 📋 | D8 |
| Filtros: `useSearchParams` sob `<Suspense>`; regra de canônicas | 📋 | D9, D10 |
| Recorte de entrega: 13 itens, 11 critérios de aceite, janela de convivência com a v1.1 | 📋 | [`escopo-v1.2.md`](escopo-v1.2.md) |
| Revisões formais dos ADRs 0001, 0004 e 0007 | 📋 | seções "Revisão" anexadas em cada um |
| Auditoria do ADR-0009 (fatos conferidos no código; lacunas do D5 fechadas: swipe via `replace`, filtros na query, mecânica dos 301) | 📋 | adendo de 2026-08-27 no próprio [ADR-0009](adr/0009-migracao-nextjs.md) |
| Conversão do Google Ads (gtag, consentimento LGPD) | ✅ | [ADR-0008](adr/0008-conversoes-google-ads.md), [`google-ads.md`](google-ads.md) |
| Lazy loading de imagens (baseline) | ✅ | [ADR-0007](adr/0007-carregamento-de-imagens.md) |
| Redirect 308 `.vercel.app` → domínio | ✅ | Vercel |

**Leitura do inventário:** o adiantamento fechou as perguntas de produto/UX que travavam a
migração (diálogo × página, "voltar" do celular, categoria na URL, slug). O que **não**
começou é a execução — e a Trilha A inteira, que nenhum documento da `main` cobre.

---

## Parte 3 — O plano

### Trilha A — no CRA atual, antes/durante a migração

**O filtro que define esta trilha:** o [`escopo-v1.2.md`](escopo-v1.2.md) declara uma
**janela de convivência** — enquanto a migração é construída, a v1.1 (CRA) segue no ar, e
hotfix é **reaplicado à mão** na base Next. Logo, todo item feito agora é trabalho tocado
duas vezes. A pergunta de corte não é "isso melhora SEO?" — é "**isso sobrevive à
migração?**". Conteúdo sobrevive (migra junto); encanamento que o Next refaz sozinho, não.

Cada item vira uma branch pequena → PR para `main`.

| ID | Estado | Tarefa | Esforço | Sobrevive porque… |
|---|---|---|---|---|
| A0 | ⏳ | **Search Console: verificar propriedade + anotar baseline** (páginas indexadas — deve dar 1 —, consultas, posição média; usar Inspeção de URL para ver como o Google renderiza o SPA) | 1 h | Não é código. E o próprio ADR-0009 exige o baseline ("sem número de antes, não há como provar o ganho"). **Pré-requisito de tudo.** |
| A1 | ⏳ | **`<h1>` real**: transformar a tagline ([`Header.tsx:18`](../src/components/Header.tsx#L18)) em `<h1>` com termo de cabeça + localidade — `Floricultura em Alvorada — Buquês, Cestas e Presentes` — mantendo a aparência via CSS | 30 min | O texto migra; só muda de arquivo. Na migração, cada rota de categoria e produto ganha o seu. |
| A2 | ⏳ | **`<title>`/`description` com intenção de busca.** Hoje: `Madiba Garden — Buquês & Cestas` — não contém "floricultura" nem localidade. Proposta: `Floricultura em Alvorada RS \| Buquês e Cestas — Madiba Garden` + description com entrega e WhatsApp. Atualizar `og:*`/`twitter:*` junto | 30 min | O texto migra para a Metadata API. |
| A3 | ⏳ | **NAP no rodapé**: nome, endereço completo, telefone, horário e área de entrega **em texto no HTML**, idêntico ao Perfil da Empresa. Endereço/horário viram constantes em [`config.ts`](../src/config.ts), junto do `STORE_PHONE` | 2 h | Componente e dado migram inteiros. Resolve o item 10 e alimenta o A4. NAP divergente entre site e Google é sinal ruim — fonte única no código. |
| A4 | ⏳ | **JSON-LD `Florist`** (subtipo de `LocalBusiness` — mais específico, satisfaz o D8): nome, telefone, endereço, `areaServed`, horários, `sameAs` (Instagram/Facebook). Validar em `search.google.com/test/rich-results` antes de dar como pronto | 2 h | O JSON é o mesmo; na migração vira componente do `app/layout.tsx`. `Product` **não** entra aqui — exige página por produto (fica na Trilha B). |
| A8 | ⏳ | **Headings + `alt`**: `<h2>` de seção acima da grade ([`ProductGrid.tsx`](../src/components/ProductGrid.tsx)); `alt` descritivo em vez de `alt={name}` — descrever o que se vê. Alimenta o Google Imagens, que para floricultura é tráfego real | 2 h | Conteúdo puro; o `alt` sobrevive ao `next/image`. |
| A9 | ⏳ | **Conteúdo com localidade**: duas seções na home — "Sobre a loja" (texto, foto da fachada, história) e "Área e condições de entrega" (a busca de maior intenção de compra do setor) | 1 dia | Conteúdo puro — e é o item de maturação mais lenta (semanas para indexar). Quanto antes no ar, melhor. |
| A5 | ⏸️ | ~~`canonical` único na raiz~~ | — | A regra inteira mudou no D10 (canônica por rota + **301** de `?categoria=`, que é diretiva, não dica). Fazer a versão de agora seria escrever a regra errada. |
| A6 | ⏸️ | ~~`sitemap.xml` à mão em `public/`~~ | — | Com 1 URL é inútil para descoberta, e o D8 já prevê `app/sitemap.ts` **gerado** de `PRODUCTS`. 100% descartado na migração. A verificação do GSC (A0) não depende dele. |
| A7 | ⏸️ | ~~404 real via `vercel.json`~~ | — | O `vercel.json` **deixa de existir** na migração (escopo v1.2, item 12) e o Next trata rota inexistente nativamente. **Exceção:** se a migração escorregar além de ~2 meses, o *soft 404* volta a valer 1 h de conserto — ele corrói a confiança do site inteiro. |

**Total da trilha filtrada (A0–A4, A8, A9):** ~1,5 dia de código + 1 dia de escrita.
Não quebra o teto de uma URL, mas tira o site do chão e constrói o baseline.

### Trilha B — a migração (v1.2)

Os itens abaixo são o escopo fechado do [`escopo-v1.2.md`](escopo-v1.2.md), reproduzidos aqui
**só como checklist de acompanhamento** — a especificação de cada um vive lá e no
[ADR-0009](adr/0009-migracao-nextjs.md). Todos em 📋: decididos, nada executado.

| # | Estado | Item |
|---|---|---|
| B1 | 📋 | E2E (Playwright) escritos **contra o app CRA atual** — o contrato de aceite da migração. **O roteiro inclui os casos do adendo de 2026-08-27 do [ADR-0009](adr/0009-migracao-nextjs.md)** (trocar de item no diálogo + "voltar"; reload com filtro ativo e produto aberto) |
| B2 | 📋 | Baseline de métricas: Lighthouse/PageSpeed em produção + Search Console (**= A0 deste plano**) |
| B3 | 📋 | Scaffold Next.js App Router; `react-scripts` → Next; testes → Vitest |
| B4 | 📋 | Lift-and-shift: paridade total com tudo `"use client"`, build verde, E2E verdes |
| B5 | 📋 | `useFilter` → `useSearchParams` sob `<Suspense>` |
| B6 | 📋 | `slug` em `Product`; `/produto/[slug]` SSG; **301 de `?item=`** (mecânica: ver adendo do ADR-0009, ponto 3) |
| B7 | 📋 | Rotas de categoria SSG; chips viram `<Link>`; **301 de `?categoria=`**; sitemap/robots gerados |
| B8 | 📋 | Diálogo/carrinho/checkout viram rotas (intercepting); `overlayHistory.ts` deletado — **conforme adendo do ADR-0009** (swipe via `router.replace`; filtros acompanham na query) |
| B9 | 📋 | `next/image` em toda mídia + revisão do CSS de imagem |
| B10 | 📋 | `generateMetadata()` por produto (**OG com a foto**), JSON-LD `Product` + negócio |
| B11 | 📋 | Env `REACT_APP_*` → `NEXT_PUBLIC_*` (local + Vercel) |
| B12 | 📋 | `vercel.json` → `headers()` no `next.config` |
| B13 | 📋 | QA nos aparelhos de [aparelhos-suportados.md](aparelhos-suportados.md), foco no "voltar" |

**A ordem B1 → B2 → B3/B4 → resto é inegociável** (ADR-0009, Notas): paridade primeiro com
tudo `"use client"`, otimização depois. Misturar as duas etapas é o jeito garantido de não
saber o que quebrou.

**Onde o custo realmente está** — não é "aprender Next":

| Parte | Custo | Por quê |
|---|---|---|
| **B1 — a suíte E2E** | Alto, e vem antes de tudo | Escrever teste para comportamento que ninguém documentou (filtro→URL, `?item=` no reload, "voltar" fecha overlay, funil do `wa.me`, banner LGPD) é o trabalho subestimado. |
| **CSS de mídia × `next/image`** | Alto | 2.368 linhas de CSS; aspect ratios e `object-fit` reconferidos contra o wrapper injetado. |
| **Cache do App Router** | Médio, difuso | Não é uma tarefa; é onde o tempo some. |
| **Server/Client split (B5)** | Médio | Errar derruba o SSG **silenciosamente** — build passa, HTML vem vazio. |
| Rotas, slug, 301, metadata (B6–B10) | Médio | Mecânico, bem especificado. |
| Lift-and-shift (B3/B4) | Baixo-médio | A camada pura ([`filterParams.ts`](../src/hooks/filterParams.ts), [`checkoutMessage.ts`](../src/components/checkoutMessage.ts)) migra sem tocar, com os testes. |

---

## Parte 4 — Next.js: o mínimo que precisa estar entendido antes do código

Objetivo declarado da migração é duplo: resolver o SEO **e aprender Next.js**. Esta seção
serve ao segundo — explica o porquê, não só o o quê.

### SSG, SSR, ISR — qual é o nosso caso e por quê

| Estratégia | O que é | Aqui |
|---|---|---|
| **SSG** | HTML gerado **no build**, servido como arquivo estático | ✅ É o nosso caso. O catálogo é um array em TS; muda quando alguém edita `products.ts` e deploya. |
| **SSR** | HTML gerado **a cada request** | ❌ Não há dado por usuário nem por request. Só adicionaria latência. |
| **ISR** | Estático que se revalida sozinho | ⏳ Não agora — mas a porta fica **aberta de propósito**: o D2 rejeita `output: "export"` exatamente para a v1.3 (produtos no servidor) não exigir uma segunda migração. |
| **CSR** | O que temos hoje | Continua existindo — carrinho, diálogos e filtros seguem React no navegador. |

**O ponto que costuma confundir:** migrar **não** é abandonar o client-side. É a primeira
pintura vir em HTML pronto e o React "hidratar" por cima. A interatividade continua igual.

### A fronteira `'use client'`

No App Router, todo componente é **Server Component** por padrão (roda no build, não vai
para o bundle). `'use client'` marca onde o código passa a ir para o navegador.

| Fica Server Component | Vira `'use client'` |
|---|---|
| Páginas de produto e categoria (o HTML do catálogo) | [`CartContext.tsx`](../src/context/CartContext.tsx) (`useReducer` + `sessionStorage`) |
| [`Header.tsx`](../src/components/Header.tsx), rodapé/NAP, JSON-LD | [`ToastContext.tsx`](../src/context/ToastContext.tsx) |
| Conteúdo estático (sobre, entrega) | [`ExtrasDialog.tsx`](../src/components/ExtrasDialog.tsx), [`CartDrawer.tsx`](../src/components/CartDrawer.tsx), [`Checkout.tsx`](../src/components/Checkout.tsx), [`FilterBar.tsx`](../src/components/FilterBar.tsx) |

O caso interessante é o card ([`ProductCard.tsx`](../src/components/ProductCard.tsx)): o
**conteúdo** (nome, preço, imagem) precisa ser HTML do servidor; o **botão "Adicionar"**
precisa de cliente. Padrão: card Server Component com o botão extraído para um filho
`'use client'`.

### As duas armadilhas conhecidas

1. **`useSearchParams()` derruba o SSG.** Ele empurra a rota para renderização dinâmica — e
   se a home vira dinâmica, a migração perde o sentido. A saída (D9): o consumo dos params
   fica num Client Component **sob `<Suspense>`**, e a página renderiza todos os produtos no
   HTML estático. Numa URL filtrada, a lista completa pisca antes do filtro aplicar —
   idêntico ao comportamento de hoje, e irrelevante para o crawler.
2. **Hidratação × `window`.** [`useFilter.ts:33`](../src/hooks/useFilter.ts) lê
   `window.location.search` no *initializer* do `useState` — no servidor `window` não existe.
   É o primeiro lugar a quebrar, e o motivo de o B5 ser um item próprio.

---

## Parte 5 — Ordem de execução consolidada

| Ordem | Tarefa | Estado | Esforço |
|---|---|---|---|
| 1 | A0 — Search Console + baseline (habilita medir tudo; = B2) | ⏳ | 1 h |
| 2 | A2 — `title`/`description` | ⏳ | 30 min |
| 3 | A1 — `<h1>` | ⏳ | 30 min |
| 4 | A3 — NAP no rodapé + `config.ts` | ⏳ | 2 h |
| 5 | A9 — Seções "sobre" e "entrega" | ⏳ | 1 dia |
| 6 | A4 — JSON-LD `Florist` | ⏳ | 2 h |
| 7 | A8 — Headings + `alt` | ⏳ | 2 h |
| 8 | B1–B13 — a migração, na ordem do escopo | 📋 | Ver [`escopo-v1.2.md`](escopo-v1.2.md) |
| 9 | Conteúdo recorrente (páginas de ocasião) | ⏳ | Contínuo |

> ⚠️ **Sobre o item 9 — cuidado com *doorway pages*.** Gerar `/entrega-<bairro>` em série com
> o mesmo texto e o nome do bairro trocado é padrão que o Google **penaliza**. Cada página
> precisa de conteúdo genuinamente próprio, ou não deve existir.

> **Aviso honesto sobre a migração:** migrar sozinho não move o tráfego. Dezenas de URLs com duas
> linhas de descrição cada são *thin pages* — o Google indexa e ranqueia na página 5. A
> migração **remove o teto**; conteúdo é o que preenche o espaço. Por isso A9 vem antes.
> A exceção é o OG por produto (B10): paga em conversão de WhatsApp desde o primeiro link,
> sem depender de indexação.

---

## Parte 6 — Como medir

**Search Console** é a régua do orgânico:

| Métrica | O que significa |
|---|---|
| **Páginas indexadas** | Hoje: 1. Depois da migração: uma por produto + as 4 categorias (~44 com o catálogo atual). O indicador mais direto de sucesso. |
| **Consultas com impressão** | Hoje: quase só "madiba garden" (marca). Objetivo: busca genérica — "floricultura alvorada", "buquê para entregar". |
| **Posição média por consulta** | Onde o progresso real aparece. |
| **CTR por consulta** | CTR baixa com boa posição = `title`/`description` fracos. |
| **Cobertura / soft 404** | Deve ficar limpo depois da migração. |
| **Core Web Vitals / LCP** | Critério de aceite da v1.2 (LCP melhor que o baseline). Também alimenta o Índice de qualidade do Ads → CPC menor. |

**Prazos, para calibrar expectativa:** indexação leva **semanas** para refletir — não avaliar
a Trilha A antes de ~30 dias de dados. O OG por produto se mede no depurador da Meta e num
envio real de WhatsApp, e aparece em **dias**.

---

## Resumo executivo

O checkout no WhatsApp é irrelevante para SEO. O problema real: **uma URL, zero links
internos, nenhuma menção à cidade, nenhum dado estruturado, e um preview de link genérico
para o site inteiro**.

- **Trilha A** (⏳, ~2,5 dias): tudo que não depende de framework **e sobrevive à migração**.
  Sete itens; três foram cortados de propósito por virarem retrabalho.
- **Trilha B** (📋): a migração para Next.js — decidida no ADR-0009, recortada no
  escopo-v1.2, **zero código escrito**. É o único item que muda a ordem de grandeza.
- O plano do canal irmão (Perfil da Empresa, com as 391 avaliações) está em
  [`google-canais.md`](google-canais.md) — e o maior retorno sobre esforço do projeto inteiro
  está lá, não aqui.

## Referências externas

- [Sunsetting Create React App — react.dev](https://react.dev/blog/2025/02/14/sunsetting-create-react-app)
