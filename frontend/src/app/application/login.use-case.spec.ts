import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AuthGateway, type AuthResult, type LoginCredentials } from './ports/auth-gateway';
import { SessionStore, type Session } from './ports/session-store';
import { LoginUseCase } from './login.use-case';
import { LogoutUseCase } from './logout.use-case';

class FakeGateway extends AuthGateway {
  readonly calls: LoginCredentials[] = [];
  constructor(private readonly result: AuthResult) {
    super();
  }
  login(credentials: LoginCredentials): Observable<AuthResult> {
    this.calls.push(credentials);
    return of(this.result);
  }
}

class FakeSessionStore extends SessionStore {
  current: Session | null = null;
  session(): Session | null {
    return this.current;
  }
  open(session: Session): void {
    this.current = session;
  }
  close(): void {
    this.current = null;
  }
}

function setup(result: AuthResult) {
  const gateway = new FakeGateway(result);
  const sessions = new FakeSessionStore();
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthGateway, useValue: gateway },
      { provide: SessionStore, useValue: sessions },
    ],
  });
  return { gateway, sessions, login: TestBed.inject(LoginUseCase), logout: TestBed.inject(LogoutUseCase) };
}

describe('LoginUseCase', () => {
  it('normaliza el correo antes de llamar al puerto', async () => {
    const { gateway, login } = setup({ status: 'invalid-credentials' });

    await login.execute({ email: '  DEMO@kynwallet.test ', password: 'contraseña-de-15' });

    expect(gateway.calls).toEqual([{ email: 'demo@kynwallet.test', password: 'contraseña-de-15' }]);
  });

  it('guarda la sesión cuando las credenciales son válidas', async () => {
    const { sessions, login } = setup({
      status: 'authenticated',
      session: { accessToken: 'token', displayName: 'Titular' },
    });

    const result = await login.execute({ email: 'demo@kynwallet.test', password: 'contraseña-de-15' });

    expect(result.status).toBe('authenticated');
    expect(sessions.current).toEqual({ accessToken: 'token', displayName: 'Titular' });
  });

  it('no guarda sesión ante credenciales inválidas', async () => {
    const { sessions, login } = setup({ status: 'invalid-credentials' });
    await login.execute({ email: 'a@b.co', password: 'contraseña-de-15' });
    expect(sessions.current).toBeNull();
  });

  it('no guarda sesión cuando el servicio no está disponible', async () => {
    const { sessions, login } = setup({ status: 'unavailable' });
    await login.execute({ email: 'a@b.co', password: 'contraseña-de-15' });
    expect(sessions.current).toBeNull();
  });
});

describe('LogoutUseCase', () => {
  it('cierra la sesión activa', () => {
    const { sessions, logout } = setup({ status: 'invalid-credentials' });
    sessions.open({ accessToken: 'token', displayName: 'Titular' });

    const close = vi.spyOn(sessions, 'close');
    logout.execute();

    expect(close).toHaveBeenCalledOnce();
    expect(sessions.current).toBeNull();
  });
});
