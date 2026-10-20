import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthTokenStore } from '../auth/auth-token-store';
import { API_BASE_URL } from './api-config';
import { authInterceptor } from './auth.interceptor';

const BASE = '/api/v1';
const CURRENT = `${BASE}/party-authentication/sessions/current`;
const OTHER = `${BASE}/party-authentication/sessions`;

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let store: AuthTokenStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    store = TestBed.inject(AuthTokenStore);
    store.open({ accessToken: 'token-de-prueba', displayName: 'Titular' });
  });

  afterEach(() => {
    backend.verify();
  });

  it('agrega Authorization Bearer solo en la ruta protegida de sesión actual', () => {
    http.get(CURRENT).subscribe();

    const req = backend.expectOne(CURRENT);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    req.flush({});
  });

  it('no agrega el token a otras rutas, incluido el inicio de sesión', () => {
    http.post(OTHER, {}).subscribe();

    const req = backend.expectOne(OTHER);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('no agrega cabecera cuando no hay sesión', () => {
    store.close();
    http.get(CURRENT).subscribe();

    const req = backend.expectOne(CURRENT);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
