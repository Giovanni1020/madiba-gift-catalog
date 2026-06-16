# Escopo da v1.1 — Madiba Gift Catalog

> **Tipo de release:** feedback + polimento. **Sem major feature comprometida** ao abrir a
> versão — o foco é refinar o que a 1.0 entregou e absorver feedback de uso real.
> Features podem ser **pedidas no meio da versão** e entram aqui quando aprovadas no grill.

> **Predecessora:** [escopo-v1.md](escopo-v1.md) — a v1.0 está **encerrada**
> (no ar desde 2026-06-02, fechada em 2026-06-15).

## Status

- **Aberta em:** 2026-06-15.
- **Base:** v1.0 em produção — <https://madiba-garden.vercel.app>.
- **Backlog vivo:** board [Madiba Gift Catalog](https://trello.com/b/BAJGQ2Xg/madiba-gift-catalog) — a lista **"A Fazer"** é o backlog da 1.1.

## Princípio da versão

Release **incremental**, sem épico central. Cada item nasce como card no padrão
[`trello-padrao.md`](trello-padrao.md), passa pelo grill ([`como-trabalhamos.md`](como-trabalhamos.md))
e entra por **PR para `main`**. **Produção só com permissão humana explícita**
(ver [`branches-e-deploy.md`](branches-e-deploy.md)).

## Já entregue na 1.1

- **Toast de "pedido enviado"** no checkout (acessível: `role="status"` / `aria-live="polite"`) — card #44.
- **Variantes de produto** — mecanismo de opções por produto (preço/imagem/`maxChocolates` por
  variante), escolha no diálogo, helper `basePrice`. Decisão em
  [ADR-0005](adr/0005-variantes-de-produto.md). Disparador: Buquê Girassol (3 e 4 girassóis).

## Backlog herdado (candidatos da 1.1)

| Card | Tipo | Resumo |
|---|---|---|
| [#3](https://trello.com/c/wd1RpfrY) | 🔧 FEAT | "Lembrar meus dados" — `localStorage` opt-in (era escopo do v1, **repassado** pra cá). |
| [#18](https://trello.com/c/cp3si14Y) | 🔧 FEAT | Aviso de raio/cobertura de entrega no checkout (cobertura real **em aberto**). |
| [#30](https://trello.com/c/rs4YzbD4) | SPIKE/UX | Diálogo de extras como bottom sheet no mobile (opcional). |
| [#13](https://trello.com/c/9Wmoxfun) | 📄 SPEC | Regras de negócio dos "adicionais" (extras dos produtos). |
| [#14](https://trello.com/c/Ts2Zrsz5) | 📐 ADR | Estratégia de lazy loading das imagens. |
| [#41](https://trello.com/c/qy8cc64S) | 📄 SPEC | Documentar regras de comportamento existentes (backlog de specs). |

> Esta tabela é um **retrato**; a fonte viva de prioridade é o board do Trello.

## Fora do escopo (mantido da v1)

Continuam adiados (ver [escopo-v1.md](escopo-v1.md)): mapa/geocoding e zonas de entrega,
router/múltiplas rotas, produtos via backend/CMS, e **pagamento online** (nunca previsto).
