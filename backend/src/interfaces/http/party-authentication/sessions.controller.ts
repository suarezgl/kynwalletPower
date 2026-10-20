import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import { AuthenticatePartyUseCase } from '../../../application/authenticate-party.use-case.js';
import { ApiProblemException } from '../filters/api-problem.exception.js';
import { type AuthenticatedRequest } from '../security/jwt-auth.guard.js';
import { Public } from '../security/public.decorator.js';
import { CreateSessionDto } from './dto/create-session.dto.js';

@Controller('party-authentication/sessions')
export class SessionsController {
  constructor(
    @Inject(AuthenticatePartyUseCase) private readonly authenticate: AuthenticatePartyUseCase,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSessionDto) {
    const outcome = await this.authenticate.execute({ email: dto.email, password: dto.password });

    switch (outcome.kind) {
      case 'authenticated':
        return {
          accessToken: outcome.accessToken,
          tokenType: 'Bearer',
          expiresIn: outcome.expiresIn,
          party: { displayName: outcome.party.displayName },
        };
      case 'invalid-credentials':
        throw ApiProblemException.invalidCredentials();
      case 'service-unavailable':
        throw ApiProblemException.serviceUnavailable();
    }
  }

  @Get('current')
  current(@Req() request: AuthenticatedRequest) {
    return { party: { displayName: request.user?.displayName } };
  }
}
