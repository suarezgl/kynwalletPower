import type { Party } from '../party/party.js';

export type AuthOutcome =
  | {
      readonly kind: 'authenticated';
      readonly accessToken: string;
      readonly expiresIn: number;
      readonly party: Party;
    }
  | { readonly kind: 'invalid-credentials' }
  | { readonly kind: 'service-unavailable' };
