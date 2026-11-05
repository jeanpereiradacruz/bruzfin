import { type DomainError, domainError } from '../../shared/domain-error';
import { err, ok, type Result } from '../../shared/result';

export type Currency = 'BRL';

export type MoneyErrorCode =
  | 'money.invalid-format'
  | 'money.too-many-decimals'
  | 'money.out-of-range';
export type MoneyError = DomainError<MoneyErrorCode>;

/**
 * Como exibir o sinal:
 * - `negative`: só mostra "−" quando negativo (saldos). Padrão.
 * - `always`: "+" ou "−" (entradas e saídas nas listas).
 * - `never`: valor absoluto.
 */
export type SignDisplay = 'negative' | 'always' | 'never';

export type FormatOptions = {
  readonly sign?: SignDisplay;
  /** Mostra o símbolo "R$". Padrão: true. */
  readonly symbol?: boolean;
};

/** Sinal de menos tipográfico (U+2212), como no design. */
const MINUS = '−';

/**
 * Valor monetário imutável em centavos inteiros. Nunca usa ponto flutuante para guardar valores.
 */
export class Money {
  private constructor(
    readonly cents: number,
    readonly currency: Currency,
  ) {
    Object.freeze(this);
  }

  static zero(): Money {
    return new Money(0, 'BRL');
  }

  /** Cria a partir de centavos inteiros. Lança erro se não for inteiro seguro (bug de programação). */
  static fromCents(cents: number): Money {
    if (!Number.isSafeInteger(cents)) {
      throw new RangeError(`Centavos precisam ser um inteiro seguro: ${cents}`);
    }
    return new Money(cents === 0 ? 0 : cents, 'BRL');
  }

  /**
   * Lê o formato decimal da API (BigDecimal serializado), ex.: "1234.56", "-10", "0.5".
   * Converte por texto, sem passar por float.
   */
  static fromDecimalString(value: string): Result<Money, MoneyError> {
    const match = /^(-)?(\d+)(?:\.(\d+))?$/.exec(value.trim());
    if (!match) return err(invalidFormat());
    const [, minus, integer = '0', fraction = ''] = match;
    return fromParts(minus !== undefined, integer, fraction);
  }

  /**
   * Lê o que o usuário digita em pt-BR: "1.234,56", "R$ 214,37", "−62,90", "1500".
   * Aceita "R$", sinal (+, -, −), separador de milhar "." e decimal ",".
   */
  static parse(input: string): Result<Money, MoneyError> {
    const normalized = input.replace(/\s+/g, '').replace(/^([+\-−]?)R\$/i, '$1');
    const match = /^([+\-−])?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d*))?$/.exec(normalized);
    if (!match) return err(invalidFormat());
    const [, sign, integer = '0', fraction = ''] = match;
    return fromParts(sign === '-' || sign === MINUS, integer.replaceAll('.', ''), fraction);
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return Money.fromCents(this.cents - other.cents);
  }

  negate(): Money {
    return Money.fromCents(-this.cents);
  }

  abs(): Money {
    return Money.fromCents(Math.abs(this.cents));
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents && this.currency === other.currency;
  }

  /** Negativo se menor, zero se igual, positivo se maior (útil em `sort`). */
  compare(other: Money): number {
    return Math.sign(this.cents - other.cents);
  }

  greaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  lessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  /**
   * Indica se este valor atingiu `percent`% de `limit`, com aritmética inteira (sem arredondamento).
   * Ex.: alerta de 80% do limite mensal da categoria.
   */
  reachedPercentOf(limit: Money, percent: number): boolean {
    if (!Number.isInteger(percent) || percent < 0) {
      throw new RangeError(`Percentual precisa ser inteiro não negativo: ${percent}`);
    }
    if (limit.cents <= 0) return false;
    return this.cents * 100 >= limit.cents * percent;
  }

  /** Proporção em relação a outro valor (0 a 1+), apenas para exibição, ex.: barras de progresso. */
  ratioTo(total: Money): number {
    return total.cents === 0 ? 0 : this.cents / total.cents;
  }

  /** Formato decimal para a API: "1234.56", "-10.00". */
  toDecimalString(): string {
    const sign = this.cents < 0 ? '-' : '';
    const absolute = Math.abs(this.cents);
    const integer = Math.trunc(absolute / 100);
    const fraction = String(absolute % 100).padStart(2, '0');
    return `${sign}${integer}.${fraction}`;
  }

  /** Formato pt-BR do design: "R$ 1.234,56", "− R$ 214,37", "+ R$ 8.500,00". */
  format(options: FormatOptions = {}): string {
    const { sign = 'negative', symbol = true } = options;
    const absolute = Math.abs(this.cents);
    const integer = Math.trunc(absolute / 100)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const fraction = String(absolute % 100).padStart(2, '0');
    const amount = `${symbol ? 'R$ ' : ''}${integer},${fraction}`;

    const prefix = signPrefix(this.cents, sign);
    return prefix ? `${prefix} ${amount}` : amount;
  }

  toString(): string {
    return this.format();
  }

  toJSON(): string {
    return this.toDecimalString();
  }
}

const invalidFormat = (): MoneyError =>
  domainError('money.invalid-format', 'Valor inválido. Use o formato 1.234,56.');

const fromParts = (
  negative: boolean,
  integer: string,
  fraction: string,
): Result<Money, MoneyError> => {
  if (fraction.length > 2) {
    return err(domainError('money.too-many-decimals', 'Use no máximo 2 casas decimais.'));
  }
  const cents = Number(integer) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) {
    return err(domainError('money.out-of-range', 'Valor fora do limite permitido.'));
  }
  return ok(Money.fromCents(negative ? -cents : cents));
};

const signPrefix = (cents: number, display: SignDisplay): string => {
  if (display === 'never' || cents === 0) return '';
  if (cents < 0) return MINUS;
  return display === 'always' ? '+' : '';
};
