# Documentação — Madiba Gift Catalog

> Pasta **canônica e sempre atualizada**. É a **fonte de verdade** do projeto.
> Em qualquer sessão/janela nova, **comece por aqui.**

> **Status:** v1.0 e **v1.1 encerradas** (v1.1 no ar → <https://madiba-garden.vercel.app>); desenvolvimento ativo na **[v1.2](escopo-v1.2.md)** — migração para Next.js + SEO ([ADR-0009](adr/0009-migracao-nextjs.md)). Deploy de produção a partir da branch `production` (ver [branches-e-deploy.md](branches-e-deploy.md)).

## Índice

| Doc | O que é |
|---|---|
| [como-trabalhamos.md](como-trabalhamos.md) | Papel do Claude + dinâmica de trabalho (Grill Me, PT-BR, economia de contexto, governança). **Leia antes de pedir código.** |
| [trello-padrao.md](trello-padrao.md) | Padrão de card do Trello (tipos, estrutura da descrição, checklist de aceite). Formato do card; o processo é dono do `como-trabalhamos.md`. |
| [escopo-v1.md](escopo-v1.md) | Escopo fechado do v1, spec do helper do WhatsApp, e o que fica pro v1.1+. **v1.0 encerrada.** |
| [escopo-v1.1.md](escopo-v1.1.md) | Escopo da **v1.1**: release de feedback + polimento (sem major feature fixa), backlog herdado e o que já entrou. **Encerrada em 2026-08-25.** |
| [escopo-v1.2.md](escopo-v1.2.md) | Escopo da **v1.2** (ativa): migração CRA → Next.js + SEO. Critérios de aceite, janela de convivência com a v1.1 em produção e roadmap declarado v1.3–v1.5. |
| [aparelhos-suportados.md](aparelhos-suportados.md) | Lista canônica de aparelhos/viewports que todo CSS deve suportar (mobile prioridade máxima). **Base do responsivo.** |
| [branches-e-deploy.md](branches-e-deploy.md) | Estratégia de branches (feature → main → production) e a regra: **produção só com permissão humana**. |
| [meta-pixel.md](meta-pixel.md) | Rastreamento via Meta Pixel: configuração (`REACT_APP_FB_PIXEL_ID`), consentimento (LGPD), eventos × ações e como validar. |
| [google-ads.md](google-ads.md) | Conversões no Google Ads: configuração (`REACT_APP_GADS_SEND_TO`), consentimento (LGPD), o que conta como conversão e como criar a ação no painel. |
| [adr/0001-filtros-na-url.md](adr/0001-filtros-na-url.md) | Filtros como estado de navegação na URL. |
| [adr/0002-estado-e-persistencia-do-carrinho.md](adr/0002-estado-e-persistencia-do-carrinho.md) | Carrinho: Context+reducer; `sessionStorage`; `localStorage` opt-in p/ dados do cliente. |
| [adr/0003-rastreamento-meta-pixel.md](adr/0003-rastreamento-meta-pixel.md) | Meta Pixel: browser-only (sem CAPI), consentimento opt-in, funil completo de eventos. |
| [adr/0004-navegacao-entre-itens-no-dialogo.md](adr/0004-navegacao-entre-itens-no-dialogo.md) | Diálogo de item navega a lista filtrada (swipe/setas); `?item=` na URL via `replaceState`. |
| [adr/0005-variantes-de-produto.md](adr/0005-variantes-de-produto.md) | Variantes de produto (preço/imagem/chocolates por opção); escolha no diálogo; helper `basePrice`. |
| [adr/0007-carregamento-de-imagens.md](adr/0007-carregamento-de-imagens.md) | Carregamento de imagens: `loading="lazy"` nativo como baseline (já em uso); sem lib nova; crescimento via segmentação por categoria quando pesar. |
| [adr/0008-conversoes-google-ads.md](adr/0008-conversoes-google-ads.md) | Google Ads: gtag direto (sem GTM), **uma só** conversão (envio do carrinho pelo WhatsApp), banner único e sem Consent Mode. |
| [adr/0009-migracao-nextjs.md](adr/0009-migracao-nextjs.md) | **Migração para Next.js (App Router)**: SSG + rotas de produto indexáveis, diálogo como intercepting route (`overlayHistory.ts` deletado), `next/image`, metadata dinâmica. **Revisa ADR-0001, 0004 e 0007.** |
| [matriz-mental.md](matriz-mental.md) | Trilha de estudo — tópicos marcados para pesquisar depois. |

## Convenções

- Toda decisão de arquitetura nova → um **ADR numerado** em `adr/`.
- Este índice é **mantido atualizado** sempre que um doc é criado ou muda de propósito.
- **Toda mudança nasce numa branch** (`feat/…`, `fix/…`, `docs/…`) → PR para `main`.
- **`production` só com permissão humana explícita** (ver [branches-e-deploy.md](branches-e-deploy.md)).
