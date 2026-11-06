import Svg, { Rect } from 'react-native-svg';
import { useUnistyles } from 'react-native-unistyles';

type BrandLogoProps = {
  readonly size?: number;
};

/** Marca do BruzFin: quadrado brand-600 com três barras crescentes em brand-100 (design App-Login). */
export function BrandLogo({ size = 56 }: BrandLogoProps) {
  const { theme } = useUnistyles();
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      accessibilityRole="image"
      accessibilityLabel="BruzFin"
    >
      <Rect width={56} height={56} rx={16} fill={theme.colors.brand600} />
      <Rect x={14} y={30} width={8} height={14} rx={4} fill={theme.colors.brand100} />
      <Rect x={24} y={22} width={8} height={22} rx={4} fill={theme.colors.brand100} />
      <Rect x={34} y={12} width={8} height={32} rx={4} fill={theme.colors.brand100} />
    </Svg>
  );
}
