/** Espaçamentos do design system (px). A chave segue o nome do token: `space-4` → `spacing[4]`. */
export const spacing = {
  /** Entre ícone e rótulo; entre valor e sinal. */
  1: 4,
  /** Entre itens relacionados; padding vertical de badges. */
  2: 8,
  /** Padding de cartões no celular, gutter lateral e gap entre cartões. */
  4: 16,
  /** Padding de cartões no desktop; espaço entre seções. */
  6: 24,
} as const;
export type SpacingToken = keyof typeof spacing;

/** Raios de borda (px). */
export const radius = {
  /** Badges, chips e checkboxes. */
  sm: 6,
  /** Botões e campos de formulário. */
  md: 10,
  /** Cartões, painéis e modais. */
  lg: 16,
} as const;
export type RadiusToken = keyof typeof radius;

/** Área mínima de toque (px), conforme as regras de acessibilidade do design. */
export const minTouchTarget = 44;
