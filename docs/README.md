# Documentação — Madiba Gift Catalog

> Pasta **canônica e sempre atualizada**. É a **fonte de verdade** do projeto.
> Em qualquer sessão/janela nova, **comece por aqui.**

> **Status:** v1.0 **no ar** desde 2026-06-02 → <https://madiba-garden.vercel.app> (Vercel, deploy automático da `main`).

## Índice

| Doc | O que é |
|---|---|
| [como-trabalhamos.md](como-trabalhamos.md) | Papel do Claude + dinâmica de trabalho (Grill Me, PT-BR, economia de contexto, governança). **Leia antes de pedir código.** |
| [escopo-v1.md](escopo-v1.md) | Escopo fechado do v1, spec do helper do WhatsApp, e o que fica pro v1.1+. |
| [adr/0001-filtros-na-url.md](adr/0001-filtros-na-url.md) | Filtros como estado de navegação na URL. |
| [adr/0002-estado-e-persistencia-do-carrinho.md](adr/0002-estado-e-persistencia-do-carrinho.md) | Carrinho: Context+reducer; `sessionStorage`; `localStorage` opt-in p/ dados do cliente. |
| [matriz-mental.md](matriz-mental.md) | Trilha de estudo — tópicos marcados para pesquisar depois. |

## Convenções

- Toda decisão de arquitetura nova → um **ADR numerado** em `adr/`.
- Este índice é **mantido atualizado** sempre que um doc é criado ou muda de propósito.
