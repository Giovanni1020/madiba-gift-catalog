# ADR-0006 — Frete por distância viária (proxy serverless + geocoder)

- **Status:** Aceito — 2026-07-06
- **Contexto do projeto:** SPA em CRA (React 18.2, TS 4.9), estático na Vercel, sem
  backend; checkout com toggle retirada/entrega e handoff pro WhatsApp. Origem: card #18;
  reverte a postergação de "mapa/geocoding e zonas" (escopo-v1/v1.1).

## Contexto

A loja precifica entrega por **distância viária de ida** a partir da loja:
`frete = arredonda5(km × 2)`, piso R$10, teto/raio 25 km → R$50; acima de 25 km, fora da
cobertura. Zona por bairro é grosseira (bairros de 5–10+ km cruzam o corte de 25 km);
linha reta (Haversine) subestima o trajeto e erra no corte rígido. Logo, o cálculo exige
**rota viária real + geocodificação do destino** — ambos dependem de uma chave de API.

Origem da loja: R. Mal. Humberto de Alençar Castelo Branco, 718 — Bela Vista, Alvorada/RS,
94850-810. Geocodada **uma vez** e congelada como constante (não se geocoda a origem a cada
chamada).

## Decisão

1. **Cálculo server-side** numa **Vercel Function** `/api/frete` (stateless, atua como
   **proxy**): a chave do provedor vive só no servidor (env var, **não** `REACT_APP_*`, que
   seria inlinada no bundle). Responde `{ km, frete, dentroDoRaio, aproximado }`. Cache por
   CEP/endereço.
2. **Provedor:** Google Maps Platform (Geocoding API + Routes API). Mapbox foi preterido por
   passar a exigir cartão no cadastro — sem essa vantagem, o Google vence pela melhor
   geocodificação no BR (nível de número da casa), o que importa no corte de 25 km. Trocável
   via `/api` sem tocar no front. Chave protegida por restrição de API + quotas + budget alert.
3. **Regra como função pura** em `src/domain/frete.ts` (testada), independente do provedor
   e sem React — segue a diretriz de "funções puras na camada de domínio".
4. **Entrada de endereço:** autocomplete (devolve coordenada) como primário; CEP (ViaCEP)
   opcional; campos livres como baseline sempre editável.
5. **Fora do raio / borda fuzzy / falha de API:** **aviso forte, não trava** (segue pro
   WhatsApp). O frete entra na mensagem como **estimativa que a loja confirma**.
6. **LGPD:** endereço tratado como **necessário à execução do pedido** (sem banner opt-in);
   apenas uma **nota de transparência** curta no ponto de coleta.

## Consequências

**Positivas**
- Implementa a regra real de precificação (km de carro), não uma aproximação.
- Chave protegida no servidor; cache reduz chamadas e latência.
- Provedor trocável sem tocar no front (a fronteira é o contrato do `/api/frete`).
- Regra pura e testável, isolada do provedor.
- Custo ≈ R$0/mês no volume atual (free tier do Google Maps e do Vercel Hobby).

**Negativas / custos**
- Introduz uma **função serverless** — rompe o invariante "100% estático". É leve e
  stateless, mas passa a ser um alvo operacional novo.
- Dev local passa a usar `vercel dev` (sobe CRA + function juntos).
- Dependência externa em runtime → exige **fallback** (timeout/erro → `aproximado`).
- A precisão perto do corte de 25 km depende da qualidade do geocode.
- O Google exige conta de billing (cartão) mesmo no free tier — mitigado por restrição de
  API, quota diária baixa e budget alert.

## Alternativas consideradas

- **Zona por cidade/bairro (tabela):** grátis e offline, mas grosseira no corte de 25 km
  (bairros cruzam o limite) — rejeitada pelo próprio critério de precificação.
- **Haversine no front (sem backend):** grátis, mas não é "km de carro" e erra no corte
  rígido.
- **Chave no front + restrição de referrer:** sem backend, porém expõe a chave e não
  permite cache/troca de provedor central — preterida por segurança e controle.
- **Google de cara:** melhor geocode (nº da casa), mas exige conta de billing; adiado como
  upgrade opcional, viável via o mesmo proxy.
