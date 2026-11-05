# @bruzfin/core

Domínio e casos de uso do BruzFin em **TypeScript puro**, compartilhados entre o app (React Native) e o web (Next.js).

## Camadas

```
src/
  shared/        # Result, DomainError — utilitários sem regra de negócio
  domain/        # entidades e value objects (ex.: Money). Sem I/O, sem framework
  application/   # casos de uso e portas (interfaces que o app/web implementam)
```

Regras:
- `domain` não conhece `application`; nenhuma camada conhece React, React Native, Expo, Next.js, TanStack ou Zustand. O Biome bloqueia esses imports aqui (`noRestrictedImports`).
- Erros esperados são valores (`Result`), não exceções. Exceções só para bugs de programação.
- Precisa de algo externo (HTTP, armazenamento seguro, notificações)? Declare uma **porta** em `application/` e implemente o **adapter** no app.

## Money

Valor monetário imutável em **centavos inteiros** — nunca ponto flutuante.

```ts
import { Money } from '@bruzfin/core';

const result = Money.parse('R$ 1.234,56'); // entrada do usuário
if (result.ok) result.value.format(); // 'R$ 1.234,56'

Money.fromCents(-21437).format({ sign: 'always' }); // '− R$ 214,37'
Money.fromDecimalString('8500.00'); // valor vindo da API
gasto.reachedPercentOf(limite, 80); // alerta de 80% do limite
```
