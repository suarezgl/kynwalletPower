import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';
import { ApiProblemException, type ProblemBody } from './api-problem.exception.js';

export const RATE_LIMIT_WINDOW_SECONDS = 60;

@Catch()
export class ProblemDetailFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = toProblemBody(exception);

    if (body.status === HttpStatus.UNAUTHORIZED) {
      response.setHeader('WWW-Authenticate', 'Bearer');
    }
    if (body.status === HttpStatus.TOO_MANY_REQUESTS) {
      response.setHeader('Retry-After', String(RATE_LIMIT_WINDOW_SECONDS));
    }
    response.status(body.status).type('application/problem+json').json(body);
  }
}

function toProblemBody(exception: unknown): ProblemBody {
  if (exception instanceof ApiProblemException) return exception.problem;
  if (exception instanceof ThrottlerException) return ApiProblemException.rateLimited().problem;
  if (exception instanceof HttpException && exception.getStatus() === HttpStatus.NOT_FOUND) {
    return {
      type: 'https://kynwallet.dev/problems/not-found',
      title: 'No encontrado',
      status: 404,
      detail: 'El recurso solicitado no existe.',
      code: 'not-found',
    };
  }
  return {
    type: 'https://kynwallet.dev/problems/internal-error',
    title: 'Error interno',
    status: 500,
    detail: 'Ocurrió un error inesperado.',
    code: 'internal-error',
  };
}
