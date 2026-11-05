import { describe, expect, it } from 'vitest';
import source from '../tokens/bruzfin.tokens.json' with { type: 'json' };
import { type ColorName, colors, type ThemeName, themeNames } from './colors';
import { radius, spacing } from './layout';
import { themes } from './themes';
import { fontStacks, type TextStyleName, textStyleNames, textStyles } from './typography';

const camel = (kebab: string): string =>
  kebab.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());

const px = (value: string): number => {
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
  if (!match?.[1]) throw new Error(`Valor em px inválido: ${value}`);
  return Number(match[1]);
};

const em = (value: string | undefined): number => {
  if (value === undefined) return 0;
  const match = /^(-?\d+(?:\.\d+)?)em$/.exec(value);
  if (!match?.[1]) throw new Error(`Valor em em inválido: ${value}`);
  return Number(match[1]);
};

describe('cores', () => {
  it('tem exatamente os temas do design', () => {
    expect(source.color.themes.map((theme) => theme.id)).toEqual([...themeNames]);
  });

  it('tem exatamente os tokens do design, com os mesmos valores', () => {
    for (const theme of themeNames) {
      const expected = Object.fromEntries(
        source.color.tokens.map((token) => [camel(token.name), token.value[theme]]),
      );
      expect(colors[theme]).toEqual(expected);
    }
  });
});

describe('tipografia', () => {
  const sourceStyles = source.type.groups.flatMap((group) =>
    group.styles.map((style) => ({ ...style, family: group.family })),
  );

  it('tem exatamente os estilos do design', () => {
    expect(sourceStyles.map((style) => camel(style.name))).toEqual([...textStyleNames]);
  });

  it.each(sourceStyles)('estilo $name tem os valores do design', (style) => {
    const token = textStyles[camel(style.name) as TextStyleName];
    const fontSize = px(style.fontSize);

    expect(token.family).toBe(style.family);
    expect(token.fontSize).toBe(fontSize);
    expect(token.lineHeight).toBe(px(style.lineHeight));
    expect(token.fontWeight).toBe(style.fontWeight);
    expect(token.letterSpacing).toBeCloseTo(
      em('letterSpacing' in style ? style.letterSpacing : undefined) * fontSize,
      5,
    );
  });

  it('usa números tabulares nos valores em destaque', () => {
    expect(textStyles.amount.tabularNums).toBe(true);
  });

  it('tem as mesmas pilhas de fonte do design', () => {
    expect(fontStacks).toEqual(source.type.families);
  });
});

describe('espaçamento e raios', () => {
  it('tem os espaçamentos do design', () => {
    const expected = Object.fromEntries(
      source.spacing.tokens.map((token) => [token.name.replace('space-', ''), px(token.value)]),
    );
    expect(spacing).toEqual(expected);
  });

  it('tem os raios do design', () => {
    const expected = Object.fromEntries(
      source.radius.tokens.map((token) => [token.name.replace('radius-', ''), px(token.value)]),
    );
    expect(radius).toEqual(expected);
  });
});

describe('temas', () => {
  it.each(themeNames)('tema %s usa as cores corretas', (name) => {
    expect(themes[name].name).toBe(name);
    expect(themes[name].colors).toBe(colors[name]);
  });
});

describe('contraste WCAG', () => {
  const luminance = (hex: string): number => {
    const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
    const [r = 0, g = 0, b = 0] = channels.map((channel) => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const contrast = (a: string, b: string): number => {
    const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
      number,
      number,
    ];
    return (lighter + 0.05) / (darker + 0.05);
  };

  /** Pares texto/fundo que o design usa e que precisam de 4,5:1 (texto normal). */
  const textPairs: ReadonlyArray<[ColorName, ColorName]> = [
    ['ink', 'surface100'],
    ['ink', 'surface000'],
    ['inkMuted', 'surface100'],
    ['inkMuted', 'surface000'],
    ['brand600', 'surface000'],
    ['onBrand', 'brand600'],
    ['onGold', 'gold500'],
    ['positive', 'surface000'],
    ['negative', 'surface000'],
    ['ink', 'brand100'],
  ];

  const cases = themeNames.flatMap((theme: ThemeName) =>
    textPairs.map(([fg, bg]) => ({ theme, fg, bg })),
  );

  it.each(cases)('$fg sobre $bg no tema $theme tem contraste ≥ 4,5:1', ({ theme, fg, bg }) => {
    expect(contrast(colors[theme][fg], colors[theme][bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(themeNames)('bordas de controle (inkMuted) têm contraste ≥ 3:1 no tema %s', (theme) => {
    expect(contrast(colors[theme].inkMuted, colors[theme].surface000)).toBeGreaterThanOrEqual(3);
  });
});
