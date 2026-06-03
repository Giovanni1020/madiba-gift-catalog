# Documentação — Madiba Gift Catalog

> Pasta **canônica e sempre atualizada**. É a **fonte de verdade** do projeto.
> Em qualquer sessão/janela nova, **comece por aqui.**

> **Status:** v1.0 **no ar** → <https://madiba-garden.vercel.app>. Deploy de produção a partir da branch `production` (ver [branches-e-deploy.md](branches-e-deploy.md)).

## Índice

| Doc | O que é |
|---|---|
| [como-trabalhamos.md](como-trabalhamos.md) | Papel do Claude + dinâmica de trabalho (Grill Me, PT-BR, economia de contexto, governança). **Leia antes de pedir código.** |
| [trello-padrao.md](trello-padrao.md) | Padrão de card do Trello (tipos, estrutura da descrição, checklist de aceite). Formato do card; o processo é dono do `como-trabalhamos.md`. |
| [escopo-v1.md](escopo-v1.md) | Escopo fechado do v1, spec do helper do WhatsApp, e o que fica pro v1.1+. |
| [branches-e-deploy.md](branches-e-deploy.md) | Estratégia de branches (feature → main → production) e a regra: **produção só com permissão humana**. |
| [adr/0001-filtros-na-url.md](adr/0001-filtros-na-url.md) | Filtros como estado de navegação na URL. |
| [adr/0002-estado-e-persistencia-do-carrinho.md](adr/0002-estado-e-persistencia-do-carrinho.md) | Carrinho: Context+reducer; `sessionStorage`; `localStorage` opt-in p/ dados do cliente. |
| [matriz-mental.md](matriz-mental.md) | Trilha de estudo — tópicos marcados para pesquisar depois. |

## Convenções

- Toda decisão de arquitetura nova → um **ADR numerado** em `adr/`.
- Este índice é **mantido atualizado** sempre que um doc é criado ou muda de propósito.
- **Toda mudança nasce numa branch** (`feat/…`, `fix/…`, `docs/…`) → PR para `main`.
- **`production` só com permissão humana explícita** (ver [branches-e-deploy.md](branches-e-deploy.md)).
