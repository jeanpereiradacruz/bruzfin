/**
 * Cores do design system BruzFin.
 * Fonte da verdade: `tokens/bruzfin.tokens.json` (exportado do Claude Design).
 * Os nomes seguem o design em camelCase: `surface-100` → `surface100`.
 */

export const themeNames = ['light', 'dark'] as const;
export type ThemeName = (typeof themeNames)[number];

export type ColorTokens = {
  /** Fundo da página. */
  readonly surface100: string;
  /** Cartões, painéis, modais e campos sobre surface100. */
  readonly surface000: string;
  /** Divisores e contornos decorativos. Em bordas de controle use `inkMuted`. */
  readonly border: string;
  /** Texto principal e valores monetários. */
  readonly ink: string;
  /** Texto secundário, rótulos, datas e borda de inputs. */
  readonly inkMuted: string;
  /** Verde BruzFin: ação primária, links e foco. */
  readonly brand600: string;
  /** Texto e ícones sobre `brand600`. */
  readonly onBrand: string;
  /** Fundo de item selecionado, destaques suaves e badges. */
  readonly brand100: string;
  /** Dourado de acento: metas e destaques. Só superfícies e ícones grandes. */
  readonly gold500: string;
  /** Texto e ícones sobre `gold500`. */
  readonly onGold: string;
  /** Entradas e variação positiva. Sempre com sinal + ou seta ▲. */
  readonly positive: string;
  /** Saídas, erros e alertas. Sempre com sinal − ou seta ▼. */
  readonly negative: string;
};

export type ColorName = keyof ColorTokens;

export const colors = {
  light: {
    surface100: '#f7f8f6',
    surface000: '#ffffff',
    border: '#dfe4e0',
    ink: '#14201b',
    inkMuted: '#55625c',
    brand600: '#0f7a5a',
    onBrand: '#ffffff',
    brand100: '#e3f2ec',
    gold500: '#c98a1b',
    onGold: '#14201b',
    positive: '#157347',
    negative: '#b42318',
  },
  dark: {
    surface100: '#0f1513',
    surface000: '#171f1c',
    border: '#2a3531',
    ink: '#eef2ef',
    inkMuted: '#9aa8a1',
    brand600: '#3fbf8f',
    onBrand: '#0f1513',
    brand100: '#173a2e',
    gold500: '#e0a43a',
    onGold: '#0f1513',
    positive: '#4cc38a',
    negative: '#f2735f',
  },
} as const satisfies Record<ThemeName, ColorTokens>;
