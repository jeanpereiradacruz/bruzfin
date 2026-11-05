import { type TextStyleName, themes } from '@bruzfin/design-tokens';
import { fontFamilyFor } from './fonts';

/** Estilo de texto do design pronto para React Native (só as propriedades que o design define). */
export type AppTextStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  fontVariant?: 'tabular-nums'[];
};

const toTextStyle = (name: TextStyleName): AppTextStyle => {
  const token = themes.light.textStyles[name];
  return {
    fontFamily: fontFamilyFor(token.family, token.fontWeight),
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    letterSpacing: token.letterSpacing,
    ...(token.tabularNums ? { fontVariant: ['tabular-nums'] } : {}),
  };
};

const typography = {
  display: toTextStyle('display'),
  heading1: toTextStyle('heading1'),
  heading2: toTextStyle('heading2'),
  amount: toTextStyle('amount'),
  body: toTextStyle('body'),
  bodyStrong: toTextStyle('bodyStrong'),
  caption: toTextStyle('caption'),
} as const satisfies Record<TextStyleName, AppTextStyle>;

const buildAppTheme = (base: (typeof themes)[keyof typeof themes]) => ({
  ...base,
  typography,
  /** Fonte para um peso específico fora dos estilos prontos (ex.: rótulos da tab bar). */
  font: fontFamilyFor,
});

export const appThemes = {
  light: buildAppTheme(themes.light),
  dark: buildAppTheme(themes.dark),
};

export type AppTheme = (typeof appThemes)['light'];
export type AppThemes = typeof appThemes;
