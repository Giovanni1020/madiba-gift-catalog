# Matriz Mental — Tópicos para estudar depois

> Documento vivo. Aqui ficam os assuntos que eu (Filipe) sinalizar durante as sessões como
> "isso é interessante para pesquisar/estudar depois". O Claude adiciona um item novo sempre
> que eu disser algo nesse sentido. Não é backlog de tarefas do app — é trilha de estudo.

**Status possíveis:** `🔲 a estudar` · `📖 estudando` · `✅ estudado`

---

## 001 — O que é um "token" de LLM e como ele se relaciona com "economia de contexto"

- **Status:** 🔲 a estudar
- **Por que me interessa:** eu uso o conceito de "economia de token/contexto" o tempo todo
  para guiar como trabalhamos, mas não entendo a mecânica por baixo. Quero parar de tratar
  como caixa-preta.
- **Perguntas a responder no estudo:**
  - O que exatamente é um token? (não é palavra, não é caractere — é subpalavra/BPE)
  - O que é a "janela de contexto" e por que ela tem limite?
  - Por que reler arquivos grandes, colar logs enormes ou repetir contexto "gasta" tokens?
  - Diferença entre tokens de **entrada** (prompt) e de **saída** (resposta).
  - O que é *prompt caching* e como ele afeta custo/latência quando se reusa contexto.
  - Como isso se traduz em hábitos práticos (ler só o trecho necessário, não pedir reescrita
    de arquivo inteiro, fechar o loop antes de inflar a conversa).
- **Semente (pra ancorar o estudo):** "token" ≠ React, ≠ LocalStorage. É a unidade que o
  modelo lê/gera. "Economia de contexto" é um problema de **dev-time** (o custo da nossa
  conversa), totalmente separado de **performance de runtime** do app (memória do navegador,
  re-render). Manter esses dois mundos separados na cabeça evita decisões de arquitetura
  erradas "para economizar token" — que é um não-problema no runtime.

---

<!-- Próximos itens entram abaixo, no mesmo formato. -->
