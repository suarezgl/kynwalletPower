import { type DynamicModule, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtService, type JwtVerifyOptions } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthenticatePartyUseCase } from './application/authenticate-party.use-case.js';
import type { AppConfig } from './config/env.validation.js';
import { EnvPartyDirectory } from './infrastructure/persistence/env-party-directory.js';
import { hashPassword } from './infrastructure/security/password-hash.js';
import { ScryptPasswordVerifier } from './infrastructure/security/scrypt-password-verifier.js';
import { JwtTokenIssuer } from './infrastructure/security/jwt-token-issuer.js';
import { SimulatedLatency } from './infrastructure/simulation/simulated-latency.js';
import { ProblemDetailFilter } from './interfaces/http/filters/problem-detail.filter.js';
import { SessionsController } from './interfaces/http/party-authentication/sessions.controller.js';
import { JWT_VERIFY_OPTIONS, JwtAuthGuard } from './interfaces/http/security/jwt-auth.guard.js';
import { randomBytes } from 'node:crypto';

export const PARTY_DIRECTORY = Symbol('PARTY_DIRECTORY');
export const PASSWORD_VERIFIER = Symbol('PASSWORD_VERIFIER');
export const TOKEN_ISSUER = Symbol('TOKEN_ISSUER');

export const RATE_LIMIT = { ttl: 60_000, limit: 5 };

@Module({})
export class PartyAuthenticationModule {
  static register(config: AppConfig): DynamicModule {
    const verifyOptions: JwtVerifyOptions = {
      secret: config.jwtSecret,
      algorithms: ['HS256'],
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    };

    return {
      module: PartyAuthenticationModule,
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [RATE_LIMIT],
          skipIf: (context) => context.switchToHttp().getRequest().method !== 'POST',
        }),
      ],
      controllers: [SessionsController],
      providers: [
        { provide: JwtService, useFactory: () => new JwtService({ secret: config.jwtSecret }) },
        { provide: JWT_VERIFY_OPTIONS, useValue: verifyOptions },
        {
          provide: PARTY_DIRECTORY,
          useFactory: () => new EnvPartyDirectory(config.demoAccountsJson),
        },
        {
          provide: PASSWORD_VERIFIER,
          useFactory: async () =>
            new ScryptPasswordVerifier(await hashPassword(randomBytes(32).toString('hex'))),
        },
        {
          provide: TOKEN_ISSUER,
          useFactory: (jwt: JwtService) =>
            new JwtTokenIssuer(jwt, {
              issuer: config.jwtIssuer,
              audience: config.jwtAudience,
              expiresInSeconds: config.jwtExpiresInSeconds,
            }),
          inject: [JwtService],
        },
        {
          provide: AuthenticatePartyUseCase,
          useFactory: (directory, passwordVerifier, tokenIssuer) =>
            new AuthenticatePartyUseCase({
              directory,
              passwordVerifier,
              tokenIssuer,
              latency: new SimulatedLatency(config.simulatedLatencyMs),
            }),
          inject: [PARTY_DIRECTORY, PASSWORD_VERIFIER, TOKEN_ISSUER],
        },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_FILTER, useClass: ProblemDetailFilter },
      ],
      exports: [AuthenticatePartyUseCase],
    };
  }
}
