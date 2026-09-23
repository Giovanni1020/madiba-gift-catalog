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
4. Aprovada **por uma pessoa** → **promove `main` → `production` por fast-forward** → push → **deploy de produção**.

A promoção é um **fast-forward** (`production` é sempre ancestral da `main`), sem PR e
sem merge commit — o histórico de `production` fica idêntico ao da `main`:

```sh
git checkout production
git merge --ff-only main      # falha se não for fast-forward (protege contra commits soltos)
git push origin production    # dispara o deploy de produção
git checkout main             # working tree volta sempre para a main
```

> **Working tree após uma feature branch:** depois do commit + push da branch,
> o working tree **permanece na própria branch** — não volta automaticamente
> para a `main` logo após o commit. O retorno para a `main` acontece só **após
> o humano confirmar o merge** (e/ou pedir para remover a branch já mergeada).

## Ciclo de versões

O trabalho acontece por ciclos: **desenvolvimento de uma versão → feedback / próxima
versão** (é o fluxo que estamos rodando agora). O desenvolvimento da versão nova pode
ocorrer **em paralelo** ao feedback da versão anterior, que já está em produção.

- Feedback/ajustes da versão no ar entram pelo mesmo fluxo de branches (→ `main` → `production`, com permissão).
- A próxima versão é tocada nas suas próprias branches, sem travar o atendimento ao feedback da versão atual.

## Branch de integração durante a migração (v1.2)

> **Decisão de 2026-09-16.** Vale **só enquanto a v1.2 existir**. Fora dessa janela, o fluxo
> é o descrito acima, sem exceção.

O ciclo normal ("tudo nasce numa branch → PR para `main`") **não se sustenta durante a
migração para Next.js**: a [janela de convivência](escopo-v1.2.md) exige que `main` continue
sendo a base CRA, porque é dela que sai o hotfix da v1.1 por fast-forward para `production`.
No instante em que o scaffold (item 3 do escopo, card #63) fosse mergeado em `main`, `main`
viraria Next e **nenhum hotfix teria mais por onde passar**. O comando
`git checkout main -- src/data/products.ts`, citado no escopo e no
[ADR-0009](adr/0009-migracao-nextjs.md), já pressupõe que a base Next vive em outra branch.

### Regras

- Uma **branch de integração de vida longa**, chamada **`next`**, nasce de `main` no momento
  do scaffold (item 3 / B3 / card #63) e existe **só durante a v1.2**.
- Os **itens 3 a 13** do escopo (B3–B13) nascem em branches de trabalho normais
  (`feat/…`, `fix/…`) e fazem **PR para `next`**, não para `main`.
- Os **itens 1 e 2** (smoke set E2E e baseline) e **todo o trabalho pré-scaffold**
  (Trilha A da [seo.md](seo.md), achados F1–F8 de
  [achados-pre-migracao.md](achados-pre-migracao.md), card #48) continuam fazendo **PR para
  `main`** — são mudanças na base CRA.
- **`main` continua CRA** e continua sendo a base de hotfix: `fix/…` → `main` →
  `production` (fast-forward, com permissão humana), exatamente como hoje.
- Cada hotfix mergeado em `main` é **reaplicado em `next`** — `cherry-pick` quando aplica
  limpo; à mão caso contrário.
- **Sincronização de catálogo:** na branch `next`, `git checkout main -- src/data/products.ts`.
- **Fechamento:** **um** PR `next → main` quando todos os critérios de aceite do escopo
  passarem. Depois, `main → production` com permissão humana, pelo fluxo normal. `next` é
  apagada.
- **Rollback** continua sendo o deploy anterior da Vercel, em um clique.

### Os dois fluxos coexistindo

```
hotfix da v1.1 (base CRA)
  fix/… ──(PR)──▶ main ──(permissão humana, ff)──▶ production
                   │
                   │ cherry-pick de cada hotfix
                   ▼
migração v1.2 (base Next)
  feat/… ──(PR)──▶ next ──(fim da v1.2: 1 PR)──▶ main ──▶ production
                   ▲
                   └── git checkout main -- src/data/products.ts
```

## Regra de produção (inegociável)

**Nenhuma mudança vai para `production` sem permissão humana explícita.**

- O agente (Claude) **nunca** faz merge/push em `production` por conta própria —
  nem "para adiantar", nem porque os testes passaram.
- A promoção `main → production` só acontece quando uma pessoa **pede explicitamente**.
- Na dúvida, o padrão é **não promover**.

## Deploy (Vercel)

- **Production Branch = `production`** (Vercel → Settings → Git → Production Branch).
  - Fast-forward + push em `production` → **deploy de produção** → <https://madiba-garden.vercel.app>.
  - Push em `main` e nas feature branches → **deploys de preview** (URL temporária por branch/PR), para testar antes de promover.
- App estático (sem backend): build `npm run build`, saída `build/`. **Durante a janela da
  v1.2 isso vale para `main`/`production`** (base CRA); na branch `next` o build é o do
  **Next.js**, com a saída própria dele.
- ⚠️ **Preset e output dir, durante a janela:** o **mesmo projeto da Vercel** vai servir
  previews Next (`next` e suas branches de trabalho) e produção CRA (`production`) ao mesmo
  tempo. Se o painel tiver **override de Framework Preset ou de Output Directory** apontando
  para `build/`, os previews Next **falham**; se o preset for trocado para Next.js, os
  redeploys CRA de `production` **falham**. Saída: **`vercel.json` por commit com o campo
  `framework`** — a base CRA declara o dela, a base Next declara `"framework": "nextjs"`. O
  arquivo pode continuar existindo **só com esse campo** mesmo depois de os headers migrarem
  para o `next.config` (item 12 do escopo). **Conferir o painel ANTES do card #63** é item de
  checklist desse card.
- **Variáveis de ambiente:** `REACT_APP_FB_PIXEL_ID` (Meta Pixel) — definir na Vercel
  (Production + Preview). Inlinada no build; ausente ⇒ no-op. Ver [meta-pixel.md](meta-pixel.md).
  - **Durante a janela da v1.2**, as **duas famílias coexistem** na Vercel (Production +
    Preview): `REACT_APP_*` para a base CRA e `NEXT_PUBLIC_*` para a base Next. **Nenhuma é
    removida antes do fechamento** da versão (item 11 do escopo).
- **Após publicar em `production`, voltar sempre o working tree para `main`.** A
  `production` não é branch de trabalho — só recebe promoções. Nenhum commit nasce nela.
