import { type ValidationError, ValidationPipe, type INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import { ApiProblemException } from '../interfaces/http/filters/api-problem.exception.js';
import { ProblemDetailFilter } from '../interfaces/http/filters/problem-detail.filter.js';

export const API_PREFIX = 'api/v1';

export function configureApp(app: INestApplication): void {
  app.use(helmet());
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalFilters(new ProblemDetailFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        ApiProblemException.validationFailed(errors.map((error) => error.property)),
    }),
  );
}
