import { describe, expect, it } from 'vitest';
import { Money } from './money';

const brl = (cents: number) => Money.fromCents(cents);

const parsed = (input: string): Money => {
  const result = Money.parse(input);
  if (!result.ok) throw new Error(`Esperava sucesso para "${input}": ${result.error.code}`);
  return result.value;
};

describe('Money', () => {
  describe('criação', () => {
    it('cria a partir de centavos inteiros', () => {
      expect(brl(123456).cents).toBe(123456);
      expect(brl(123456).currency).toBe('BRL');
    });

    it('normaliza -0 para 0', () => {
      expect(Object.is(brl(-0).cents, 0)).toBe(true);
    });

    it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
      'rejeita centavos não inteiros ou inseguros: %s',
      (value) => {
        expect(() => brl(value)).toThrow(RangeError);
      },
    );

    it('é imutável', () => {
      const money = brl(100);
      expect(Object.isFrozen(money)).toBe(true);
    });
  });

  describe('aritmética sem ponto flutuante', () => {
    it('soma e subtrai', () => {
      expect(brl(123456).add(brl(44)).cents).toBe(123500);
      expect(brl(1000).subtract(brl(2500)).cents).toBe(-1500);
    });

    it('não sofre o erro clássico 0,1 + 0,2', () => {
      expect(brl(10).add(brl(20)).equals(brl(30))).toBe(true);
    });

    it('soma o mês do design: entradas − saídas = saldo', () => {
      const entradas = parsed('8.500,00');
      const saidas = ['214,37', '62,90', '180,00', '1.800,00', '54,10', '45,90', '59,00'].reduce(
        (total, value) => total.add(parsed(value)),
        Money.zero(),
      );
      expect(saidas.format()).toBe('R$ 2.416,27');
      expect(entradas.subtract(saidas).format()).toBe('R$ 6.083,73');
    });

    it('nega e calcula valor absoluto', () => {
      expect(brl(500).negate().cents).toBe(-500);
      expect(brl(-500).abs().cents).toBe(500);
    });

    it('compara valores', () => {
      expect(brl(1).compare(brl(2))).toBe(-1);
      expect(brl(2).compare(brl(2))).toBe(0);
      expect(brl(3).compare(brl(2))).toBe(1);
      expect(brl(3).greaterThan(brl(2))).toBe(true);
      expect(brl(1).lessThan(brl(2))).toBe(true);
      expect([brl(3), brl(1), brl(2)].sort((a, b) => a.compare(b)).map((m) => m.cents)).toEqual([
        1, 2, 3,
      ]);
    });

    it('indica sinal e zero', () => {
      expect(Money.zero().isZero()).toBe(true);
      expect(brl(1).isPositive()).toBe(true);
      expect(brl(-1).isNegative()).toBe(true);
    });
  });

  describe('alerta de limite (reachedPercentOf)', () => {
    const limite = parsed('1.200,00');

    it('não alerta abaixo de 80%', () => {
      expect(parsed('959,99').reachedPercentOf(limite, 80)).toBe(false);
    });

    it('alerta exatamente em 80%', () => {
      expect(parsed('960,00').reachedPercentOf(limite, 80)).toBe(true);
    });

    it('alerta acima do limite', () => {
      expect(parsed('1.500,00').reachedPercentOf(limite, 80)).toBe(true);
    });

    it('nunca alerta sem limite definido', () => {
      expect(parsed('10,00').reachedPercentOf(Money.zero(), 80)).toBe(false);
    });

    it('rejeita percentual inválido', () => {
      expect(() => brl(1).reachedPercentOf(limite, 80.5)).toThrow(RangeError);
      expect(() => brl(1).reachedPercentOf(limite, -1)).toThrow(RangeError);
    });
  });

  describe('ratioTo', () => {
    it('calcula a proporção para barras de progresso', () => {
      expect(parsed('314,37').ratioTo(parsed('1.800,00'))).toBeCloseTo(0.1746, 4);
    });

    it('retorna 0 quando o total é zero', () => {
      expect(brl(100).ratioTo(Money.zero())).toBe(0);
    });
  });

  describe('format (pt-BR, como no design)', () => {
    it.each([
      [123456, 'R$ 1.234,56'],
      [0, 'R$ 0,00'],
      [5, 'R$ 0,05'],
      [100, 'R$ 1,00'],
      [850000, 'R$ 8.500,00'],
      [1248090, 'R$ 12.480,90'],
      [123456789012, 'R$ 1.234.567.890,12'],
    ])('%i centavos → %s', (cents, expected) => {
      expect(brl(cents).format()).toBe(expected);
    });

    it('mostra − só quando negativo por padrão (saldos)', () => {
      expect(brl(-21437).format()).toBe('− R$ 214,37');
      expect(brl(21437).format()).toBe('R$ 214,37');
    });

    it('mostra + e − nas listas de lançamentos', () => {
      expect(brl(850000).format({ sign: 'always' })).toBe('+ R$ 8.500,00');
      expect(brl(-21437).format({ sign: 'always' })).toBe('− R$ 214,37');
      expect(Money.zero().format({ sign: 'always' })).toBe('R$ 0,00');
    });

    it('omite o sinal quando pedido', () => {
      expect(brl(-21437).format({ sign: 'never' })).toBe('R$ 214,37');
    });

    it('omite o símbolo quando pedido (campos de valor)', () => {
      expect(brl(21437).format({ symbol: false })).toBe('214,37');
    });

    it('toString usa o formato padrão', () => {
      expect(`${brl(123456)}`).toBe('R$ 1.234,56');
    });
  });

  describe('parse (entrada do usuário)', () => {
    it.each([
      ['1.234,56', 123456],
      ['1234,56', 123456],
      ['R$ 214,37', 21437],
      ['R$214,37', 21437],
      ['  62,9 ', 6290],
      ['1500', 150000],
      ['1.500', 150000],
      ['12,', 1200],
      ['0,05', 5],
      ['-10,00', -1000],
      ['− R$ 62,90', -6290],
      ['+ R$ 8.500,00', 850000],
      ['R$ -5', -500],
      ['1.234.567,89', 123456789],
    ])('"%s" → %i centavos', (input, cents) => {
      expect(parsed(input).cents).toBe(cents);
    });

    it.each(['', 'R$', 'abc', '1,2,3', '1.23,00', '12.5', ',50', '1 234,56x', '--5', '1.2345,00'])(
      'rejeita "%s" como formato inválido',
      (input) => {
        const result = Money.parse(input);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('money.invalid-format');
      },
    );

    it('rejeita mais de 2 casas decimais', () => {
      const result = Money.parse('10,999');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe('money.too-many-decimals');
        expect(result.error.message).toBe('Use no máximo 2 casas decimais.');
      }
    });

    it('rejeita valores acima do inteiro seguro', () => {
      const result = Money.parse('999999999999999999,00');
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe('money.out-of-range');
    });

    it('ida e volta: format → parse preserva o valor', () => {
      for (const cents of [0, 5, 123456, -21437, 850000]) {
        expect(parsed(brl(cents).format()).cents).toBe(cents);
      }
    });
  });

  describe('formato decimal da API', () => {
    it.each([
      ['1234.56', 123456],
      ['-10', -1000],
      ['0.5', 50],
      ['0.05', 5],
      ['8500.00', 850000],
    ])('fromDecimalString("%s") → %i centavos', (input, cents) => {
      const result = Money.fromDecimalString(input);
      expect(result.ok && result.value.cents).toBe(cents);
    });

    it.each(['1,50', '1.2.3', '', 'R$ 10', '1e3'])('rejeita "%s"', (input) => {
      expect(Money.fromDecimalString(input).ok).toBe(false);
    });

    it('rejeita mais de 2 casas decimais', () => {
      const result = Money.fromDecimalString('1.005');
      expect(!result.ok && result.error.code).toBe('money.too-many-decimals');
    });

    it.each([
      [123456, '1234.56'],
      [-1000, '-10.00'],
      [5, '0.05'],
      [0, '0.00'],
    ])('toDecimalString de %i centavos → "%s"', (cents, expected) => {
      expect(brl(cents).toDecimalString()).toBe(expected);
    });

    it('serializa em JSON como decimal', () => {
      expect(JSON.stringify({ amount: brl(123456) })).toBe('{"amount":"1234.56"}');
    });
  });
});
