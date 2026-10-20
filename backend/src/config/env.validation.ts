export interface AppConfig {
  readonly port: number;
  readonly simulatedLatencyMs: number;
  readonly jwtSecret: string;
  readonly jwtExpiresInSeconds: number;
  readonly jwtIssuer: string;
  readonly jwtAudience: string;
  readonly demoAccountsJson: string;
}

type Env = Record<string, string | undefined>;

const MAX_LATENCY_MS = 4000;
const MAX_TOKEN_TTL_SECONDS = 900;
const MIN_JWT_SECRET_LENGTH = 32;

function parseInteger(env: Env, key: string, fallback: number, min: number, max: number): number {
  const raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  if (!/^\d+$/.test(raw)) throw new Error(`${key} debe ser un entero`);
  const value = Number(raw);
  if (value < min || value > max) throw new Error(`${key} debe estar entre ${min} y ${max}`);
  return value;
}

function requireValue(env: Env, key: string): string {
  const value = env[key];
  if (!value) throw new Error(`${key} es obligatorio`);
  return value;
}

export function validateEnv(env: Env): AppConfig {
  const jwtSecret = requireValue(env, 'JWT_SECRET');
  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET debe tener al menos ${MIN_JWT_SECRET_LENGTH} caracteres`);
  }

  return {
    port: parseInteger(env, 'PORT', 3000, 1, 65535),
    simulatedLatencyMs: parseInteger(env, 'SIMULATED_LATENCY_MS', 1000, 0, MAX_LATENCY_MS),
    jwtSecret,
    jwtExpiresInSeconds: parseInteger(env, 'JWT_EXPIRES_IN_SECONDS', MAX_TOKEN_TTL_SECONDS, 1, MAX_TOKEN_TTL_SECONDS),
    jwtIssuer: env['JWT_ISSUER'] || 'kynwallet-backend',
    jwtAudience: env['JWT_AUDIENCE'] || 'kynwallet-web',
    demoAccountsJson: requireValue(env, 'DEMO_ACCOUNTS'),
  };
}
