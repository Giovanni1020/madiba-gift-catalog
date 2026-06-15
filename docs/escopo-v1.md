# Escopo do v1 — Madiba Gift Catalog

> Objetivo do v1: **deploy rápido** de uma versão base que cataloga os itens existentes e
> direciona o pedido formatado para o WhatsApp do atendente. Sem pagamento online.

## Status — v1.0 encerrada ✅ (no ar desde 2026-06-02; fechada em 2026-06-15)

- **Escopo congelado.** A evolução do produto segue na **[v1.1](escopo-v1.1.md)** — release de feedback e polimento.
- **Produção:** <https://madiba-garden.vercel.app>
- **Hospedagem:** Vercel (Create React App; deploy automático a cada push na `main`, preview por PR).
- **WhatsApp da loja:** `STORE_PHONE` em `src/config.ts` (`555186103494`, confirmado).
- **Entregue:** catálogo · filtros↔URL · carrinho · checkout (entrega/retirada) · envio pelo WhatsApp · OG/meta p/ preview do link.

## Dentro do escopo (v1)

- **Catálogo** com os ~6 itens de `src/data/products.ts`.
- **Filtragem** com estado na URL (ver [ADR-0001](adr/0001-filtros-na-url.md)).
- **Carrinho como drawer** (catálogo visível por trás = UI limpa).
  - Item com **extras/adicionais** (via `BuqueExtrasDialog`).
- **Checkout como tela cheia** (one-page app): flag de view `'catalogo' | 'checkout'`
  + um `history.pushState` ao entrar, para o "voltar" do celular fechar o checkout em vez de
  sair do site. **Não é rota** (ver ADR-0001).
- **Checkout — toggle Retirada / Entrega:**
  - Entrega → campos **quem recebe, CEP, rua, número, bairro, horário de entrega** (sem complemento).
  - Retirada → sem endereço.
- **"Lembrar meus dados"** opt-in (`localStorage`) — ver [ADR-0002](adr/0002-estado-e-persistencia-do-carrinho.md).
  ⚠️ **Planejado no v1, não entregue na 1.0** → repassado para a **[v1.1](escopo-v1.1.md)** (decisão consciente, 2026-06-15).
- **Finalizar → abre o WhatsApp** (`wa.me`) com a mensagem formatada.

## Helper do WhatsApp (`src/components/checkoutMessage.ts`)

Funções **puras** (sem React), **coladas ao checkout** (é o único fluxo que
redireciona pro WhatsApp — sempre passa pelo checkout antes). Decisão: não virou
`src/lib/whatsapp.ts` global nem exigiu mover `CartItem` pro tipo de domínio.

- `buildWhatsAppMessage(pedido): string`
- `buildWhatsAppUrl(telefone, mensagem): string`

A UI (`Checkout.handleSubmit`) monta o `Pedido` (itens+total do `useCart`) e
dispara o efeito (`window.open(url)`). O número da loja vem de `STORE_PHONE`
em `src/config.ts`.

**Pós-envio (decisão C):** abre o WhatsApp e **volta pro catálogo mantendo o
carrinho** — o envio pode falhar, então não limpamos cedo demais.

**Gotchas obrigatórios:**

- **`encodeURIComponent`** (nunca `encodeURI`) na mensagem. `\n` vira `%0A`.
- **Telefone da loja**: só dígitos com DDI, sem `+`/espaço/traço → `555186103494`.
- **Telefone do cliente**: vai **no corpo** da mensagem (sem DDI, formatado), não na URL.
- **Moeda**: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
  (helpers locais por ora; centralizar em `lib/format.ts` se a duplicação incomodar).
- **Montagem**: array de linhas + `join('\n')` (testável, diff limpo).
- **Teto de 10 itens** (não há compra gigante) — mantém folga sob o limite prático de URL (~2000 chars). *(ainda não aplicado.)*

**Formato da mensagem:**

- **Sem emojis** (clareza); **sem linha de cabeçalho** ("Novo pedido" era redundante).
- **Linha em branco entre itens diferentes** (leitura do cliente e do atendente).
- **Lista todos os adicionais** como conteúdo (balão/plaquinha/chocolate ×N) —
  o valor de cada linha já inclui os adicionais.
- **Bloco da entrega agrupado** (Forma / Quem recebe / Endereço / Horário em
  linhas seguidas, sem linha em branco entre elas) para ocupar menos espaço.

```
- 2x Buquê 5 Rosas Importadas — R$ 297,80
    + Balão: Te Amo
    + Ferrero Rocher x2

- 1x Box for Lovers — R$ 189,90

*Total: R$ 487,70*

Forma: Entrega
Quem recebe: João Silva
Endereço: 90000-000, Rua das Flores, 123, Centro
Horário: 14h às 15h

Cliente: Maria — (51) 98508-2700
```

O formatador **ramifica em `entrega.tipo`**: imprime o bloco de endereço só quando `entrega`.

## Fora do escopo (v1.1+)

> Backlog vivo e priorização da próxima versão: **[escopo-v1.1.md](escopo-v1.1.md)** + board do Trello.

- **Mapa** (pin/geocoding) para o endereço; zonas/rotas de entrega.
- **Router** / múltiplas rotas (ex.: `/produto/:id`, `/categoria/...`).
- **TTL/revalidação do carrinho**; produtos vindos de backend/CMS.
- **Pagamento online** (nunca previsto).

## Restrições técnicas

- CRA, React 18.2, TS 4.9, sem router, sem lib de estado.
- **Alinhar `@types/react` e `@types/react-dom` para `^18`** (hoje em v19, à frente do runtime).
