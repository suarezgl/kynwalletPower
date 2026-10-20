import { HttpException } from '@nestjs/common';

export interface ProblemBody {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly code: string;
  readonly fields?: readonly string[];
}

const PROBLEM_BASE_URI = 'https://kynwallet.dev/problems/';

function problem(
  status: number,
  code: string,
  title: string,
  detail: string,
  fields?: readonly string[],
): ProblemBody {
  return { type: `${PROBLEM_BASE_URI}${code}`, title, status, detail, code, ...(fields ? { fields } : {}) };
}

export class ApiProblemException extends HttpException {
  constructor(readonly problem: ProblemBody) {
    super(problem.title, problem.status);
  }

  static invalidCredentials(): ApiProblemException {
    return new ApiProblemException(
      problem(401, 'invalid-credentials', 'Credenciales inválidas', 'Correo o contraseña incorrectos.'),
    );
  }

  static unauthenticated(): ApiProblemException {
    return new ApiProblemException(
      problem(401, 'unauthenticated', 'No autenticado', 'Se requiere un token de acceso válido.'),
    );
  }

  static validationFailed(fields: readonly string[]): ApiProblemException {
    return new ApiProblemException(
      problem(400, 'validation-failed', 'Datos no válidos', 'Revisa los campos indicados.', fields),
    );
  }

  static serviceUnavailable(): ApiProblemException {
    return new ApiProblemException(
      problem(
        503,
        'service-unavailable',
        'Servicio no disponible',
        'Servicio de acceso no disponible. Intenta más tarde.',
      ),
    );
  }

  static rateLimited(): ApiProblemException {
    return new ApiProblemException(
      problem(429, 'rate-limited', 'Demasiadas solicitudes', 'Espera antes de volver a intentarlo.'),
    );
  }
}
