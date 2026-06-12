// ─── Types ───────────────────────────────────────────────────────────────────

export type Category = "buques" | "buques-cetim" | "cestas";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number; // em centavos BRL, ex: 7990 = R$79,90
  category: Category;
  image: string; // caminho relativo a /public, ex: "/images/produto.jpg"
  video?: string; // caminho relativo a /public, ex: "/vids/produto.mp4". Quando presente, substitui a imagem no diálogo (autoplay/loop, sem controles). image vira o poster/fallback.
  lazyVideo?: boolean; // true = carrega sob demanda (preload "metadata"); false/ausente = carrega imediatamente (preload "auto")
  featured?: boolean;
  inStock?: boolean;
  maxChocolates?: number; // buquês: controla a seção de chocolates (0/ausente = sem chocolate)
  note?: string; // observação visível no card (ex.: pelúcia pode variar)
  exclusiveExtras?: boolean; // cestas: balão e plaquinha são mutuamente exclusivos
  includesBalao?: boolean; // já vem com balão → não oferecer balão como adicional
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
  "Parabéns",
  "Com Carinho (rosa)",
  "Parabéns (rosa)",
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

export interface BuqueExtras {
  balao: BalaoOption | null; // null = not selected
  plaquinha: PlaquinhaOption | null;
  cartao: boolean; // cartão (grátis) — só adiciona ou remove
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

// ─── Category labels ──────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<Category, string> = {
  buques: "Buquês",
  "buques-cetim": "Buquês Cetim",
  cestas: "Cestas",
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
  },
  {
    id: 5,
    name: "Buquê 1 Girassol Luxo",
    description:
      "Buquê luxo com 1 girassol e baby breath, embrulho 'I Love You'.",
    price: 4990,
    category: "buques",
    image: "/images/buque-1-girassol-luxo.jpeg",
    inStock: false,
    maxChocolates: 3,
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
  },
  {
    id: 7,
    name: "Buquê Medelin",
    description:
      "Buquê com 3 rosas vermelhas importadas e 1 girassol, solidago, baby breath, embrulho preto e dourado.",
    inStock: false,
    price: 9990,
    category: "buques",
    image: "/images/buque-3-rosas-importadas-1-girassol.jpeg",
    video: "/vids/buque-medelin.mp4",
    lazyVideo: false,
    maxChocolates: 5,
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
    includesBalao: true,
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
    includesBalao: true,
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
    includesBalao: true,
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
    includesBalao: true,
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
    id: 20,
    name: "Box Com Carinho",
    description: "Contém: 1 balão coração, arranjo com 2 rosas, trufas 55g.",
    price: 7490,
    category: "cestas",
    image: "/images/box-com-carinho.jpeg",
    exclusiveExtras: true,
    includesBalao: true,
  },
];
