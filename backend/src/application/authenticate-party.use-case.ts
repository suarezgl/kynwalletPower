import type { AuthOutcome } from '../domain/auth/auth-outcome.js';
import { normalizeEmail } from '../domain/credentials/credentials.js';
import type { PartyDirectory, PartyRecord } from './ports/party-directory.port.js';
import type { PasswordVerifier } from './ports/password-verifier.port.js';
import type { ResponseLatency } from './ports/response-latency.port.js';
import type { TokenIssuer } from './ports/token-issuer.port.js';

export interface AuthenticatePartyCommand {
  readonly email: string;
  readonly password: string;
}

export interface AuthenticatePartyDependencies {
  readonly directory: PartyDirectory;
  readonly passwordVerifier: PasswordVerifier;
  readonly tokenIssuer: TokenIssuer;
  readonly latency: ResponseLatency;
}

export class AuthenticatePartyUseCase {
  constructor(private readonly deps: AuthenticatePartyDependencies) {}

  async execute(command: AuthenticatePartyCommand): Promise<AuthOutcome> {
    const outcome = await this.resolve(command);
    await this.deps.latency.wait();
    return outcome;
  }

  private async resolve(command: AuthenticatePartyCommand): Promise<AuthOutcome> {
    let record: PartyRecord | undefined;
    try {
      record = await this.deps.directory.findByEmail(normalizeEmail(command.email));
    } catch {
      return { kind: 'service-unavailable' };
    }

    const matches = await this.deps.passwordVerifier.verify(
      command.password,
      record?.passwordHash ?? this.deps.passwordVerifier.decoyHash,
    );
    if (!record || !matches) return { kind: 'invalid-credentials' };

    const token = await this.deps.tokenIssuer.issue(record.party);
    return {
      kind: 'authenticated',
      accessToken: token.accessToken,
      expiresIn: token.expiresIn,
      party: record.party,
    };
  }
}
