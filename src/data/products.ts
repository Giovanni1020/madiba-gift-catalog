// ─── Types ───────────────────────────────────────────────────────────────────

export type Category = "buques" | "cestas";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;           // em centavos BRL, ex: 7990 = R$79,90
  category: Category;
  image: string;           // caminho relativo a /public, ex: "/images/produto.jpg"
  featured?: boolean;
  inStock?: boolean;
  maxChocolates?: number;  // apenas para buquês
}

// ─── Extras ──────────────────────────────────────────────────────────────────

export type ChocolateOption = "ferrero" | "sonho_de_valsa" | "rafaello" | "ouro_branco";

export interface ChocolateExtra {
  id: ChocolateOption;
  name: string;
  price: number;
}

export const CHOCOLATE_OPTIONS: ChocolateExtra[] = [
  { id: "ferrero",        name: "Ferrero Rocher", price: 700 },
  { id: "sonho_de_valsa", name: "Sonho de Valsa", price: 300 },
  { id: "rafaello",       name: "Rafaello",        price: 400 },
  { id: "ouro_branco",    name: "Ouro Branco",     price: 300 },
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
export type BalaoOption = typeof BALAO_OPTIONS[number];

// Plaquinha options grouped by reference image page (top-left to bottom-right)
export const PLAQUINHA_OPTIONS_BY_PAGE = [
  // Page 1
  ["Amor", "Parabéns pelo seu Dia", "Te Amo", "Vó te Amo", "Parabéns pela Formatura", "Sucesso"],
  // Page 2
  ["Gratidão", "Com Amor", "Parabéns", "Quer Casar Comigo?", "Quer Namorar Comigo?", "Você é Especial"],
  // Page 3
  ["Com Carinho", "Sucesso", "Te Amo Mãe", "Mãe Você é Especial", "Mãe Te Amo", "Te Amo"],
] as const;

export const PLAQUINHA_OPTIONS = PLAQUINHA_OPTIONS_BY_PAGE.flat();
export type PlaquinhaOption = typeof PLAQUINHA_OPTIONS[number];

export interface BuqueExtras {
  balao: BalaoOption | null;       // null = not selected
  plaquinha: PlaquinhaOption | null;
  chocolates: Partial<Record<ChocolateOption, number>>;
}

export const EXTRAS_PRICES = {
  balao:     1000,
  plaquinha:  990,
} as const;

export function extrasTotal(extras: BuqueExtras): number {
  const chocTotal = CHOCOLATE_OPTIONS.reduce(
    (sum, c) => sum + (extras.chocolates[c.id] ?? 0) * c.price,
    0
  );
  return (extras.balao ? EXTRAS_PRICES.balao : 0)
       + (extras.plaquinha ? EXTRAS_PRICES.plaquinha : 0)
       + chocTotal;
}

// ─── Category labels ──────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<Category, string> = {
  buques: "Buquês",
  cestas: "Cestas",
};

// ─── Products ────────────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [

  // ── Cestas ───────────────────────────────────────────────────────────────
  {
    id: 1,
    name: "Box for Man",
    description: "Contém: 1 cerveja imigração, 1 cerveja Corona, Ferrero Rocher c3, 1 Pringles, baldinho de metal.",
    price: 7990,
    category: "cestas",
    image: "/images/box-for-man.jpeg",
  },
  {
    id: 2,
    name: "Box for Lovers",
    description: "Contém: 1 vinho chileno, castanha, torradinha, 2 KitKat, Nutella, Ferrero Rocher c4, pelúcia, caixa MDF.",
    price: 18990,
    category: "cestas",
    image: "/images/box-for-lovers.jpeg",
    featured: true,
  },

  // ── Buquês ───────────────────────────────────────────────────────────────
  {
    id: 3,
    name: "Buquê 3 Rosas Cor de Rosa",
    description: "Buquê com 3 rosas cor de rosa, baby breath e folhagem, embrulho temático com laço.",
    price: 5990,
    category: "buques",
    image: "/images/buque-3-rosas-cor-de-rosa.jpeg",
    maxChocolates: 3,
  },
  {
    id: 4,
    name: "Buquê 5 Rosas Importadas",
    description: "Buquê com 5 rosas vermelhas importadas e folhagem verde, embrulho vermelho elegante.",
    price: 12490,
    category: "buques",
    image: "/images/buque-5-rosas-importadas.jpeg",
    featured: true,
    maxChocolates: 5,
  },
  {
    id: 5,
    name: "Buquê 1 Girassol Luxo",
    description: "Buquê luxo com 1 girassol e baby breath, embrulho 'I Love You'.",
    price: 4990,
    category: "buques",
    image: "/images/buque-1-girassol-luxo.jpeg",
    maxChocolates: 3,
  },
  {
    id: 6,
    name: "Buquê 3 Rosas Vermelhas Importadas",
    description: "Buquê com 3 rosas vermelhas importadas, baby breath e folhagem, embrulho vermelho.",
    price: 7490,
    category: "buques",
    image: "/images/buque-3-rosas-vermelhas-importadas.jpeg",
    maxChocolates: 3,
  },
  {
    id: 7,
    name: "Buquê 3 Rosas Importadas + 1 Girassol",
    description: "Buquê com 3 rosas vermelhas importadas e 1 girassol, solidago, baby breath, embrulho preto e dourado.",
    price: 9990,
    category: "buques",
    image: "/images/buque-3-rosas-importadas-1-girassol.jpeg",
    maxChocolates: 5,
  },

  // ── Buquês de rosa de cetim com chocolates inclusos ────────────────────────
  // Sem `maxChocolates`: chocolate já vem no buquê, então só aceitam balão/plaquinha.
  {
    id: 8,
    name: "Buquê 1 Rosa de Cetim + 6 Sonho de Valsa",
    description: "Buquê com 1 rosa de cetim e 6 bombons Sonho de Valsa, embrulho temático com laço.",
    price: 3990,
    category: "buques",
    image: "/images/buque-cetim-6-sonho-de-valsa.jpeg",
  },
  {
    id: 9,
    name: "Buquê 1 Rosa de Cetim + 3 Ouro Branco e 3 Sonho de Valsa",
    description: "Buquê com 1 rosa de cetim, 3 Ouro Branco e 3 Sonho de Valsa, embrulho temático com laço.",
    price: 3990,
    category: "buques",
    image: "/images/buque-cetim-3-ouro-branco-3-sonho-de-valsa.jpeg",
  },
  {
    id: 10,
    name: "Buquê 1 Rosa de Cetim + 6 Ouro Branco",
    description: "Buquê com 1 rosa de cetim e 6 bombons Ouro Branco, embrulho temático com laço.",
    price: 3990,
    category: "buques",
    image: "/images/buque-cetim-6-ouro-branco.jpeg",
  },
  {
    id: 11,
    name: "Buquê 1 Rosa de Cetim + 7 Ferrero Rocher",
    description: "Buquê com 1 rosa de cetim e 7 Ferrero Rocher, embrulho vermelho com laço.",
    price: 5990,
    category: "buques",
    image: "/images/buque-cetim-7-ferrero-rocher.jpeg",
  },
  {
    id: 12,
    name: "Buquê 1 Rosa de Cetim + 7 Rafaello",
    description: "Buquê com 1 rosa de cetim e 7 Rafaello, embrulho com laço.",
    price: 4990,
    category: "buques",
    image: "/images/buque-cetim-7-rafaello.jpeg",
  },
];
