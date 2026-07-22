// ─── Types ───────────────────────────────────────────────────────────────────

export type Category = "buques" | "buques-cetim" | "cestas" | "doces";

// Variante de um produto (ADR-0005): opção mutuamente exclusiva escolhida no diálogo.
// Carrega preço ABSOLUTO (não delta) e pode sobrepor a imagem e o nº de chocolates.
export interface ProductVariant {
  id: string; // estável, ex: "3-girassois"
  label: string; // rótulo exibido, ex: "3 girassóis"
  price: number; // em centavos BRL — preço absoluto desta variante
  image?: string; // opcional: sobrepõe a mídia no diálogo (poster/zoom). Dado futuro.
  maxChocolates?: number; // opcional: sobrepõe o maxChocolates do produto
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number; // em centavos BRL, ex: 7990 = R$79,90. Com `variants`, é o "a partir de" (menor variante).
  category: Category;
  image: string; // caminho relativo a /public, ex: "/images/produto.jpg"
  video?: string; // caminho relativo a /public, ex: "/vids/produto.mp4". Quando presente, substitui a imagem no diálogo (autoplay/loop, sem controles). image vira o poster/fallback.
  lazyVideo?: boolean; // true = carrega sob demanda (preload "metadata"); false/ausente = carrega imediatamente (preload "auto")
  featured?: boolean;
  inStock?: boolean;
  maxChocolates?: number; // buquês: controla a seção de chocolates (0/ausente = sem chocolate). Com `variants`, é o default sobreposto pela variante.
  note?: string; // observação visível no card (ex.: pelúcia pode variar)
  exclusiveExtras?: boolean; // cestas: balão e plaquinha são mutuamente exclusivos
  hideBalao?: boolean; // não oferecer balão como adicional (cesta que já vem com balão, ou item sem opção de balão)
  hidePlaquinha?: boolean; // não oferecer plaquinha como adicional
  variants?: ProductVariant[]; // opções por produto (ADR-0005); quando presente, o cliente escolhe uma no diálogo
}

// ─── Extras ──────────────────────────────────────────────────────────────────

export type ChocolateOption =
  | "ferrero"
  | "sonho_de_valsa"
  | "rafaello"
  | "ouro_branco";

export interface ChocolateExtra {
  id: ChocolateOption;
  name: string;
  price: number;
  unavailable?: boolean; // esgotado: aparece na lista mas não pode ser selecionado
}

export const CHOCOLATE_OPTIONS: ChocolateExtra[] = [
  { id: "ferrero", name: "Ferrero Rocher", price: 700 },
  { id: "sonho_de_valsa", name: "Sonho de Valsa", price: 300 },
  { id: "rafaello", name: "Rafaello", price: 400, unavailable: true },
  { id: "ouro_branco", name: "Ouro Branco", price: 300 },
];

// Balloon options — display names match what's printed on each balloon
export const BALAO_OPTIONS = [
  "Te Amo",
  "Com Carinho",
  "Parabéns (Rosa)",
  "Com Carinho (rosa)",
  "Parabéns (Verm.)",
  "Te Amo Mãe",
] as const;
export type BalaoOption = (typeof BALAO_OPTIONS)[number];

// Plaquinha options grouped by reference image page (top-left to bottom-right)
export const PLAQUINHA_OPTIONS_BY_PAGE = [
  // Page 1
  [
    "Amor",
    "Parabéns pelo seu Dia",
    "Te Amo",
    "Vó te Amo",
    "Parabéns pela Formatura",
    "Sucesso",
  ],
  // Page 2
  [
    "Gratidão",
    "Com Amor",
    "Parabéns",
    "Quer Casar Comigo?",
    "Quer Namorar Comigo?",
    "Você é Especial",
  ],
  // Page 3
  [
    "Com Carinho",
    "Sucesso",
    "Te Amo Mãe",
    "Mãe Você é Especial",
    "Mãe Te Amo",
    "Te Amo",
  ],
] as const;

export const PLAQUINHA_OPTIONS = PLAQUINHA_OPTIONS_BY_PAGE.flat();
export type PlaquinhaOption = (typeof PLAQUINHA_OPTIONS)[number];

// Cartão (grátis): "branco" = o cliente escreve a mensagem; "pre_escrito" =
// cartão padrão já escrito (sem texto do cliente).
export type CartaoTipo = "branco" | "pre_escrito";

export interface BuqueExtras {
  balao: BalaoOption | null; // null = not selected
  plaquinha: PlaquinhaOption | null;
  cartao: CartaoTipo | null; // null = sem cartão; "branco" ou "pre_escrito"
  cartaoMensagem?: string; // texto escrito pelo cliente (quando cartao === "branco")
  chocolates: Partial<Record<ChocolateOption, number>>;
}

export const EXTRAS_PRICES = {
  balao: 1000,
  plaquinha: 990,
} as const;

export function extrasTotal(extras: BuqueExtras): number {
  const chocTotal = CHOCOLATE_OPTIONS.reduce(
    (sum, c) => sum + (extras.chocolates[c.id] ?? 0) * c.price,
    0,
  );
  return (
    (extras.balao ? EXTRAS_PRICES.balao : 0) +
    (extras.plaquinha ? EXTRAS_PRICES.plaquinha : 0) +
    chocTotal
  );
}

// ─── Preço por variante (ADR-0005) ─────────────────────────────────────────────
// Ponto único de verdade do preço-base: a variante escolhida sobrepõe o do produto.
// Usar SEMPRE em vez de `product.price` (carrinho, checkout, mensagem, diálogo),
// senão o total diverge quando há variantes.
export function basePrice(
  product: Product,
  variant?: ProductVariant | null,
): number {
  return variant?.price ?? product.price;
}

// Preço "a partir de" para o card: a menor variante, ou o próprio price quando não há.
export function priceFrom(product: Product): number {
  if (!product.variants?.length) return product.price;
  return Math.min(...product.variants.map((v) => v.price));
}

// ─── Category labels ──────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<Category, string> = {
  buques: "Buquês",
  "buques-cetim": "Buquês Doce",
  cestas: "Cestas",
  doces: "Doces",
};

// ─── Products ────────────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  // ── Buquês ───────────────────────────────────────────────────────────────
  {
    id: 3,
    name: "Buquê 3 Rosas Cor de Rosa",
    description:
      "Buquê com 3 rosas cor de rosa, baby breath e folhagem, embrulho temático com laço.",
    price: 5990,
    category: "buques",
    image: "/images/buque-3-rosas-cor-de-rosa.jpeg",
    maxChocolates: 3,
    note: "Obs: pode haver pequenas variações de tonalidade. Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
  },
  {
    id: 4,
    name: "Buquê 5 Rosas Importadas",
    description:
      "Buquê com 5 rosas vermelhas importadas e folhagem verde, embrulho vermelho elegante.",
    price: 12490,
    category: "buques",
    image: "/images/buque-5-rosas-importadas.jpeg",
    video: "/vids/buque-5-rosas-importadas.mp4",
    lazyVideo: false,
    featured: true,
    maxChocolates: 5,
    note: "Obs: Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
  },
  {
    id: 5,
    name: "Buquê 1 Girassol Luxo",
    description:
      "Buquê luxo com 1 girassol e baby breath, embrulho 'I Love You'.",
    price: 4990,
    category: "buques",
    image: "/images/buque-1-girassol-luxo.jpeg",
    maxChocolates: 3,
    note: "Obs: Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
  },
  {
    id: 6,
    name: "Buquê 3 Rosas Vermelhas Importadas",
    description:
      "Buquê com 3 rosas vermelhas importadas, baby breath e folhagem, embrulho vermelho.",
    price: 7490,
    category: "buques",
    image: "/images/buque-3-rosas-vermelhas-importadas.jpeg",
    maxChocolates: 3,
    note: "Obs: Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
  },
  {
    id: 37,
    name: "Buquê 3 Rosas Nacionais",
    description:
      "Buquê com 3 rosas nacionais, baby breath e folhagem, embrulho temático com laço.",
    price: 5990,
    category: "buques",
    image: "/images/buque-3-rosas-nacionais.jpeg",
    maxChocolates: 5,
    note: "Obs: Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
  },
  {
    id: 36,
    name: "Buquê 10 Rosas Importadas",
    description:
      "Buquê com 10 rosas importadas, baby breath e folhagem, embrulho elegante com laço.",
    price: 24990,
    category: "buques",
    image: "/images/buque-10-rosas-importadas.jpeg",
    maxChocolates: 10,
    note: "Obs: Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
  },
  {
    id: 7,
    name: "Buquê Medelin",
    description:
      "Buquê com 3 rosas vermelhas importadas e 1 girassol, solidago, baby breath, embrulho preto e dourado.",
    featured: true,
    price: 9990,
    category: "buques",
    image: "/images/buque-3-rosas-importadas-1-girassol.jpeg",
    video: "/vids/buque-medelin.mp4",
    lazyVideo: false,
    maxChocolates: 5,
    note: "Obs: Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
  },
  {
    id: 21,
    name: "Buquê Girassol Tradicional",
    description:
      "Buquê de girassóis com baby breath e folhagem, embrulho temático com laço.",
    price: 4990, // "a partir de" = menor variante (2 girassóis)
    category: "buques",
    image: "/images/buque-girassol.jpeg",
    maxChocolates: 4, // default/fallback; cada variante sobrepõe
    note: "Obs: Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
    variants: [
      {
        id: "2-girassois",
        label: "2 girassóis",
        price: 4990,
        maxChocolates: 4,
      },
      {
        id: "3-girassois",
        label: "3 girassóis",
        price: 7490,
        maxChocolates: 6,
      },
      {
        id: "4-girassois",
        label: "4 girassóis",
        price: 9990,
        maxChocolates: 8,
      },
    ],
  },
  {
    id: 25,
    name: "Buquê 1 Girassol com Mosquitinho Azul",
    description:
      "Buquê com 1 girassol e mosquitinho azul, embrulho temático com laço.",
    price: 4990,
    category: "buques",
    image: "/images/buque-1-girassol-Mos-Azul.jpeg",
    maxChocolates: 4,
    note: "Obs: Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
  },
  {
    id: 26,
    name: "Buquê Astromélias Rosas",
    description: "Buquê de astromélias rosas, embrulho temático com laço.",
    note: "Obs: Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
    price: 6490,
    category: "buques",
    image: "/images/buque_astromelias_rosa.jpeg",
    maxChocolates: 3,
  },
  {
    id: 27,
    name: "Buquê Astromélias Laranjas",
    description: "Buquê de astromélias laranjas, embrulho temático com laço.",
    note: "Obs: Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
    price: 6490,
    category: "buques",
    image: "/images/buque_astromelias_laranja.jpeg",
    maxChocolates: 3,
  },
  {
    id: 34,
    name: "Buquê Girassol",
    description: "Buquê com 1 girassol, embrulho temático com laço.",
    note: "Obs: Pode haver variação na embalagem e/ou folhagens utilizadas de acordo com a disponibilidade",
    price: 3000,
    category: "buques",
    image: "/images/buque-girassol-normal.jpeg",
    maxChocolates: 3,
  },
  {
    id: 22,
    name: "Cartão Buquê",
    description:
      "Cartão em formato de buquê com mensagem, embrulho temático com laço.",
    price: 4990,
    category: "buques",
    image: "/images/buque-cartao.jpeg",
    hideBalao: true, // adicional: apenas plaquinha (sem balão e sem chocolate)
  },

  // ── Buquês de rosa de cetim com chocolates inclusos ────────────────────────
  // Sem `maxChocolates`: chocolate já vem no buquê, então só aceitam balão/plaquinha.
  {
    id: 8,
    name: "Buquê 1 Rosa de Cetim + 6 Sonho de Valsa",
    description:
      "Buquê com 1 rosa de cetim e 6 bombons Sonho de Valsa, embrulho temático com laço.",
    price: 3990,
    category: "buques-cetim",
    image: "/images/buque-cetim-6-sonho-de-valsa.jpeg",
  },
  {
    id: 9,
    name: "Buquê 1 Rosa de Cetim + 3 Ouro Branco e 3 Sonho de Valsa",
    description:
      "Buquê com 1 rosa de cetim, 3 Ouro Branco e 3 Sonho de Valsa, embrulho temático com laço.",
    price: 3990,
    category: "buques-cetim",
    image: "/images/buque-cetim-3-ouro-branco-3-sonho-de-valsa.jpeg",
  },
  {
    id: 10,
    name: "Buquê 1 Rosa de Cetim + 6 Ouro Branco",
    description:
      "Buquê com 1 rosa de cetim e 6 bombons Ouro Branco, embrulho temático com laço.",
    price: 3990,
    category: "buques-cetim",
    image: "/images/buque-cetim-6-ouro-branco.jpeg",
  },
  {
    id: 11,
    name: "Buquê 1 Rosa de Cetim + 7 Ferrero Rocher",
    description:
      "Buquê com 1 rosa de cetim e 7 Ferrero Rocher, embrulho vermelho com laço.",
    price: 5990,
    category: "buques-cetim",
    image: "/images/buque-cetim-7-ferrero-rocher.jpeg",
  },
  {
    id: 12,
    name: "Buquê 1 Rosa de Cetim + 7 Rafaello",
    description: "Buquê com 1 rosa de cetim e 7 Rafaello, embrulho com laço.",
    price: 4990,
    category: "buques-cetim",
    image: "/images/buque-cetim-7-rafaello.jpeg",
  },
  {
    id: 35,
    name: "Buquê Amor Eterno",
    description: "Contém: 1 balão Te Amo, 3 rosas de cetim, 8 Sonho de Valsa.",
    price: 6990,
    category: "buques-cetim",
    image: "/images/buque-amor-eterno.jpeg",
    hideBalao: true,
    hidePlaquinha: true,
  },
  {
    id: 23,
    name: "Buquê Angel",
    description: "Buquê Angel de rosas de cetim, embrulho temático com laço.",
    price: 6990,
    category: "buques-cetim",
    image: "/images/buque-angel.jpeg",
  },
  {
    id: 24,
    name: "Buquê Stitch",
    description: "Buquê Stitch de rosas de cetim, embrulho temático com laço.",
    price: 6990,
    category: "buques-cetim",
    image: "/images/buque-stitch.jpeg",
  },

  // ── Cestas ───────────────────────────────────────────────────────────────
  {
    id: 1,
    name: "Box for Man",
    description:
      "Contém: 1 cerveja imigração, 1 cerveja Corona, Ferrero Rocher c3, 1 Pringles, baldinho de metal.",
    price: 7990,
    category: "cestas",
    image: "/images/box-for-man.jpeg",
    exclusiveExtras: true,
  },
  {
    id: 2,
    name: "Box for Lovers",
    description:
      "Contém: pelúcia, 1 vinho chileno, castanha, torradinha, 2 KitKat, Nutella, Ferrero Rocher c/4, caixa MDF.",
    note: "Obs: pelúcia pode variar da imagem.",
    price: 18990,
    category: "cestas",
    image: "/images/box-for-lovers.jpeg",
    featured: true,
    exclusiveExtras: true,
  },

  {
    id: 13,
    name: "Cesta Te Amo",
    description:
      "Contém: 1 pelúcia GG, 2 KitKat, 1 Nutella 140g, Ferrero Rocher c/3.",
    note: "Obs: pelúcia pode variar da imagem.",
    price: 18990,
    category: "cestas",
    image: "/images/cesta-te-amo.jpeg",
    exclusiveExtras: true,
  },
  {
    id: 14,
    name: "Cesta Love",
    description:
      "Contém: 1 pelúcia G, 1 KitKat, 1 Nutella 140g, Ferrero Rocher c/3, 1 Kinder Bueno.",
    note: "Obs: pelúcia pode variar da imagem.",
    price: 13990,
    category: "cestas",
    image: "/images/cesta-love.jpeg",
    exclusiveExtras: true,
  },
  {
    id: 15,
    name: "Cesta Encanto",
    description:
      "Contém: 1 pelúcia M, 1 balão coração, 1 KitKat e 15 itens diversos.",
    note: "Obs: pelúcia pode variar da imagem.",
    price: 7990,
    category: "cestas",
    image: "/images/cesta-encanto.jpeg",
    exclusiveExtras: true,
    hideBalao: true,
  },
  {
    id: 16,
    name: "Box Você é Especial",
    description:
      "Contém: 1 pelúcia G, 1 balão coração, 1 KitKat, 2 bombons, Ferrero Rocher c/3.",
    note: "Obs: pelúcia pode variar da imagem.",
    price: 8990,
    category: "cestas",
    image: "/images/box-voce-e-especial.jpeg",
    exclusiveExtras: true,
    hideBalao: true,
  },
  {
    id: 17,
    name: "Box 5",
    description:
      "Contém: 1 pelúcia M, 1 balão coração, 3 rosas, Ferrero Rocher c/4, 1 Kinder Bueno.",
    note: "Obs: pelúcia pode variar da imagem.",
    price: 14990,
    category: "cestas",
    image: "/images/box-5.jpeg",
    inStock: false,
    exclusiveExtras: true,
    hideBalao: true,
  },
  {
    id: 18,
    name: "Box 6",
    description:
      "Contém: 1 pelúcia G, 1 balão coração, 3 rosas, Ferrero Rocher c/8, 1 Kinder Bueno, 1 Nutella, 2 Bis Extra.",
    note: "Obs: pelúcia pode variar da imagem.",
    price: 24990,
    category: "cestas",
    image: "/images/box-6.jpeg",
    inStock: false,
    exclusiveExtras: true,
    hideBalao: true,
  },
  {
    id: 19,
    name: "Box Café da Manhã",
    description: "Contém um mix de 30 itens de café da manhã.",
    price: 7490,
    category: "cestas",
    image: "/images/box-cafe-da-manha.jpeg",
    exclusiveExtras: true,
  },
  {
    id: 31,
    name: "Mini Cesta Café da Manhã",
    description: "Contém: 30 itens de café da manhã.",
    price: 6990,
    category: "cestas",
    image: "/images/mini-cesta-cafe-da-manha.jpeg",
    hidePlaquinha: true,
  },
  {
    id: 32,
    name: "Box Mãe Amor Infinito",
    description: "Contém: arranjo com 3 rosas, Ferrero Rocher c/8.",
    price: 11490,
    category: "cestas",
    image: "/images/box-mae-amor-infinito.jpeg",
    hidePlaquinha: true,
  },
  {
    id: 33,
    name: "Box Mulher Incrível",
    description: "Contém: arranjo com 3 rosas, trufas 195g.",
    price: 8990,
    category: "cestas",
    image: "/images/box-mulher-incrivel.jpeg",
    hidePlaquinha: true,
  },
  {
    id: 20,
    name: "Box Com Carinho",
    description: "Contém: 1 balão coração, arranjo com 2 rosas, trufas 55g.",
    price: 7490,
    category: "cestas",
    image: "/images/box-com-carinho.jpeg",
    exclusiveExtras: true,
    hideBalao: true,
  },

  // ── Doces ────────────────────────────────────────────────────────────────
  {
    id: 28,
    name: "Ferrero Rocher 3 Unidades",
    description: "Caixa com 3 Ferrero Rocher.",
    price: 1990,
    category: "doces",
    image: "/images/ferrero_3U.jpeg",
  },
  {
    id: 29,
    name: "Ferrero Rocher 4 Unidades",
    description: "Caixa com 4 Ferrero Rocher.",
    price: 2490,
    category: "doces",
    image: "/images/ferrero_4U.jpeg",
  },
  {
    id: 30,
    name: "Ferrero Rocher 8 Unidades",
    description: "Caixa com 8 Ferrero Rocher.",
    price: 4990,
    category: "doces",
    image: "/images/ferrero_8U.jpeg",
  },
];
