import { Observable } from 'rxjs';
import type { Session } from './session-store';

export interface LoginCredentials {
  email: string;
  password: string;
}

export type AuthResult =
  | { status: 'authenticated'; session: Session }
  | { status: 'invalid-credentials' }
  | { status: 'unavailable' };

export abstract class AuthGateway {
  abstract login(credentials: LoginCredentials): Observable<AuthResult>;
}
