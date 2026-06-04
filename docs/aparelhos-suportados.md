# Aparelhos suportados — base de todo o CSS

> **Fonte de verdade do responsivo.** Todo CSS (larguras, breakpoints, toques,
> tamanhos de fonte) deve ser pensado e testado contra esta lista. Mobile é
> **prioridade máxima** — o catálogo é consumido majoritariamente no celular.
> Se um layout quebra em qualquer aparelho abaixo, é bug.

## Mobile (prioridade máxima)

| Dispositivo             | Viewport       | DPR  |
|-------------------------|----------------|------|
| Moto G34 / Galaxy A14   | 360 × 800      | 2.0  |
| Galaxy A15              | 360 × 800      | 3.0  |
| iPhone SE               | 375 × 667      | 2.0  |
| Galaxy A35 / A55        | 412 × 915      | 2.6  |
| Moto G54 / G84          | 393 × 873      | 2.75 |
| Xiaomi Redmi Note 12    | 393 × 851      | 2.75 |
| iPhone 14 Pro Max       | 430 × 932      | 3.0  |
| Galaxy A51/71           | 412 × 914      | 2.6  |

## Tablet

| Dispositivo  | Viewport       |
|--------------|----------------|
| iPad Mini    | 768 × 1024     |
| iPad Air     | 820 × 1180     |

## Desktop

| Breakpoint   | Viewport       |
|--------------|----------------|
| Notebook HD  | 1280 × 800     |
| Desktop FHD  | 1440 × 900     |
| Wide         | 1920 × 1080    |

## Como usar no CSS

- **Menor viewport = 360 px de largura.** Nenhum elemento pode estourar a tela
  (sem scroll horizontal) a partir de 360 px. Ao usar flex, lembre `min-width: 0`
  para os itens poderem encolher; em inputs, `box-sizing: border-box` + `width: 100%`.
- **Pense mobile-first:** estilo base mira ~360–430 px; use `@media (min-width: …)`
  para subir para tablet/desktop, não o contrário.
- **Breakpoints de referência** (derivados dos saltos de viewport acima):
  - `≤ 480px` — faixa mobile (já usada em `ProductCard`, `ProductGrid`).
  - `≤ 640px` — mobile largo / phablet (já usada em `App`, `FilterBar`).
  - `≥ 768px` — tablet (iPad Mini em diante).
  - `≥ 1280px` — desktop.
- **DPR alto (2.0–3.0):** imagens e ícones precisam ficar nítidos; evite assets
  de baixa resolução e prefira SVG quando possível.
- **Validação:** teste no DevTools (modo responsivo) nos viewports da tabela
  mobile antes de considerar uma mudança de layout pronta — começando por 360 px.
