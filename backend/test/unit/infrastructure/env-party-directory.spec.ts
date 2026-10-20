import { describe, expect, it } from 'vitest';
import { EnvPartyDirectory } from '../../../src/infrastructure/persistence/env-party-directory.js';
import { hashPassword } from '../../../src/infrastructure/security/password-hash.js';

const PASSWORD = 'contraseña-de-prueba-15';

async function account(email: string, displayName = 'Titular Demo') {
  return { email, displayName, passwordHash: await hashPassword(PASSWORD) };
}

describe('EnvPartyDirectory', () => {
  it('carga cuentas válidas y busca por correo normalizado', async () => {
    const raw = JSON.stringify([await account('demo@kynwallet.test')]);
    const directory = new EnvPartyDirectory(raw);

    const found = await directory.findByEmail('  DEMO@kynwallet.test ');

    expect(found?.party.displayName).toBe('Titular Demo');
    expect(found?.passwordHash).toMatch(/^scrypt\$/);
  });

  it('no expone el correo en la entidad Party', async () => {
    const raw = JSON.stringify([await account('demo@kynwallet.test')]);
    const found = await new EnvPartyDirectory(raw).findByEmail('demo@kynwallet.test');
    expect(JSON.stringify(found?.party)).not.toContain('demo@kynwallet.test');
  });

  it('falla al arrancar con correos duplicados', async () => {
    const raw = JSON.stringify([
      await account('demo@kynwallet.test'),
      await account('DEMO@kynwallet.test'),
    ]);
    expect(() => new EnvPartyDirectory(raw)).toThrow(/duplicad/i);
  });

  it('falla al arrancar con un hash inválido', async () => {
    const raw = JSON.stringify([
      { email: 'demo@kynwallet.test', displayName: 'Demo', passwordHash: 'en-claro' },
    ]);
    expect(() => new EnvPartyDirectory(raw)).toThrow(/hash/i);
  });

  it('falla al arrancar sin cuentas', () => {
    expect(() => new EnvPartyDirectory('[]')).toThrow(/al menos una cuenta/i);
  });

  it('falla al arrancar si el JSON no es válido', () => {
    expect(() => new EnvPartyDirectory('{no-json')).toThrow(/JSON/);
  });
});
