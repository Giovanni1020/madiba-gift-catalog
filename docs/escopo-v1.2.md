# Escopo da v1.2 — Migração para Next.js + SEO

> **Tipo de release:** **infraestrutura**. Épica única — migrar o app de Create React App para
> Next.js e destravar SEO. **Nenhuma feature de negócio nova.**
> A régua da versão é **paridade**: o cliente não deve perceber diferença de comportamento,
> só de velocidade.

> **Predecessora:** [escopo-v1.1.md](escopo-v1.1.md) — encerrada em 2026-08-25.
> **Decisão de arquitetura:** [ADR-0009](adr/0009-migracao-nextjs.md).

## Status

- **Aberta em:** 2026-08-25.
- **Base:** v1.1 em produção — <https://madiba-garden.vercel.app>.
- **Backlog vivo:** board [Madiba Gift Catalog](https://trello.com/b/BAJGQ2Xg/madiba-gift-catalog).

## Por que esta versão existe

O objetivo é **busca orgânica e qualidade dos anúncios no Google** — não "modernizar o stack".
Três defeitos estruturais bloqueiam isso e nenhum se resolve dentro do CRA: a página é HTML
vazio, o produto não tem URL própria, e o preview de link no WhatsApp é único e genérico.
O diagnóstico completo está no [ADR-0009](adr/0009-migracao-nextjs.md).

Sair do CRA descontinuado e preparar terreno para v1.3–v1.5 são **consequências bem-vindas**,
não a justificativa.

## Princípio da versão

**Paridade primeiro, otimização depois.** A migração acontece em duas etapas dentro da mesma
versão:

1. **Lift-and-shift** — o app roda em Next com tudo `"use client"`, comportamento idêntico,
   build verde, E2E verdes. Nada de SEO ainda.
2. **Refinamento** — Server/Client split, `next/image`, rotas de produto, metadata dinâmica,
   intercepting routes, JSON-LD, sitemap.

Misturar as duas etapas é o jeito garantido de não saber o que quebrou.

**Se uma funcionalidade não existe hoje, não entra na v1.2** — a única exceção é o que o SEO
exige (rotas de produto, metadata, sitemap, JSON-LD).

## Escopo fechado

| # | Item | Referência |
|---|---|---|
| 1 | **Smoke set E2E (Playwright, 5 fluxos) escrito contra o app CRA atual** — contrato de aceite da migração. *Recorte fechado em 2026-08-27: só os fluxos que quebram venda — ver [seo.md](seo.md), B1.* | ADR-0009, Notas |
| 2 | **Baseline de métricas** — Lighthouse/PageSpeed em produção + Search Console, antes de tocar em código | ADR-0009, Notas |
| 3 | Scaffold Next.js App Router; `react-scripts` → Next; `react-scripts test` → Vitest | D1 |
| 4 | Lift-and-shift: `src/` movido, `app/layout.tsx` com a metadata do `index.html`, paridade total | D1, D2 |
| 5 | `useFilter` → `useSearchParams` sob `<Suspense>`, mantendo a query canônica em PT-BR | D9 |
| 6 | Campo `slug` estável em `Product`; rota `/produto/[slug]` SSG; **301 de `?item=<id>`** | D3, D4 |
| 7 | **Rotas de categoria** (`/buques`, `/buques-cetim`, `/cestas`, `/doces`) SSG; chips da `FilterBar` viram `<Link>`; **301 de `?categoria=<x>`** | D10 |
| 8 | **Diálogo, carrinho e checkout viram rotas** (intercepting routes); `overlayHistory.ts` **deletado** | D5 |
| 9 | `next/image` em toda mídia; revisão do CSS de imagem | D7 |
| 10 | `generateMetadata()` por produto (**OG com a foto do produto**), `sitemap.ts` só com canônicas, `robots.ts`, JSON-LD `Product` + `LocalBusiness` | D8, D10 |
| 11 | Env `REACT_APP_*` → `NEXT_PUBLIC_*` (local + Vercel Production/Preview) | ADR-0009, Notas |
| 12 | `vercel.json` (cache de `/vids/`) → `headers()` no `next.config` | ADR-0009, Notas |
| 13 | QA nos aparelhos de [aparelhos-suportados.md](aparelhos-suportados.md) | ADR-0009, Notas |

**Confirmado em 2026-08-25:** as rotas de categoria entram (D10) e o lightbox mantém a
integração com o "voltar" (D6). Nenhuma pergunta do [ADR-0009](adr/0009-migracao-nextjs.md)
segue em aberto.

## Critérios de aceite

A versão só é promovível quando **todos** passam:

- [ ] Os 5 fluxos do smoke set (item 1) passam **na base CRA e na base Next**, sem
      alteração no roteiro.
- [ ] Paridade visual e funcional confirmada nos aparelhos suportados — com atenção ao
      **"voltar" do celular** em iOS Safari e Chrome Android.
- [ ] `view-source:` de `/produto/<slug>` mostra **nome, descrição e preço** no HTML.
- [ ] `view-source:` de `/` **e de cada rota de categoria** mostra os produtos no HTML —
      o SSG não regrediu para render dinâmico (guarda do D9: `useSearchParams` fora de
      `<Suspense>` derruba o estático em silêncio). *Adicionado em 2026-08-27 — ver
      [seo.md](seo.md).*
- [ ] OG por produto validado no depurador da Meta **e** num envio real de WhatsApp.
- [ ] Lighthouse mobile: **LCP melhor que o baseline** do item 2.
- [ ] URLs `?item=<id>` antigas respondem **301** para o slug — nenhuma vira 404.
- [ ] `?categoria=<x>` responde **301** para `/<x>`; nenhuma URL com query entra no sitemap.
- [ ] Zoom no diálogo: "voltar" fecha **só** o zoom; "voltar" de novo fecha o diálogo
      (iOS Safari **e** Chrome Android).
- [ ] `sitemap.xml` e `robots.txt` servidos e válidos no Search Console.
- [ ] **Consentimento intacto**: recusar o banner ⇒ nenhum script de Meta/Google carregado
      (regressão dos [ADR-0003](adr/0003-rastreamento-meta-pixel.md) / [ADR-0008](adr/0008-conversoes-google-ads.md)).
- [ ] Nenhum `history.pushState` manual no código, exceto o caso do lightbox (D6).

## Janela de convivência

Enquanto a v1.2 é construída, **a v1.1 continua no ar vendendo**. Consequência operacional:

- Hotfix de produção entra pelo fluxo normal na base CRA (`main` → `production`, com
  permissão humana) e é **reaplicado à mão** na base Next.
- [`src/data/products.ts`](../src/data/products.ts) fica **congelado byte a byte** entre as
  duas bases. Produto novo/preço alterado durante a janela sincroniza com
  `git checkout main -- src/data/products.ts`.
- É o único ponto de atrito real da versão — não há features concorrentes, porque a migração
  **é** a versão.

## Backlog herdado da v1.1

| Card | Destino na v1.2 |
|---|---|
| [#14](https://trello.com/c/Ts2Zrsz5) — ADR de lazy loading de imagens | **Fechado pela migração** — absorvido pelo `next/image` (D7); [ADR-0007](adr/0007-carregamento-de-imagens.md) passa a revisado. |
| [#41](https://trello.com/c/qy8cc64S) — documentar regras de comportamento | **Promovido** — os E2E do item 1 *são* essa documentação, executável. |
| [#13](https://trello.com/c/9Wmoxfun) — SPEC das regras de adicionais | Independe de framework. Entra se sobrar espaço; senão, v1.3. |
| [#30](https://trello.com/c/rs4YzbD4) — diálogo como bottom sheet no mobile | **Adiado.** D5 reescreve o diálogo; mexer no visual antes seria retrabalho garantido. |
| [#18](https://trello.com/c/cp3si14Y) — raio/cobertura de entrega | **Vai para v1.4** — já tem decisão aceita no [ADR-0006](adr/0006-frete-por-distancia.md). |
| [#3](https://trello.com/c/wd1RpfrY) — "lembrar meus dados" | **Adiado para v1.5**, quando a discussão de conta de cliente for real. |

## Fora do escopo

Explicitamente **não** entram na v1.2, mesmo que tentador durante a migração:

- Pagamento online, carrinho persistido no servidor, pedidos em banco.
- Sistema de entregas, geocoding, cálculo de frete (**v1.4**, ADR-0006).
- Produtos vindos de banco/CMS — seguem em `products.ts` (**v1.3**).
- Painel administrativo, autenticação, controle de estoque.
- Canal de contato dentro do checkout, política de estorno/troca (**v1.5**, com apoio
  jurídico).
- Qualquer redesenho de UI. Paridade é a régua.

## Roadmap declarado (contexto, não compromisso desta versão)

| Versão | Entrega | Observação |
|---|---|---|
| **v1.3** | Produtos saem do TS para banco/CMS; **preço autoritativo no servidor**; feed estruturado | Invisível para o cliente. Pré-requisito de segurança da v1.5: o servidor precisa recalcular o preço, nunca confiar no que vem do navegador. |
| **v1.4** | Entregas: endereço, distância viária, taxa, cobertura, agenda | A mais complexa. Decisão já aceita no [ADR-0006](adr/0006-frete-por-distancia.md) (proxy `/api/frete` + geocoder), que na v1.2 vira Route Handler nativo. |
| **v1.5** | Pagamento online (Pix + cartão), pedido persistido, notificação ao lojista; WhatsApp vira suporte | Exige decisões ainda em aberto: estoque, operação dos pedidos, termos de serviço e política de estorno (com advogado). |

**Por que o SEO vem primeiro:** a v1.2 vai ao ar sozinha, com **uma variável mudando**. Se
pagamento entrasse junto e a conversão oscilasse, não haveria como saber o que causou o quê.

## Governança

Sem exceções ao [como-trabalhamos.md](como-trabalhamos.md) e ao
[branches-e-deploy.md](branches-e-deploy.md):

- Cada item do escopo fechado nasce em sua própria branch → PR para `main`.
- **`production` só com permissão humana explícita.**
- Decisão de arquitetura nova durante a migração → **novo ADR numerado**, não um parágrafo
  solto no PR.
