import { describe, it, expect } from 'vitest';
import {
  validateContact, isBot, buildMail, escapeHtml, normalizeAppPassword, createRateLimiter, LIMITS,
} from '../../src/lib/contactMail';

describe('validateContact', () => {
  it('mantém as quebras de linha da mensagem', () => {
    const r = validateContact({ name: 'Ana', email: 'ana@example.com', message: 'Oi\r\nTudo bem?\n\nAbraço' });
    expect(r.ok).toBe(true);
    expect(r.data.message).toBe('Oi\nTudo bem?\n\nAbraço');
  });

  it('nome e e-mail viram uma linha só (sem header injection)', () => {
    const r = validateContact({ name: 'Ana\r\nBcc: x@y.com', email: 'ana@example.com', message: 'oi' });
    expect(r.data.name).toBe('Ana Bcc: x@y.com');
    expect(r.data.name).not.toMatch(/[\r\n]/);
  });

  it('recusa campos vazios, e-mail inválido e textos longos demais', () => {
    expect(validateContact({ name: ' ', email: 'a@b.co', message: 'x' }).error).toBe('missing');
    expect(validateContact({ name: 'A', email: 'nao-e-email', message: 'x' }).error).toBe('email');
    expect(validateContact({ name: 'A', email: 'a@b.co', message: 'x'.repeat(LIMITS.message + 1) }).error).toBe('too_long');
    expect(validateContact(null).error).toBe('missing');
  });

  it('aceita mensagens de até 5000 caracteres (antes cortava em 1000)', () => {
    expect(validateContact({ name: 'A', email: 'a@b.co', message: 'x'.repeat(4000) }).ok).toBe(true);
  });
});

describe('buildMail', () => {
  const data = { name: '<b>Ana</b> "D\'Ávila"', email: 'ana@example.com', message: '<script>alert(1)</script>\nlinha 2' };
  const mail = buildMail(data, 'eu@gmail.com');

  it('escapa o HTML de quem escreveu e preserva as linhas', () => {
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.html).toContain('<br>linha 2');
    expect(mail.html).not.toContain('<b>Ana</b>');
  });

  it('envia do próprio endereço e responde para quem escreveu', () => {
    expect(mail.from.address).toBe('eu@gmail.com');
    expect(mail.to).toBe('eu@gmail.com');
    expect(mail.replyTo).toEqual({ name: data.name, address: 'ana@example.com' });
    expect(mail.text).toContain('linha 2');
  });
});

describe('utilitários', () => {
  it('escapeHtml cobre os cinco caracteres', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('isBot detecta o campo isca preenchido', () => {
    expect(isBot({ company: 'ACME' })).toBe(true);
    expect(isBot({ company: '' })).toBe(false);
    expect(isBot({})).toBe(false);
  });

  it('normalizeAppPassword tira os espaços da senha de app', () => {
    expect(normalizeAppPassword('abcd efgh ijkl mnop')).toBe('abcdefghijklmnop');
    expect(normalizeAppPassword(undefined)).toBe('');
  });

  it('o limitador bloqueia depois do máximo e libera após a janela', () => {
    const allow = createRateLimiter({ max: 2, windowMs: 1000 });
    expect(allow('ip', 0)).toBe(true);
    expect(allow('ip', 10)).toBe(true);
    expect(allow('ip', 20)).toBe(false);
    expect(allow('outro', 20)).toBe(true);
    expect(allow('ip', 1500)).toBe(true);
  });
});
