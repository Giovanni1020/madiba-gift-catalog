# Padrão de card do Trello — Madiba Gift Catalog

> **Guia de processo (governança).** Define o **formato** dos cards do board
> [Madiba Gift Catalog](https://trello.com/b/BAJGQ2Xg/madiba-gift-catalog).
> O **processo** (papel, "Grill Me", PT-BR, branches, deploy) é dono do
> [`como-trabalhamos.md`](como-trabalhamos.md) — esta guia **não duplica** essas regras,
> só remete a elas.

Vale **daqui pra frente**: cards legados (formato antigo `N · título`, sem checklist)
não são retrofitados. Card de referência (canônico): **[#14 — ADR lazy loading](https://trello.com/c/Ts2Zrsz5)**.

## Tipos de card

Cada card declara um **tipo** no título (emoji + prefixo em CAIXA):

| Tipo | Quando usar |
|---|---|
| 📄 **SPEC** | Especificar regra/comportamento que **já existe** no código. |
| 📐 **ADR** | Decisão de arquitetura **com trade-off** → vira ADR numerado em `adr/`. |
| 📘 **GUIA** | Convenção de processo/governança, **sem trade-off** de arquitetura (como este doc). |
| 🔧 **FEAT** | Código novo / nova funcionalidade. |
| 🐛 **FIX** | Correção de bug. |
| 🔐 **SEC** | Segurança / credenciais. |
| 🧹 **CHORE** | Higiene técnica (deps, tipos, limpeza). |

**SPEC × ADR × GUIA:** SPEC descreve o que o código faz; ADR decide um caminho entre
alternativas (tem trade-off); GUIA fixa uma convenção de processo (não tem trade-off de
arquitetura — se tivesse, seria ADR).

## Título

```
<emoji> <TIPO>: <descrição curta>
```

Ex.: `📄 SPEC: regras dos adicionais` · `📐 ADR: lazy loading das imagens` ·
`📘 GUIA: padronização dos cards do Trello`.

## Estrutura mínima da descrição (markdown, nesta ordem)

1. `📍 **Board**: [nome](url) > **List**: <lista>`
2. `## 📝 Description` → **Tipo:** (Documentação / Decisão (ADR) / Guia / Código…).
3. `## Objetivo` → o porquê, em 1–3 linhas.
4. `## Contexto / Onde mora hoje` → apontar **arquivos e linhas reais** do código.
5. `## Pauta / Opções` → **só quando há decisão a tomar** (alternativas + trade-offs).
6. `## Entregável` → artefato concreto; **indexar em [`README.md`](README.md)** quando for doc.
7. `## Processo` → remeter a [`como-trabalhamos.md`](como-trabalhamos.md): papel, Grill Me,
   PT-BR; branch → PR para `main`; produção só com permissão humana explícita
   (ver [`branches-e-deploy.md`](branches-e-deploy.md)).

**Seções condicionais:** `## Pauta / Opções` aparece só quando há escolha em aberto;
`## Premissa a verificar` quando há suposição a medir antes de decidir (ver o #14).

## Checklist "Critérios de aceite"

Todo card de trabalho tem um checklist chamado **`Critérios de aceite`** com itens
**verificáveis**:

- **1º item** sempre começa por **`GRELHAR primeiro: …`** (discussão antes da implementação).
- **Último item** sempre é **`Entregue via branch → PR para main (sem deploy a produção sem permissão)`**.
- Itens do meio: passos concretos e checáveis (escrever o artefato, indexar no `README.md`,
  apontar inconsistências sem corrigir sem combinar, etc.).

## Relação com os outros docs

- [`como-trabalhamos.md`](como-trabalhamos.md) — **dono do processo** (o *como*). Esta guia
  só formaliza como esse processo aparece **num card**.
- [`README.md`](README.md) — índice; todo card cujo entregável é um doc deve **indexá-lo aqui**.
- [`adr/`](adr/) — decisões de arquitetura (origem dos cards 📐 ADR).
