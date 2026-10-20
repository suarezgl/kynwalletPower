import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthTokenStore } from '../auth/auth-token-store';
import { API_BASE_URL } from './api-config';

const PROTECTED_PATH = '/party-authentication/sessions/current';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthTokenStore).accessToken();
  const protectedUrl = `${inject(API_BASE_URL)}${PROTECTED_PATH}`;

  if (token === null || req.url !== protectedUrl) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
