import type { FontFamilyName, FontWeight, fontWeightsInUse } from '@bruzfin/design-tokens';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';

/**
 * No Android cada peso é um arquivo de fonte separado e `fontWeight` não troca o arquivo.
 * Por isso mapeamos família + peso do design para o nome da fonte carregada.
 */
type WeightsOf<F extends FontFamilyName> = (typeof fontWeightsInUse)[F][number];

export const fontFiles = {
  display: { 600: 'Manrope_600SemiBold', 700: 'Manrope_700Bold' },
  sans: { 400: 'Inter_400Regular', 500: 'Inter_500Medium', 600: 'Inter_600SemiBold' },
} as const satisfies { [F in FontFamilyName]: Record<WeightsOf<F>, string> };

/** Fontes passadas ao `useFonts` na inicialização do app. */
export const fontAssets = {
  Manrope_600SemiBold,
  Manrope_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} as const;

/** Nome da fonte carregada para a família e o peso pedidos (usa o peso disponível mais próximo). */
export const fontFamilyFor = (family: FontFamilyName, weight: FontWeight): string => {
  const files: Partial<Record<FontWeight, string>> = fontFiles[family];
  const exact = files[weight];
  if (exact) return exact;
  const available = (Object.keys(files) as unknown as FontWeight[])
    .map(Number)
    .sort((a, b) => Math.abs(a - weight) - Math.abs(b - weight));
  const nearest = available[0] as FontWeight | undefined;
  return (nearest && files[nearest]) || fontFiles.sans[400];
};
