# Branches e Deploy — Madiba Gift Catalog

> Como o código flui de uma mudança até a produção.
> **Regra de ouro:** mudanças só vão para `production` **com permissão humana explícita.**

## Branches

| Branch | Papel |
|---|---|
| `feat/…`, `fix/…`, `chore/…`, `docs/…` | **Toda** mudança nasce aqui. Nunca se commita direto em `main` nem em `production`. |
| `main` | Integração / desenvolvimento. Recebe as branches via PR quando prontas. É o ambiente de **teste** (preview na Vercel). |
| `production` | O que está **no ar**. Só recebe da `main`, depois de testada, e **com permissão humana**. |

## Fluxo

```
feature branch ──(PR, quando pronta)──▶ main ──(testada + permissão humana)──▶ production
```

1. **Mudança** → branch separada (`feat/…`, `fix/…`, `chore/…`, `docs/…`).
2. Pronta → **PR para `main`** → merge.
3. `main` é **testada** (preview na Vercel).
4. Aprovada **por uma pessoa** → **PR `main` → `production`** → merge → **deploy de produção**.

## Ciclo de versões

O trabalho acontece por ciclos: **desenvolvimento de uma versão → feedback / próxima
versão** (é o fluxo que estamos rodando agora). O desenvolvimento da versão nova pode
ocorrer **em paralelo** ao feedback da versão anterior, que já está em produção.

- Feedback/ajustes da versão no ar entram pelo mesmo fluxo de branches (→ `main` → `production`, com permissão).
- A próxima versão é tocada nas suas próprias branches, sem travar o atendimento ao feedback da versão atual.

## Regra de produção (inegociável)

**Nenhuma mudança vai para `production` sem permissão humana explícita.**

- O agente (Claude) **nunca** faz merge/push em `production` por conta própria —
  nem "para adiantar", nem porque os testes passaram.
- A promoção `main → production` só acontece quando uma pessoa **pede explicitamente**.
- Na dúvida, o padrão é **não promover**.

## Deploy (Vercel)

- **Production Branch = `production`** (Vercel → Settings → Git → Production Branch).
  - Merge em `production` → **deploy de produção** → <https://madiba-garden.vercel.app>.
  - Push em `main` e nas feature branches → **deploys de preview** (URL temporária por branch/PR), para testar antes de promover.
- App estático (sem backend / sem variáveis de ambiente): build `npm run build`, saída `build/`.
- **Após publicar em `production`, voltar sempre o working tree para `main`.** A
  `production` não é branch de trabalho — só recebe promoções. Nenhum commit nasce nela.
