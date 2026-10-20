import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthResult, LoginCredentials } from '../../application/ports/auth-gateway';
import { API_BASE_URL } from '../http/api-config';
import { HttpAuthGateway, REQUEST_TIMEOUT_MS } from './http-auth.gateway';

const URL = '/api/v1/party-authentication/sessions';
const CREDENTIALS: LoginCredentials = { email: 'demo@kynwallet.test', password: 'contraseña-de-15' };

describe('HttpAuthGateway', () => {
  let gateway: HttpAuthGateway;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api/v1' },
      ],
    });
    gateway = TestBed.inject(HttpAuthGateway);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    vi.useRealTimers();
  });

  function login(): Promise<AuthResult> {
    return new Promise((resolve) => gateway.login(CREDENTIALS).subscribe(resolve));
  }

  it('envía POST con las credenciales y mapea la sesión autenticada', async () => {
    const result = login();
    const req = backend.expectOne(URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(CREDENTIALS);
    req.flush(
      { accessToken: 'jwt', tokenType: 'Bearer', expiresIn: 900, party: { displayName: 'Titular' } },
      { status: 201, statusText: 'Created' },
    );

    expect(await result).toEqual({
      status: 'authenticated',
      session: { accessToken: 'jwt', displayName: 'Titular' },
    });
  });

  it('mapea 401 a credenciales inválidas', async () => {
    const result = login();
    backend.expectOne(URL).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(await result).toEqual({ status: 'invalid-credentials' });
  });

  it.each([400, 429, 500, 503, 0])('mapea el estado %i a servicio no disponible', async (status) => {
    const result = login();
    backend.expectOne(URL).flush({}, { status, statusText: 'error' });
    expect(await result).toEqual({ status: 'unavailable' });
  });

  it(`aplica un tiempo de espera de ${REQUEST_TIMEOUT_MS} ms y lo mapea a servicio no disponible`, () => {
    vi.useFakeTimers();
    const outcome = vi.fn();
    gateway.login(CREDENTIALS).subscribe(outcome);

    vi.advanceTimersByTime(REQUEST_TIMEOUT_MS + 1);

    expect(outcome).toHaveBeenCalledWith({ status: 'unavailable' });
    backend.expectOne(URL);
  });
});
