import { describe, expect, it } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from '../../../src/domain/credentials/credentials.js';

describe('normalizeEmail', () => {
  it('quita espacios y pasa a minúsculas', () => {
    expect(normalizeEmail('  Demo@KynWallet.test ')).toBe('demo@kynwallet.test');
  });
});

describe('isValidEmail', () => {
  it.each(['titular@ejemplo.com', 'a.b+c@dominio.mx'])('acepta %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each(['sin-arroba', 'con espacio@ejemplo.com', 'a@b.c', 'a@@ejemplo.com'])(
    'rechaza %s',
    (email) => {
      expect(isValidEmail(email)).toBe(false);
    },
  );

  it('rechaza correos de más de 254 caracteres', () => {
    const local = 'a'.repeat(64);
    const domain = `${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.com`;
    expect(isValidEmail(`${local}@${domain}`)).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('rechaza contraseñas de 14 caracteres', () => {
    expect(isValidPassword('a'.repeat(14))).toBe(false);
  });

  it('acepta 15 y 128 caracteres', () => {
    expect(isValidPassword('a'.repeat(15))).toBe(true);
    expect(isValidPassword('a'.repeat(128))).toBe(true);
  });

  it('rechaza más de 128 caracteres', () => {
    expect(isValidPassword('a'.repeat(129))).toBe(false);
  });
});
