# Achados pré-migração — leitura de código da v1.2

> **O que é.** Achados que apareceram **enquanto se procurava âncoras de seletor** para os
> E2E do card #41 — não numa auditoria dedicada. Viraram um bloco de execução que nenhum
> documento previa: [`seo.md`](seo.md) ia do fim da Trilha A direto para a migração, e o
> card #41 **não era acionável** como estava especificado.
>
> **Origem:** sessão de desenho dos E2E, 2026-08-30, `main` @ `3b445e29`.
> **Método:** leitura de código. Onde a confirmação exige navegador, está marcado.
> **Ordem de execução:** [`seo.md`, Parte 5](seo.md) · **Escopo:** [`escopo-v1.2.md`](escopo-v1.2.md)

## Numeração

Os achados usam **`F1–F8`** (*finding*). O prefixo `A0–A9` é **reservado às tarefas da
Trilha A** da [`seo.md`](seo.md) — os dois esquemas colidiam (o `A2` da `seo.md` é
`title`/`description`; o achado sobre o filtro de preço morto também tinha sido chamado de
`A2` no hand-off original). Quem ler "A4" deve encontrar uma coisa só: o JSON-LD `Florist`.

## Índice

| # | Achado | Tipo | Bloqueia o #41? | Card |
|---|---|---|---|---|
| F1 | Carrinho fechado continua acessível a leitor de tela e ao `Tab` | Bug de a11y | **Sim** — fluxo (4) | a criar |
| F2 | Filtro de preço sem UI, com toda a máquina viva | Superfície morta | Não | a criar |
| F3 | `aria-label` do card descreve ação que o clique nem sempre executa | A11y / fragilidade | Não | a criar |
| F4 | Estado vazio cita filtro que o usuário não tem | Cópia errada | Não | **absorvido pelo F2** |
| F5 | `window.open` do WhatsApp sem `noopener` | Segurança (menor) | Não | a criar |
| F6 | Contagem "N itens" não tem âncora acessível | Testabilidade | **Sim** — fluxo (1) | a criar |
| F7 | `ExtrasDialog` sobrescreve `window.history.state` | Risco de migração | Não | **sem ação** — ADR-0009 D6 |
| F8 | `.env.local` com tokens reais seria disparado pelos E2E | Risco operacional | **Sim** — fluxo (5) | verificar #50/#41 |

---

## F1 — O carrinho fechado continua acessível

**Onde:** [`CartDrawer.tsx:47-52`](../src/components/CartDrawer.tsx) · [`CartDrawer.css:19-37`](../src/components/CartDrawer.css)

O `<aside role="dialog" aria-modal="true" aria-label="Carrinho de compras">` fica **sempre
montado**. A única diferença entre aberto e fechado é `transform: translateX(100%)` — sem
`aria-hidden`, `inert`, `visibility: hidden` nem `display: none`.

1. **Leitor de tela:** o diálogo é exposto na árvore de acessibilidade mesmo fechado, com
   `aria-modal="true"` sinalizando modal ativo.
2. **Teclado:** os botões internos seguem na ordem de tabulação — um `Tab` a partir do
   catálogo cai dentro do carrinho fechado, fora da tela.
3. **Teste:** o Playwright considera visível todo elemento com caixa de layout que não esteja
   em `visibility: hidden`/`display: none`. `translateX(100%)` satisfaz as duas condições.

**Por que bloqueia o #41:** com o drawer sempre clicável, o fluxo (4) consegue clicar
"Finalizar" **sem abrir o carrinho** — passaria verde sem exercitar o fluxo que existe para
provar. Ancorar em `.cart-drawer--open` não resolve: é justamente a classe que o
[ADR-0009 D5](adr/0009-migracao-nextjs.md) promete reescrever.

**Correção:** `aria-hidden={!isOpen}` no `<aside>` + `visibility` no CSS com
`transition-delay` igual à duração do `transform` (mantém o drawer visível durante a animação
de saída e o esconde só no fim — a animação não muda).

**`inert` não serve hoje:** o React 18.2 não o repassa como atributo booleano; o suporte
nativo entra no React 19, que a migração traz. Vira limpeza pós-migração.

**Não verificado:** os pontos 1 e 2 são deduzidos do código. Confirmar o 2 é um `Tab` a
partir do catálogo — ~10 segundos.

## F2 — Filtro de preço: sem UI, com toda a máquina viva

**Onde:** [`FilterBar.tsx:117-129`](../src/components/FilterBar.tsx) (JSX comentado) ·
[`filterParams.ts`](../src/hooks/filterParams.ts) (`PRICE_TO_URL`, `URL_TO_PRICE`, `PriceRange`) ·
[`useFilter.ts:10-16`](../src/hooks/useFilter.ts) (`matchesPrice`), `:66` (`setPriceRange`) ·
[`App.tsx:122-123`](../src/App.tsx) (props) · `filterParams.test.ts` (casos de preço)

O `<select>` de preço está comentado há muito tempo, sem planos de voltar. O resto da cadeia
continua: tipo, tokens PT-BR, predicado, setter, props atravessando `App` e `FilterBar`, e
cobertura de teste. Efeito líquido: `?preco=baixo` **funciona** para quem digitar a URL;
nenhum usuário produz essa URL pela interface.

**Decisão (2026-08-30): remover a superfície inteira.** A razão que só ficou visível com o
[D10](adr/0009-migracao-nextjs.md): depois da migração, `categoria` vira **rota** e `preco`
já não tem UI — sobram `ordem` e `q` como query viva. Carregar uma quarta dimensão morta
através de uma migração que reescreve essa camada é custo pago **duas vezes** (janela de
convivência). Remover agora também deixa a fronteira do `<Suspense>` do D9 com a superfície
mínima real.

**Decisão anterior mantida:** `preco` **não entra no E2E** — é função pura, já coberta por
`filterParams.test.ts`, sem clique, estado nem URL vivos.

**O F4 entra neste mesmo card** (ver abaixo).

## F3 — O `aria-label` do card descreve uma ação que nem sempre acontece

**Onde:** [`ProductCard.tsx:64`](../src/components/ProductCard.tsx) e `:115` · lógica em `:34-44`

O `<article>` vira `role="button"` com `aria-label="<nome> — adicionar ao carrinho"`, mas
`handleAdd()` só adiciona ao carrinho quando a categoria **não** é `buques`, `buques-cetim`
ou `cestas` — nessas três, a maior parte do catálogo, o clique **abre o diálogo de extras**.

**Ressalva honesta:** é discutível chamar de bug. O diálogo é passo intermediário do fluxo de
adicionar, então o rótulo descreve a *intenção*, não o efeito imediato. Surpreendente, não
quebrado.

**Por que está aqui:** é um rótulo que alguém vai querer corrigir um dia (algo como "Ver
opções de …"). Se as suítes localizarem cards por esse texto, o conserto legítimo quebra a
suíte inteira. Entregável: `data-testid="product-card"`, com o roteiro localizando pelo nome
no `<h3>`. **Corrigir o rótulo não faz parte** — é decisão de UX à parte.

## F4 — Estado vazio cita filtro que não existe

**Onde:** [`ProductGrid.tsx:18`](../src/components/ProductGrid.tsx) — *"Tente ajustar a
categoria ou o preço."*

O texto erra duas vezes. Controles que existem: **busca**, **categoria**, **ordenação**.
Ordenação nunca esvazia a grade; categoria praticamente nunca (toda categoria tem produtos);
preço não tem UI (F2). A **única causa real** de grade vazia é **busca sem resultado** — e é
exatamente a ação que o texto não sugere desfazer.

**Decisão (2026-08-30): sem card próprio — entra no F2.** Ao deletar a dimensão preço, deixar
o texto citando "preço" fica pior do que hoje; é a mesma mudança. Texto proposto: *"Tente
outra busca ou mude a categoria."* mais uma ação de escape ("Ver todos os presentes") que
limpa os filtros.

**O caso de categoria inválida é não-problema hoje:** `parseFilters` derruba categoria
desconhecida para `"todos"` (auto-limpeza do [ADR-0001](adr/0001-filtros-na-url.md)), então
`?categoria=xyz` mostra o catálogo inteiro. **Com o D10 isso muda:** categoria vira rota e
`/xyz` passa a ser 404 de verdade. O fallback genérico + retorno ao catálogo vira item de
checklist do **card #66**, e reabre o `A7` da [`seo.md`](seo.md) — descartado porque *"o Next
trata rota inexistente nativamente"*. Nativamente ele trata; a página alguém tem que escrever.

## F5 — `window.open` do WhatsApp sem `noopener`

**Onde:** [`Checkout.tsx:215`](../src/components/Checkout.tsx) — `window.open(url, "_blank")`

Sem `noopener`, a aba aberta recebe `window.opener` de volta para o catálogo e pode navegá-lo
(*reverse tabnabbing*). O destino é `wa.me`, então o risco real é baixo.

**O detalhe que engana:** desde 2021 os navegadores aplicam `rel="noopener"` implícito em
`<a target="_blank">` — mas **`window.open()` ficou de fora** e continua entregando o
`opener`. Metade do problema foi resolvida pelo navegador; esta metade não.

Correção: `window.open(url, "_blank", "noopener")`. O retorno não é usado pelo código, então
a chamada passar a devolver `null` não quebra nada — e libera o stub do fluxo (4) a devolver
`null`.

## F6 — A contagem de itens não tem âncora acessível

**Onde:** [`FilterBar.tsx:143`](../src/components/FilterBar.tsx) —
`<span className="filterbar__count">{total} …</span>`, sem `role`, `aria-label` nem `id`.

É o número que o fluxo (1) do #41 usa para provar que o filtro filtrou.

**Por que não dá para contar cards:** [`ProductGrid.tsx:38-46`](../src/components/ProductGrid.tsx)
injeta os cards "Buquê customizado" e "Buquê noiva" no meio da lista, e a diferença **varia
conforme a categoria** (somem nas abas Cetim/Cestas, onde `lastBuqueIndex === -1`). Logo
`<li>` renderizados ≠ produtos filtrados.

Entregável: `data-testid="filtro-contagem"`.
**Sugestão a grelhar, fora do mínimo:** `aria-live="polite"` — hoje o número muda ao filtrar
e nada é anunciado a quem usa leitor de tela.

## F7 — `ExtrasDialog` sobrescreve o `history.state`

**Onde:** [`ExtrasDialog.tsx:216`](../src/components/ExtrasDialog.tsx) —
`window.history.pushState({ overlay: true, zoom: true }, "")`

**Não é bug hoje:** no CRA não há router, então o `history.state` é território exclusivo do
`overlayHistory.ts`. Listado só para o registro ficar completo — o
[ADR-0009 D6](adr/0009-migracao-nextjs.md) já mapeou isto como o único ponto que continua
tocando `history` na mão após a migração, já fixou a regra
(`{ ...window.history.state, zoom: true }`, nunca sobrescrever) e já o tornou item de revisão
de PR. **Nenhuma ação agora.**

## F8 — Os E2E disparariam eventos nos tokens reais

**Onde:** `.env.local` (IDs reais) · [`ConsentBanner.tsx:32`](../src/components/ConsentBanner.tsx) ·
[`Checkout.tsx:216-227`](../src/components/Checkout.tsx)

O banner só renderiza se ao menos uma das duas variáveis estiver preenchida — ou seja, o
fluxo (5) **exige** env configurada, e o caminho preguiçoso é usar o `.env.local`, que tem os
valores de produção. Consequência: cada "Aceitar" dispara `PageView` no Pixel real, e o fluxo
(4) com consentimento aceito chega em `trackConversion` — que pelo
[ADR-0008](adr/0008-conversoes-google-ads.md) é a **única ação de conversão da conta**. Rodar
a suíte 20 vezes num dia contamina justamente a métrica que a v1.2 existe para melhorar.

**Travas obrigatórias:**

1. `.env.test` com IDs falsos porém bem formados (ex.: `AW-000000000/testeLabel`) — nunca o
   `.env.local`;
2. bloqueio de rede no contexto do Playwright: `connect.facebook.net`, `googletagmanager.com`
   e `wa.me` abortados por rota.

O bloqueio não enfraquece a suíte: a asserção correta é sobre a **tentativa de request**, não
sobre o script ter carregado. "Recusar ⇒ zero tentativas" e "aceitar ⇒ tentativa aos dois
domínios" são observáveis com a rede cortada, e ficam determinísticos e offline.

> ⚠️ **Furo encontrado ao cruzar as decisões (2026-08-30).** "E2E contra o build de produção"
> + "`.env.test`" **não se combinam sozinhas**: o CRA **inlina** `REACT_APP_*` no build — o
> próprio [`.env.example`](../.env.example) avisa que *"o CRA inlina no build, não lê em
> runtime"*. Não dá para trocar env na hora de servir. Ou o build carrega os tokens reais (e o
> F8 volta inteiro), ou não carrega nenhum — e aí o `ConsentBanner` retorna `null`, o banner
> não renderiza e **o fluxo (5) não tem como rodar**. Falta, portanto, um **script de build de
> teste** que consuma o `.env.test`.

---

## Falsos positivos (verificados — não reinvestigar)

- **`StrictMode` duplicando `pushState`.** [`index.tsx:7`](../src/index.tsx) usa
  `<React.StrictMode>`, que invoca efeitos duas vezes em dev. O efeito de mount de `?item=`
  ([`App.tsx:76-82`](../src/App.tsx)) chama `pushOverlayOnce()`, mas a função é **idempotente
  por guarda explícita** (`overlayHistory.ts:9`). Não empilha. **Sem bug.** Continua valendo,
  por outro motivo, rodar os E2E contra o build de produção: é o artefato que a Vercel
  publica, e lá o `StrictMode` é inerte.
- **`filter.category as any`** em [`App.tsx:120`](../src/App.tsx). Cast desnecessário — os
  tipos batem dos dois lados. Ruído, não erro; some quando o TypeScript sair da versão ~4.9
  travada pelo CRA.

## Decisões fechadas

Contexto de execução, não achados:

1. **`preco` sai do E2E** → permanece caso unitário em `filterParams.test.ts`.
2. **Workflow de CI** (`.github/workflows/e2e.yml`) entra nesta fase — só lê código e roda
   testes; sem permissão de deploy, sem tocar em `production`.
3. **E2E rodam contra o build de produção** servido, não contra o dev server.
4. **Baseline primeiro** (card #56): é o único item cujo valor **decai** — mede a produção
   atual, que muda a cada hotfix promovido. Registrar 3 execuções e a mediana, com URL,
   dispositivo, data e commit (execução isolada varia ±10-15%).
5. **`.env.test` + bloqueio de rede** (F8), mais o script de build que falta.
6. **Relógio fixado** no checkout (`page.clock`): [`Checkout.tsx:196`](../src/components/Checkout.tsx)
   rejeita domingo, e data relativa a "hoje" quebraria a suíte uma vez por semana.
7. **Arquitetura em três camadas** para as suítes: `roteiro/` (o que o usuário faz — estável),
   `contrato/urls.ts` (dicionário de URL, reescrito num arquivo só na migração) e asserções
   perecíveis marcadas `@expira-na-migracao` — as que **devem** falhar no dia D por decisão do
   ADR (`categoria` virando rota no D10; profundidade de overlay no D5).
8. **Tocar em `src/` está autorizado nesta fase** (2026-08-30). "Não tocar em código" nunca
   foi regra — era descrição do tipo de tarefa que se imaginava; com mais análise, ficou claro
   que há pré-requisitos reais.
9. **Tudo que toca `src/` vem antes do scaffold** (card #63). A janela de convivência mantém a
   v1.1 no ar durante a migração, e hotfix é reaplicado à mão na base Next: o que for escrito
   antes do scaffold é carregado de graça pelo lift-and-shift; depois, é trabalho feito duas
   vezes. Vale para a Trilha A, para este bloco e para o card **#48** (persistência do carrinho).
