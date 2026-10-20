import { randomUUID } from 'node:crypto';
import { isWellFormedHash } from '../security/password-hash.js';
import type { PartyDirectory, PartyRecord } from '../../application/ports/party-directory.port.js';
import { normalizeEmail } from '../../domain/credentials/credentials.js';

interface DemoAccountConfig {
  readonly email: string;
  readonly displayName: string;
  readonly passwordHash: string;
}

export class EnvPartyDirectory implements PartyDirectory {
  private readonly recordsByEmail = new Map<string, PartyRecord>();

  constructor(rawAccounts: string) {
    const accounts = parseAccounts(rawAccounts);
    for (const account of accounts) {
      const email = normalizeEmail(account.email);
      if (this.recordsByEmail.has(email)) {
        throw new Error(`DEMO_ACCOUNTS contiene un correo duplicado: ${email}`);
      }
      if (!isWellFormedHash(account.passwordHash)) {
        throw new Error(`DEMO_ACCOUNTS contiene un hash de contraseña inválido para ${email}`);
      }
      this.recordsByEmail.set(email, {
        party: { id: randomUUID(), displayName: account.displayName },
        passwordHash: account.passwordHash,
      });
    }
  }

  async findByEmail(normalizedEmail: string): Promise<PartyRecord | undefined> {
    return this.recordsByEmail.get(normalizeEmail(normalizedEmail));
  }
}

function parseAccounts(raw: string): DemoAccountConfig[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('DEMO_ACCOUNTS no es un JSON válido');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('DEMO_ACCOUNTS debe contener al menos una cuenta');
  }
  return parsed as DemoAccountConfig[];
}
