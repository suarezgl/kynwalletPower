import type { Party } from '../../domain/party/party.js';

export interface IssuedToken {
  readonly accessToken: string;
  readonly expiresIn: number;
}

export interface TokenIssuer {
  issue(party: Party): Promise<IssuedToken>;
}
