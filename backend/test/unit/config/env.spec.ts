import { describe, expect, it } from 'vitest';
import { validateEnv } from '../../../src/config/env.validation.js';

const base = {
  DEMO_ACCOUNTS: '[]',
  JWT_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('usa PORT 3000 por defecto', () => {
    expect(validateEnv(base).port).toBe(3000);
  });

  it('usa 1000 ms de latencia simulada por defecto y 900 s de expiración', () => {
    const config = validateEnv(base);
    expect(config.simulatedLatencyMs).toBe(1000);
    expect(config.jwtExpiresInSeconds).toBe(900);
  });

  it('rechaza JWT_SECRET menor de 32 caracteres', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'corto' })).toThrow(/JWT_SECRET/);
  });

  it('exige JWT_SECRET', () => {
    expect(() => validateEnv({ DEMO_ACCOUNTS: '[]' })).toThrow(/JWT_SECRET/);
  });

  it('exige DEMO_ACCOUNTS', () => {
    expect(() => validateEnv({ JWT_SECRET: 'x'.repeat(32) })).toThrow(/DEMO_ACCOUNTS/);
  });

  it.each(['-1', '4001', 'abc'])('rechaza SIMULATED_LATENCY_MS=%s', (value) => {
    expect(() => validateEnv({ ...base, SIMULATED_LATENCY_MS: value })).toThrow(
      /SIMULATED_LATENCY_MS/,
    );
  });

  it('acepta latencia simulada 0', () => {
    expect(validateEnv({ ...base, SIMULATED_LATENCY_MS: '0' }).simulatedLatencyMs).toBe(0);
  });

  it('rechaza JWT_EXPIRES_IN_SECONDS mayor de 900', () => {
    expect(() => validateEnv({ ...base, JWT_EXPIRES_IN_SECONDS: '901' })).toThrow(
      /JWT_EXPIRES_IN_SECONDS/,
    );
  });
});
