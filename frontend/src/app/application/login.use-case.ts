import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { normalizeEmail } from '../domain/login/login-validation';
import { AuthGateway, type AuthResult, type LoginCredentials } from './ports/auth-gateway';
import { SessionStore } from './ports/session-store';

@Injectable({ providedIn: 'root' })
export class LoginUseCase {
  private readonly gateway = inject(AuthGateway);
  private readonly sessions = inject(SessionStore);

  async execute(input: LoginCredentials): Promise<AuthResult> {
    const credentials = { email: normalizeEmail(input.email), password: input.password };
    const result = await firstValueFrom(this.gateway.login(credentials));
    if (result.status === 'authenticated') {
      this.sessions.open(result.session);
    }
    return result;
  }
}
