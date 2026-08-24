# Google Ads — conversões

> Como o catálogo reporta conversão para o Google Ads.
> A **decisão** (com trade-offs) vive no [ADR-0008](adr/0008-conversoes-google-ads.md);
> aqui está o **como funciona** e o **como operar**.

## O que é

Uma **ação de conversão** é o sinal que diz ao Google Ads "esse clique valeu a pena".
É com ela que as campanhas de lance automático aprendem quem perseguir. Sem conversão
configurada, o Google só sabe otimizar cliques — não resultado.

Aqui usamos **gtag.js direto** (sem Google Tag Manager), com **uma única** ação de conversão.

## Quando dispara

| Ação | Dispara? | Onde no código |
|---|---|---|
| Enviar o pedido pelo WhatsApp no checkout | ✅ **sim** | [`Checkout.tsx`](../src/components/Checkout.tsx) (`handleSubmit`) |
| Botão flutuante de WhatsApp | ❌ não | [`SocialFab.tsx`](../src/components/SocialFab.tsx) |
| Card de contato | ❌ não | [`ContactCard.tsx`](../src/components/ContactCard.tsx) |

Só o checkout conta **de propósito** (ADR-0008, D2): otimizar lance em cima de contato avulso
atrai quem só quer perguntar preço.

**Parâmetros:** `value` com o total do carrinho em **BRL (reais)** — os preços do app são em
centavos, então dividimos por 100 — e `currency: "BRL"`. **Nunca PII** (telefone/endereço).

## Configuração (`REACT_APP_GADS_SEND_TO`)

Uma variável só, no formato `AW-<ID da conta>/<label da ação>`:

```
REACT_APP_GADS_SEND_TO=AW-123456789/AbC-D_efGhIjK
```

O módulo deriva o `AW-...` (antes da barra) para carregar o `gtag.js` e usa a string inteira
no `send_to` do evento.

- **Local:** copie [`.env.example`](../.env.example) para `.env.local` e preencha.
- **Produção:** configure a mesma variável na **Vercel** (Production + Preview) e **refaça o
  deploy** — o CRA **inlina no build**, não lê em runtime. Mudar o valor no painel da Vercel
  não tem efeito nenhum até um novo deploy.
- **Sem o valor** (ou fora do formato): tudo vira **no-op** — o gtag não carrega. O app
  funciona normalmente e o build não quebra.

## Consentimento (LGPD, opt-in)

Mesmo gate do Meta Pixel — **um único banner cobre os dois** (ADR-0008, D3).

- `ConsentBanner` aparece enquanto o visitante não decidiu, se **pelo menos uma** das duas
  variáveis (`REACT_APP_FB_PIXEL_ID` ou `REACT_APP_GADS_SEND_TO`) estiver configurada.
- **Aceitar** → `loadPixel()` **e** `loadGtag()`.
- **Recusar** → nenhum script carrega. **Não usamos Consent Mode v2**: quem recusa não recebe
  script nenhum do Google, nem em modo restrito.

## Como criar a ação no painel (uma vez só)

Os nomes de menu do Google Ads mudam com frequência — busque pelo nome, não pelo caminho.

1. **Google Ads → Objetivos → Conversões → Nova ação de conversão → Site.**
2. Se ele pedir para escanear o site, **pule/escolha configuração manual** — nossa tag é
   disparada por código, não detectada por varredura.
3. **Categoria:** "Contato" ou "Enviar formulário de lead".
4. **Valor:** *"Usar valores diferentes para cada conversão"* — é o `value` que mandamos.
   Defina um valor padrão só como fallback.
5. **Contagem: "Uma".** ⚠️ O padrão às vezes vem "Todas". Com "Todas", cada reenvio do mesmo
   pedido vira uma conversão nova e infla o número que alimenta o lance automático.
6. Marque como **conversão principal** (a que otimiza lances). É a única que temos.
7. Abra a ação → **Configurar tag → Instalar manualmente**. O snippet mostra
   `send_to: 'AW-123456789/AbC-D_efGhIjK'` — **copie o que está entre aspas** e é isso que
   vai na variável de ambiente.
8. Ignore o resto do snippet: a tag do Google e o evento já estão implementados no código.

**Chamadas telefônicas** são uma ação de conversão **separada** (recurso de chamada ou clique
no número). Não está implementada aqui — o site não expõe `tel:`.

## Como validar

1. Preencha `REACT_APP_GADS_SEND_TO` em `.env.local` e rode `npm start`.
2. Instale a extensão **Google Tag Assistant** (Chrome).
3. **Aceite** o banner → o Assistant deve mostrar a tag `AW-...` ativa.
4. Monte um pedido e clique em **"Enviar pelo WhatsApp"** → deve aparecer um evento
   `conversion` com o `send_to` certo e `value`/`currency` batendo com o carrinho.
5. **Recuse** o banner numa aba anônima → nenhuma requisição para `googletagmanager.com`.
6. No painel, a ação leva algumas horas para sair de "Não verificada". Conversões só aparecem
   nos relatórios depois de haver **clique em anúncio** — teste direto no site não gera
   conversão registrada, só o disparo da tag.

## Limitação importante (WhatsApp)

A venda fecha **na conversa**, fora do site. O `value` que enviamos é do **carrinho montado**,
não da venda concluída — o Google Ads vai reportar receita **potencial**, superestimada.
Serve para comparar campanhas entre si, **não** para medir faturamento. Medir venda fechada
exigiria importação de conversões offline via GCLID (ver Alternativas no
[ADR-0008](adr/0008-conversoes-google-ads.md)).

## Arquivos

- [`src/lib/analytics/googleAds.ts`](../src/lib/analytics/googleAds.ts) — carga do gtag + `trackConversion()`.
- [`src/components/ConsentBanner.tsx`](../src/components/ConsentBanner.tsx) — banner LGPD (Meta + Google).
- [`src/hooks/useConsent.ts`](../src/hooks/useConsent.ts) — estado do consentimento (localStorage).
- [`docs/meta-pixel.md`](meta-pixel.md) — a integração irmã, com o funil completo.
