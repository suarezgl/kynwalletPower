import { describe, expect, it } from 'vitest';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  normalizeEmail,
  validateEmail,
  validatePassword,
} from './login-validation';

describe('normalizeEmail', () => {
  it('quita espacios periféricos y pasa a minúsculas', () => {
    expect(normalizeEmail('  Demo@KynWallet.test ')).toBe('demo@kynwallet.test');
  });
});

describe('validateEmail', () => {
  it('exige un valor no vacío, ignorando espacios', () => {
    expect(validateEmail('')).toBe('required');
    expect(validateEmail('   ')).toBe('required');
  });

  it('rechaza formatos sin arroba, sin dominio o con dominio de una letra', () => {
    expect(validateEmail('correo')).toBe('invalid');
    expect(validateEmail('correo@dominio')).toBe('invalid');
    expect(validateEmail('correo@dominio.c')).toBe('invalid');
    expect(validateEmail('co rreo@dominio.com')).toBe('invalid');
  });

  it('acepta un correo válido, sin distinguir mayúsculas ni espacios', () => {
    expect(validateEmail('demo@kynwallet.test')).toBeNull();
    expect(validateEmail('  DEMO@kynwallet.test ')).toBeNull();
  });

  it('rechaza correos que superan el máximo de 254 caracteres', () => {
    const label = 'a'.repeat(63);
    const tooLong = `${label}.${label}.${label}.${label}@x.com`;
    expect(tooLong.length).toBeGreaterThan(EMAIL_MAX_LENGTH);
    expect(validateEmail(tooLong)).toBe('invalid');
  });
});

describe('validatePassword', () => {
  it('exige una contraseña no vacía', () => {
    expect(validatePassword('')).toBe('required');
  });

  it(`rechaza menos de ${PASSWORD_MIN_LENGTH} caracteres`, () => {
    expect(validatePassword('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe('too-short');
  });

  it(`acepta exactamente ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres`, () => {
    expect(validatePassword('a'.repeat(PASSWORD_MIN_LENGTH))).toBeNull();
    expect(validatePassword('a'.repeat(PASSWORD_MAX_LENGTH))).toBeNull();
  });

  it(`rechaza más de ${PASSWORD_MAX_LENGTH} caracteres`, () => {
    expect(validatePassword('a'.repeat(PASSWORD_MAX_LENGTH + 1))).toBe('too-long');
  });

  it('no recorta la contraseña antes de medirla', () => {
    expect(validatePassword(' '.repeat(PASSWORD_MIN_LENGTH - 1))).toBe('too-short');
  });
});
