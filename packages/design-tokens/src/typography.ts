/**
 * Tipografia do design system BruzFin.
 * Valores em px sem unidade, prontos para React Native; o web converte para CSS.
 * `letterSpacing` já vem em px (o design define em em: -0.02em × 40px = -0.8px).
 */

export type FontFamilyName = 'display' | 'sans';
export type FontWeight = 400 | 500 | 600 | 700;

export const fontFamilies = {
  /** Títulos, valores e números em destaque. */
  display: 'Manrope',
  /** Texto corrido, rótulos e botões. */
  sans: 'Inter',
} as const satisfies Record<FontFamilyName, string>;

/** Pilhas de fonte para CSS (web), iguais às do design. */
export const fontStacks = {
  display: '"Manrope", system-ui, sans-serif',
  sans: '"Inter", system-ui, sans-serif',
} as const satisfies Record<FontFamilyName, string>;

/** Pesos que o app precisa carregar de cada família. */
export const fontWeightsInUse = {
  display: [600, 700],
  sans: [400, 500, 600],
} as const satisfies Record<FontFamilyName, readonly FontWeight[]>;

export type TextStyleToken = {
  readonly family: FontFamilyName;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: FontWeight;
  readonly letterSpacing: number;
  /** Alinha dígitos em colunas (font-variant-numeric: tabular-nums). */
  readonly tabularNums: boolean;
};

export const textStyleNames = [
  'display',
  'heading1',
  'heading2',
  'amount',
  'body',
  'bodyStrong',
  'caption',
] as const;
export type TextStyleName = (typeof textStyleNames)[number];

export const textStyles = {
  /** Abertura de telas de onboarding. Um por tela. */
  display: {
    family: 'display',
    fontSize: 40,
    lineHeight: 44,
    fontWeight: 700,
    letterSpacing: -0.8,
    tabularNums: false,
  },
  /** Título da página no app. */
  heading1: {
    family: 'display',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
    letterSpacing: -0.28,
    tabularNums: false,
  },
  /** Título de cartão e de seção. */
  heading2: {
    family: 'display',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 600,
    letterSpacing: 0,
    tabularNums: false,
  },
  /** Saldo e totais em destaque. */
  amount: {
    family: 'display',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: 700,
    letterSpacing: -0.32,
    tabularNums: true,
  },
  /** Texto corrido, descrições e itens de lista. */
  body: {
    family: 'sans',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 400,
    letterSpacing: 0,
    tabularNums: false,
  },
  /** Nome da transação, rótulo de botão, ênfase. */
  bodyStrong: {
    family: 'sans',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 600,
    letterSpacing: 0,
    tabularNums: false,
  },
  /** Datas, metadados e legendas, em `inkMuted`. */
  caption: {
    family: 'sans',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 400,
    letterSpacing: 0,
    tabularNums: false,
  },
} as const satisfies Record<TextStyleName, TextStyleToken>;
