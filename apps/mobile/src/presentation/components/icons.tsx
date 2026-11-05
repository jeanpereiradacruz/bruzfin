import Svg, { Path, Rect } from 'react-native-svg';

/** Ícones de traço do design (viewBox 24×24). Decorativos: o rótulo acessível fica no botão. */
export type IconName = 'home' | 'accounts' | 'charts' | 'registry' | 'plus' | 'close';

type IconProps = {
  readonly name: IconName;
  readonly color: string;
  readonly size?: number;
  readonly strokeWidth?: number;
};

export function Icon({ name, color, size = 22, strokeWidth = 1.5 }: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  } as const;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={`icon-${name}`}
    >
      {name === 'home' && (
        <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" {...stroke} />
      )}
      {name === 'accounts' && (
        <>
          <Rect x={3} y={6} width={18} height={14} rx={2} {...stroke} />
          <Path d="M3 10h18M16 15h2" {...stroke} />
        </>
      )}
      {name === 'charts' && <Path d="M5 20V11M12 20V5M19 20v-6" {...stroke} />}
      {name === 'registry' && (
        <>
          <Rect x={4} y={4} width={7} height={7} rx={1.5} {...stroke} />
          <Rect x={13} y={4} width={7} height={7} rx={1.5} {...stroke} />
          <Rect x={4} y={13} width={7} height={7} rx={1.5} {...stroke} />
          <Rect x={13} y={13} width={7} height={7} rx={1.5} {...stroke} />
        </>
      )}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...stroke} />}
      {name === 'close' && <Path d="M6 6l12 12M18 6 6 18" {...stroke} />}
    </Svg>
  );
}
