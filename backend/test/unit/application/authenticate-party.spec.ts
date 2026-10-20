import { describe, expect, it, vi } from 'vitest';
import { AuthenticatePartyUseCase } from '../../../src/application/authenticate-party.use-case.js';
import type { PartyRecord } from '../../../src/application/ports/party-directory.port.js';

const DECOY_HASH = 'scrypt$16384$8$1$ZGVjb3k=$ZGVjb3k=';
const STORED_HASH = 'scrypt$16384$8$1$c2FsdA==$c3RvcmVk';

function build(record?: PartyRecord, options: { directoryFails?: boolean } = {}) {
  const directory = {
    findByEmail: vi.fn(async () => {
      if (options.directoryFails) throw new Error('config rota');
      return record;
    }),
  };
  const verifier = {
    decoyHash: DECOY_HASH,
    verify: vi.fn(async (password: string, hash: string) => hash === STORED_HASH && password === 'correcta-de-15-car'),
  };
  const issuer = {
    issue: vi.fn(async () => ({ accessToken: 'jwt-de-prueba', expiresIn: 900 })),
  };
  const latency = { wait: vi.fn(async () => undefined) };
  const useCase = new AuthenticatePartyUseCase({
    directory,
    passwordVerifier: verifier,
    tokenIssuer: issuer,
    latency,
  });
  return { useCase, directory, verifier, issuer, latency };
}

const record: PartyRecord = {
  party: { id: 'p-1', displayName: 'Demo Titular' },
  passwordHash: STORED_HASH,
};

describe('AuthenticatePartyUseCase', () => {
  it('devuelve un token con credenciales válidas y normaliza el correo', async () => {
    const { useCase, directory } = build(record);

    const outcome = await useCase.execute({
      email: '  Demo@KynWallet.test ',
      password: 'correcta-de-15-car',
    });

    expect(directory.findByEmail).toHaveBeenCalledWith('demo@kynwallet.test');
    expect(outcome).toEqual({
      kind: 'authenticated',
      accessToken: 'jwt-de-prueba',
      expiresIn: 900,
      party: { id: 'p-1', displayName: 'Demo Titular' },
    });
  });

  it('devuelve credenciales inválidas con contraseña incorrecta', async () => {
    const { useCase } = build(record);
    const outcome = await useCase.execute({ email: 'demo@kynwallet.test', password: 'incorrecta-15-car' });
    expect(outcome).toEqual({ kind: 'invalid-credentials' });
  });

  it('compara contra el hash señuelo cuando el correo no existe (C1)', async () => {
    const { useCase, verifier } = build(undefined);

    const outcome = await useCase.execute({ email: 'nadie@kynwallet.test', password: 'cualquiera-15-car' });

    expect(verifier.verify).toHaveBeenCalledWith('cualquiera-15-car', DECOY_HASH);
    expect(outcome).toEqual({ kind: 'invalid-credentials' });
  });

  it('aplica la latencia simulada en cualquier resultado (C4)', async () => {
    const { useCase, latency } = build(undefined);
    await useCase.execute({ email: 'nadie@kynwallet.test', password: 'cualquiera-15-car' });
    expect(latency.wait).toHaveBeenCalledTimes(1);
  });

  it('devuelve no disponible si el directorio falla', async () => {
    const { useCase } = build(record, { directoryFails: true });
    const outcome = await useCase.execute({ email: 'demo@kynwallet.test', password: 'correcta-de-15-car' });
    expect(outcome).toEqual({ kind: 'service-unavailable' });
  });
});
