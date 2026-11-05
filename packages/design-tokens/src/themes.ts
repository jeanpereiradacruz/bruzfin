import { type ColorTokens, colors, type ThemeName } from './colors';
import { minTouchTarget, radius, spacing } from './layout';
import { fontFamilies, textStyles } from './typography';

export type Theme = {
  readonly name: ThemeName;
  readonly colors: ColorTokens;
  readonly spacing: typeof spacing;
  readonly radius: typeof radius;
  readonly fontFamilies: typeof fontFamilies;
  readonly textStyles: typeof textStyles;
  readonly minTouchTarget: typeof minTouchTarget;
};

const createTheme = (name: ThemeName): Theme => ({
  name,
  colors: colors[name],
  spacing,
  radius,
  fontFamilies,
  textStyles,
  minTouchTarget,
});

export const themes = {
  light: createTheme('light'),
  dark: createTheme('dark'),
} as const satisfies Record<ThemeName, Theme>;
