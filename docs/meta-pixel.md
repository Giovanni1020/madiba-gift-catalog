# Meta Pixel — rastreamento

> Como o catálogo rastreia o funil para a Meta (Facebook/Instagram Ads).
> A **decisão** (com trade-offs) vive no [ADR-0003](adr/0003-rastreamento-meta-pixel.md);
> aqui está o **como funciona** e o **como operar**.

## O que é

O **Meta Pixel** é um script da Meta que envia eventos do site (visita, ver produto,
adicionar ao carrinho, etc.) para o Gerenciador de Eventos. Serve para **medir anúncios**,
montar **públicos de remarketing** e **otimizar campanhas**.

Aqui usamos **só o pixel de navegador** (browser-only) — sem Conversions API (CAPI).
Motivo: a venda fecha **no WhatsApp**, fora do site; o servidor também não veria a compra
concluída, então o CAPI agregaria pouco agora (ver ADR-0003).

## Configuração (Pixel ID)

O ID vem da variável de ambiente **`REACT_APP_FB_PIXEL_ID`** (inlinada pelo CRA no build).

- **Local:** copie [`.env.example`](../.env.example) para `.env.local` e preencha o valor.
- **Produção:** configure a mesma variável na **Vercel** (Production + Preview) e refaça o deploy.
- **Sem o valor:** tudo vira **no-op** — o pixel não carrega e o banner de consentimento
  não aparece. O app funciona normalmente.

## Consentimento (LGPD, opt-in)

Nada dispara antes do consentimento.

- `ConsentBanner` mostra um aviso no rodapé enquanto o visitante não decidiu.
- **Aceitar** → grava `granted` em `localStorage` (`madiba:consent:analytics`) e chama
  `loadPixel()` (injeta o `fbevents.js` e dispara o primeiro `PageView`).
- **Recusar** → grava `denied`; o pixel nunca carrega.
- Visitante que já aceitou: o pixel religa sozinho na próxima visita.
- **Nunca enviamos PII** (telefone/endereço do cliente) nos parâmetros dos eventos.

## Eventos × ações (o funil)

| Evento | Quando dispara | Onde no código |
|---|---|---|
| `PageView` | Ao carregar, **após** consentimento | `loadPixel()` em [`metaPixel.ts`](../src/lib/analytics/metaPixel.ts) |
| `ViewContent` | Abrir o diálogo de um produto | [`BuqueExtrasDialog.tsx`](../src/components/BuqueExtrasDialog.tsx) |
| `AddToCart` | Adicionar ao carrinho (com/sem extras) | [`CartContext.tsx`](../src/context/CartContext.tsx) (`addItem`/`addBuque`) |
| `InitiateCheckout` | Entrar na tela de checkout | [`Checkout.tsx`](../src/components/Checkout.tsx) (efeito de montagem) |
| `Lead` | Clicar "Enviar pelo WhatsApp" | [`Checkout.tsx`](../src/components/Checkout.tsx) (`handleSubmit`) |

**Parâmetros:** `value` em **BRL (reais)** — os preços do app são em centavos, então
dividimos por 100; `currency: "BRL"`; `content_ids`/`content_name`/`content_category`
identificam o produto; `num_items` no checkout/lead.

## Limitação importante (WhatsApp)

O funil rastreável **termina no clique do WhatsApp** (`Lead`). A compra de fato acontece
na conversa, **fora do site** — então **não há evento `Purchase`** e o pixel não mede
receita/conversão final. `Lead` é o melhor proxy de "intenção de compra" disponível.

## Como validar

1. Defina `REACT_APP_FB_PIXEL_ID` em `.env.local` e rode `npm start`.
2. Instale a extensão **Meta Pixel Helper** (Chrome) e abra o site.
3. **Aceite** o banner → o Helper deve mostrar o pixel ativo e o `PageView`.
4. Percorra o funil (ver produto → adicionar → checkout → enviar) e confira cada evento
   no Helper e no **Gerenciador de Eventos → Testar eventos** (com `value`/`currency` certos).

## Arquivos

- [`src/lib/analytics/metaPixel.ts`](../src/lib/analytics/metaPixel.ts) — carga do pixel + `track()`.
- [`src/hooks/useConsent.ts`](../src/hooks/useConsent.ts) — estado do consentimento (localStorage).
- [`src/components/ConsentBanner.tsx`](../src/components/ConsentBanner.tsx) — banner LGPD.
