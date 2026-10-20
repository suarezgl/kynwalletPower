import { describe, expect, it } from 'vitest';
import {
  hashPassword,
  isWellFormedHash,
  verifyPassword,
} from '../../../src/infrastructure/security/password-hash.js';

const PASSWORD = 'contraseña-de-prueba-15';

describe('hashPassword', () => {
  it('genera el formato scrypt$N$r$p$salt$hash', async () => {
    const stored = await hashPassword(PASSWORD);
    expect(stored).toMatch(/^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(isWellFormedHash(stored)).toBe(true);
  });

  it('usa una sal distinta en cada generación', async () => {
    expect(await hashPassword(PASSWORD)).not.toBe(await hashPassword(PASSWORD));
  });
});

describe('verifyPassword', () => {
  it('acepta la contraseña correcta', async () => {
    const stored = await hashPassword(PASSWORD);
    expect(await verifyPassword(PASSWORD, stored)).toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const stored = await hashPassword(PASSWORD);
    expect(await verifyPassword('otra-contraseña-15', stored)).toBe(false);
  });

  it('rechaza un hash mal formado sin lanzar error', async () => {
    expect(await verifyPassword(PASSWORD, 'texto-plano')).toBe(false);
  });
});

describe('isWellFormedHash', () => {
  it.each([
    'scrypt$16384$8$1$AAAA$AAAA',
    'scrypt$abc$8$1$AAAA$AAAA',
    'bcrypt$10$xyz',
    '',
  ])('rechaza %s', (value) => {
    expect(isWellFormedHash(value)).toBe(false);
  });
});
