# Escopo do v1 — Madiba Gift Catalog

> Objetivo do v1: **deploy rápido** de uma versão base que cataloga os itens existentes e
> direciona o pedido formatado para o WhatsApp do atendente. Sem pagamento online.

## Dentro do escopo (v1)

- **Catálogo** com os ~6 itens de `src/data/products.ts`.
- **Filtragem** com estado na URL (ver [ADR-0001](adr/0001-filtros-na-url.md)).
- **Carrinho como drawer** (catálogo visível por trás = UI limpa).
  - Item com **extras/adicionais** (via `BuqueExtrasDialog`).
- **Checkout como tela cheia** (one-page app): flag de view `'catalogo' | 'checkout'`
  + um `history.pushState` ao entrar, para o "voltar" do celular fechar o checkout em vez de
  sair do site. **Não é rota** (ver ADR-0001).
- **Checkout — toggle Retirada / Entrega:**
  - Entrega → campos **CEP, rua, número, bairro** (sem complemento).
  - Retirada → sem endereço.
- **"Lembrar meus dados"** opt-in (`localStorage`) — ver [ADR-0002](adr/0002-estado-e-persistencia-do-carrinho.md).
- **Finalizar → abre o WhatsApp** (`wa.me`) com a mensagem formatada.

## Helper do WhatsApp (`src/lib/whatsapp.ts`)

Funções **puras** (sem React), testáveis isoladas:

- `buildWhatsAppMessage(pedido): string`
- `buildWhatsAppUrl(telefone, mensagem): string`

A UI só dispara o efeito (`window.open(url)`).

**Gotchas obrigatórios:**

- **`encodeURIComponent`** (nunca `encodeURI`) na mensagem. `\n` vira `%0A`.
- **Telefone**: só dígitos com DDI, sem `+`/espaço/traço → ex. `5511999999999`.
- **Moeda**: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`, centralizado.
- **Montagem**: array de linhas + `join('\n')` (testável, diff limpo).
- **Teto de 10 itens** (não há compra gigante) — mantém folga sob o limite prático de URL (~2000 chars).

**Ordem da mensagem (rascunho a refinar):**

```
🌸 *Novo pedido — Madiba*
- 1x Buquê 5 rosas importadas — R$ XX
    + adicional: cartão personalizado
- 2x Caixa para namorados — R$ XX
*Total: R$ XXX*
Forma: 🚚 Entrega   (ou 🏪 Retirada)
Endereço: CEP, rua, número, bairro   (só se entrega)
Cliente: Nome — (telefone)
```

O formatador **ramifica em `entrega.tipo`**: imprime o bloco de endereço só quando `entrega`.

## Fora do escopo (v1.1+)

- **Mapa** (pin/geocoding) para o endereço; zonas/rotas de entrega.
- **Router** / múltiplas rotas (ex.: `/produto/:id`, `/categoria/...`).
- **TTL/revalidação do carrinho**; produtos vindos de backend/CMS.
- **Pagamento online** (nunca previsto).

## Restrições técnicas

- CRA, React 18.2, TS 4.9, sem router, sem lib de estado.
- **Alinhar `@types/react` e `@types/react-dom` para `^18`** (hoje em v19, à frente do runtime).
