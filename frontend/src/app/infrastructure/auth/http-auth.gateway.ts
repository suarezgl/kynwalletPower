import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of, timeout } from 'rxjs';
import { AuthGateway, type AuthResult, type LoginCredentials } from '../../application/ports/auth-gateway';
import { API_BASE_URL } from '../http/api-config';

export const REQUEST_TIMEOUT_MS = 4500;

interface SessionResponse {
  accessToken: string;
  party: { displayName: string };
}

@Injectable({ providedIn: 'root' })
export class HttpAuthGateway extends AuthGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  login(credentials: LoginCredentials): Observable<AuthResult> {
    return this.http
      .post<SessionResponse>(`${this.baseUrl}/party-authentication/sessions`, credentials)
      .pipe(
        map(
          (body): AuthResult => ({
            status: 'authenticated',
            session: { accessToken: body.accessToken, displayName: body.party.displayName },
          }),
        ),
        timeout(REQUEST_TIMEOUT_MS),
        catchError((error: unknown) => of(toFailure(error))),
      );
  }
}

function toFailure(error: unknown): AuthResult {
  if (error instanceof HttpErrorResponse && error.status === 401) {
    return { status: 'invalid-credentials' };
  }
  return { status: 'unavailable' };
}
