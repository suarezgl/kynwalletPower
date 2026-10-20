import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, type JwtVerifyOptions } from '@nestjs/jwt';
import type { Request } from 'express';
import { ApiProblemException } from '../filters/api-problem.exception.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

export const JWT_VERIFY_OPTIONS = Symbol('JWT_VERIFY_OPTIONS');

export interface AuthenticatedParty {
  readonly id: string;
  readonly displayName: string;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedParty };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(JWT_VERIFY_OPTIONS) private readonly options: JwtVerifyOptions,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);
    if (!token) throw ApiProblemException.unauthenticated();

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; name: string }>(token, this.options);
      request.user = { id: payload.sub, displayName: payload.name };
      return true;
    } catch {
      throw ApiProblemException.unauthenticated();
    }
  }
}

function extractBearerToken(header: string | undefined): string | undefined {
  const match = /^Bearer (.+)$/.exec(header ?? '');
  return match?.[1];
}
