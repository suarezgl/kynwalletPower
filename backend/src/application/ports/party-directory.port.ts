import type { Party } from '../../domain/party/party.js';

export interface PartyRecord {
  readonly party: Party;
  readonly passwordHash: string;
}

export interface PartyDirectory {
  findByEmail(normalizedEmail: string): Promise<PartyRecord | undefined>;
}
