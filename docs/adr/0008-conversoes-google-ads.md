# ADR-0008 — Conversões no Google Ads (gtag direto, um único evento)

- **Status:** Aceito — 2026-08-23
- **Contexto do projeto:** SPA em Create React App (React 18.2, TS 4.9), sem router e sem
  backend; deploy na Vercel. Checkout finaliza **no WhatsApp** (`wa.me`), fora do site.
- **Relacionado:** [ADR-0003](0003-rastreamento-meta-pixel.md) (Meta Pixel) — este ADR reusa
  o mesmo desenho de módulo e o mesmo fluxo de consentimento.

> **Nota de numeração:** não existe ADR-0006 neste repo (nem no índice). Este ADR pula para
> `0008` de propósito, para não reaproveitar um número que possa ter sido usado e descartado.

## Contexto

Vamos anunciar no Google Ads. Sem uma ação de conversão configurada, o Google não tem sinal
de qualidade para otimizar lances — as campanhas viram compra de cliques às cegas.

O [ADR-0003](0003-rastreamento-meta-pixel.md) já resolveu o problema equivalente para a Meta:
módulo TS próprio, carga só após consentimento, funil de cinco eventos. Aqui restava decidir
**se o Google entra pelo mesmo caminho** e, principalmente, **o que conta como conversão** —
porque no Google Ads a conversão principal alimenta o algoritmo de lances, e um sinal ruim
custa dinheiro de forma direta.

Existem **três** portas para o WhatsApp no site, e a decisão precisava escolher entre elas:

| Onde | Contexto do clique |
|---|---|
| [`Checkout.tsx`](../../src/components/Checkout.tsx) (`handleSubmit`) | Pedido montado — carrinho, itens e valor |
| [`SocialFab.tsx`](../../src/components/SocialFab.tsx) | Botão flutuante, `wa.me` cru, sem contexto |
| [`ContactCard.tsx`](../../src/components/ContactCard.tsx) | Card de contato, sem contexto |

## Decisão

**D1 — gtag direto, não GTM.** Script carregado por um módulo TS próprio
(`src/lib/analytics/googleAds.ts`) com `isAdsConfigured()`, `loadGtag()` e
`trackConversion(params)`. Sem Google Tag Manager e sem lib de terceiros.

**D2 — Uma única conversão: o envio do carrinho.** Só `handleSubmit` do checkout dispara.
FAB e card de contato **não** contam, nem como conversão secundária.

**D3 — Consentimento: banner único.** O mesmo "Aceitar" do [ADR-0003](0003-rastreamento-meta-pixel.md)
libera Meta Pixel **e** Google Ads. Sem checkbox por finalidade.

**D4 — Sem Consent Mode v2.** Quem recusa não carrega script nenhum do Google.

**D5 — A conversão leva `value`/`currency`,** com o total do carrinho em BRL (reais) — mesma
convenção do `Lead` da Meta.

**Configuração:** `REACT_APP_GADS_SEND_TO`, no formato `AW-<conta>/<label>`. Ausente ou
malformada ⇒ tudo no-op (build não quebra). Operação em [`docs/google-ads.md`](../google-ads.md).

## Consequências

**Positivas**
- Sinal de otimização limpo: o Google aprende a perseguir quem monta pedido, não quem clica
  num botão flutuante para perguntar preço.
- Coerência com o que já existe — um só modelo mental de rastreamento (código, não painel),
  um só lugar para depurar, um só gate de consentimento.
- Robusto à falta de configuração: sem a variável, nada carrega e o app segue normal. Deu
  para implementar e revisar **antes** de a conta do Google Ads existir.
- Zero dependência nova; nada no `index.html`.

**Negativas / custos**
- Mudar rastreamento exige commit + deploy (é o custo de não usar GTM — ver Alternativas).
- Opt-in e bloqueadores descartam parte das conversões; sem Consent Mode, não há modelagem
  estatística para compensar. Volume reportado < volume real.
- **Sem `Purchase`:** a venda fecha no WhatsApp. O `value` enviado é do **carrinho montado**,
  não da venda fechada — é receita *potencial*, e o relatório do Google Ads vai superestimar.
  Aceito conscientemente: serve para ranquear campanhas entre si, não para medir faturamento.
- Se um dia entrar uma agência mexendo em tags, D1 vira atrito e o GTM volta à mesa.

## Alternativas consideradas

- **GTM (Google Tag Manager):** tags configuráveis por painel, sem deploy. Rejeitado por
  incoerência com o ADR-0003 (Pixel em código × Google em painel = duas fontes de verdade) e
  porque o consentimento passaria a depender de configuração de painel — mais superfície para
  furar uma obrigação legal. **Reavaliar** se entrar time de marketing ou uma 3ª plataforma
  de tracking.
- **Snippet direto no `index.html`:** mais rápido, mas dispara antes do consentimento —
  contradiz frontalmente o ADR-0003 (D3).
- **Contar também FAB e ContactCard:** mais volume de conversão, sinal pior. Um clique no
  botão flutuante não distingue "quero comprar" de "quanto custa entrega?".
- **Espelhar o funil inteiro (ViewContent/AddToCart/…) como conversões secundárias:** os
  eventos já existem no código, então o custo seria baixo. Rejeitado por ora: sem campanha
  rodando ainda, seria instrumentação sem leitor. **Reavaliar** quando houver volume.
- **Conversão offline via GCLID import:** mediria a venda **fechada** (o problema real do
  `value` potencial). Exige capturar o `gclid`, carregá-lo até a conversa do WhatsApp e subir
  planilha de vendas depois. Desproporcional ao volume atual — **reavaliar** se a operação
  crescer.
- **Sem `value`:** contagem pura, sem receita nos relatórios. Rejeitado — perderíamos a
  distinção entre um pedido de R$ 80 e um de R$ 400, que é justamente o que interessa otimizar.
