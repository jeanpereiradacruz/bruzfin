# @bruzfin/design-tokens

Tokens do design system BruzFin para o app (React Native) e, futuramente, o web (Next.js).

Fonte da verdade: `tokens/bruzfin.tokens.json`, exportado do Claude Design. Os testes garantem que os valores em TypeScript são idênticos a esse arquivo e que os pares de texto e fundo têm contraste WCAG mínimo de 4,5:1.

```ts
import { themes, textStyles, spacing, radius } from '@bruzfin/design-tokens';

themes.dark.colors.brand600; // '#3fbf8f'
textStyles.amount; // { family: 'display', fontSize: 32, lineHeight: 36, fontWeight: 700, ... }
spacing[4]; // 16
radius.md; // 10
```

Para atualizar: substitua o `tokens.json` pelo novo export do design, rode `pnpm test` e ajuste o TypeScript até os testes passarem.
