import { readFileSync } from 'node:fs';
import { colors } from '@bruzfin/design-tokens';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('emails', () => {
  it('usam as cores do tema claro dos design tokens', () => {
    const template = read('./html/template.ftl').toLowerCase();
    for (const name of [
      'surface100',
      'surface000',
      'border',
      'ink',
      'inkMuted',
      'brand600',
    ] as const) {
      expect(template).toContain(colors.light[name]);
    }
  });

  it('têm textos em pt-BR para todas as chaves usadas nos templates', () => {
    const messages = read('./messages/messages_pt_BR.properties');
    const keys = new Set(
      messages
        .split('\n')
        .filter((line) => line.includes('=') && !line.startsWith('#'))
        .map((line) => line.slice(0, line.indexOf('='))),
    );
    for (const file of [
      './html/template.ftl',
      './html/email-verification.ftl',
      './html/password-reset.ftl',
      './text/email-verification.ftl',
      './text/password-reset.ftl',
    ]) {
      for (const [, key] of read(file).matchAll(/msg\("([^"]+)"/g)) {
        expect(keys, `${file}: ${key}`).toContain(key);
      }
    }
  });

  it('o link de recuperação avisa que vale uma vez só', () => {
    expect(read('./html/password-reset.ftl')).toContain('bruzfinEmailLinkExpiresOnce');
  });
});
