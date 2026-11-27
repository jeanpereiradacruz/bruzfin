import { type ColorTokens, colors, fontStacks, radius } from '@bruzfin/design-tokens';

const kebab = (name: string) => name.replace(/[A-Z0-9]+/g, (part) => `-${part.toLowerCase()}`);

const vars = (palette: ColorTokens) =>
  Object.entries(palette)
    .map(([name, value]) => `--${kebab(name)}: ${value};`)
    .join(' ');

/**
 * Variáveis CSS vindas de @bruzfin/design-tokens: claro por padrão e escuro quando o sistema pedir.
 * `--surface100` vira `--surface-100`, como no design.
 */
export const themeCss = [
  `:root { color-scheme: light dark; ${vars(colors.light)}`,
  `--font-display: ${fontStacks.display}; --font-sans: ${fontStacks.sans};`,
  `--radius-sm: ${radius.sm}px; --radius-md: ${radius.md}px; --radius-lg: ${radius.lg}px; }`,
  `@media (prefers-color-scheme: dark) { :root { ${vars(colors.dark)} } }`,
].join(' ');
