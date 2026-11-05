import { describe, expect, it } from 'vitest';
import { err, flatMap, isErr, isOk, map, ok, type Result, unwrapOr } from './result';

const half = (n: number): Result<number, string> => (n % 2 === 0 ? ok(n / 2) : err('ímpar'));

describe('Result', () => {
  it('identifica sucesso e erro', () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isErr(err('x'))).toBe(true);
  });

  it('map transforma só o sucesso', () => {
    expect(map(ok(2), (n) => n * 10)).toEqual(ok(20));
    expect(map(err('falhou'), (n: number) => n * 10)).toEqual(err('falhou'));
  });

  it('flatMap encadeia operações que podem falhar', () => {
    expect(flatMap(ok(8), half)).toEqual(ok(4));
    expect(flatMap(ok(3), half)).toEqual(err('ímpar'));
    expect(flatMap(err('antes'), half)).toEqual(err('antes'));
  });

  it('unwrapOr devolve o padrão em caso de erro', () => {
    expect(unwrapOr(ok(1), 0)).toBe(1);
    expect(unwrapOr(err('x'), 0)).toBe(0);
  });
});
