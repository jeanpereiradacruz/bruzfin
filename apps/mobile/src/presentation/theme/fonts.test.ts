import { fontWeightsInUse, textStyleNames, textStyles } from '@bruzfin/design-tokens';
import { fontAssets, fontFamilyFor } from './fonts';

describe('fontes', () => {
  it('carrega um arquivo para cada família e peso usados pelo design', () => {
    for (const [family, weights] of Object.entries(fontWeightsInUse)) {
      for (const weight of weights) {
        const file = fontFamilyFor(family as 'display' | 'sans', weight);
        expect(Object.keys(fontAssets)).toContain(file);
      }
    }
  });

  it.each(textStyleNames)('estilo %s usa uma fonte carregada', (name) => {
    const token = textStyles[name];
    expect(Object.keys(fontAssets)).toContain(fontFamilyFor(token.family, token.fontWeight));
  });

  it('mapeia família e peso para o arquivo certo', () => {
    expect(fontFamilyFor('display', 700)).toBe('Manrope_700Bold');
    expect(fontFamilyFor('sans', 400)).toBe('Inter_400Regular');
  });

  it('usa o peso disponível mais próximo quando o pedido não existe', () => {
    expect(fontFamilyFor('display', 400)).toBe('Manrope_600SemiBold');
    expect(fontFamilyFor('sans', 700)).toBe('Inter_600SemiBold');
  });
});
