# ADR-0003 — Rastreamento via Meta Pixel (browser-only, opt-in)

- **Status:** Aceito — 2026-06-05
- **Contexto do projeto:** SPA em Create React App (React 18.2, TS 4.9), sem router e sem
  backend; deploy na Vercel. Checkout finaliza **no WhatsApp** (`wa.me`), fora do site.

## Contexto

Queremos medir o funil (visita → produto → carrinho → checkout → clique no WhatsApp) para
alimentar públicos e otimizar anúncios da Meta (Facebook/Instagram). Quatro escolhas com
trade-off precisavam ser fechadas antes de codar.

## Decisão

**D1 — Como carregar:** módulo TS próprio (`src/lib/analytics/metaPixel.ts`) com
`isPixelConfigured()`, `loadPixel()` e `track(event, params)` tipados. Sem snippet solto no
`index.html` e sem lib de terceiros.

**D2 — Estratégia:** **browser-only** (só o pixel de navegador). **Sem** Conversions API
(CAPI) por ora.

**D3 — Consentimento (LGPD):** **opt-in**. Banner no rodapé; o pixel só carrega após
"Aceitar". Decisão persistida em `localStorage` (mesma família do [ADR-0002](0002-estado-e-persistencia-do-carrinho.md)).

**D4 — Eventos:** funil completo — `PageView`, `ViewContent`, `AddToCart`,
`InitiateCheckout`, `Lead`. **Nunca PII** nos parâmetros.

**Configuração:** Pixel ID via `REACT_APP_FB_PIXEL_ID`; ausente ⇒ tudo no-op (build não quebra).

## Consequências

**Positivas**
- Código tipado, testável e desacoplado do domínio; um único `track()` para todo o app.
- Conformidade com LGPD por design (nada dispara sem consentimento; sem PII).
- Robusto à falta de configuração: sem o ID, o app segue normal.

**Negativas / custos**
- Pixel de navegador perde eventos (bloqueadores, iOS/Safari, fim do cookie de terceiros).
- Opt-in descarta os eventos de quem recusa (ou não decide) — é o custo da conformidade.
- **Sem `Purchase`:** a venda fecha no WhatsApp; o melhor proxy de conversão é `Lead`.

## Alternativas consideradas

- **CAPI (servidor) agora:** mais robusto contra bloqueadores, mas exige função serverless e
  guardar o Access Token; ganho marginal porque o servidor também não vê a compra (fecha no
  WhatsApp). **Reavaliar** se um dia a venda acontecer dentro do site.
- **Snippet no `index.html`:** rápido, mas sem tipagem, difícil de testar e de plugar consentimento.
- **Lib `react-facebook-pixel`:** menos código nosso, mas dependência pouco mantida e menos transparente.
- **Disparar sem consentimento (legítimo interesse):** captura mais dados, maior exposição legal — rejeitado.
