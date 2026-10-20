import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Party } from '../../domain/party/party.js';
import type { IssuedToken, TokenIssuer } from '../../application/ports/token-issuer.port.js';

export interface JwtIssuerOptions {
  readonly issuer: string;
  readonly audience: string;
  readonly expiresInSeconds: number;
}

@Injectable()
export class JwtTokenIssuer implements TokenIssuer {
  constructor(
    private readonly jwt: JwtService,
    private readonly options: JwtIssuerOptions,
  ) {}

  async issue(party: Party): Promise<IssuedToken> {
    const accessToken = await this.jwt.signAsync(
      { name: party.displayName },
      {
        subject: party.id,
        issuer: this.options.issuer,
        audience: this.options.audience,
        expiresIn: this.options.expiresInSeconds,
        algorithm: 'HS256',
      },
    );
    return { accessToken, expiresIn: this.options.expiresInSeconds };
  }
}
