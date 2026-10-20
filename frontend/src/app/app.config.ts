import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthGateway } from './application/ports/auth-gateway';
import { SessionStore } from './application/ports/session-store';
import { HttpAuthGateway } from './infrastructure/auth/http-auth.gateway';
import { AuthTokenStore } from './infrastructure/auth/auth-token-store';
import { authInterceptor } from './infrastructure/http/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: AuthGateway, useExisting: HttpAuthGateway },
    { provide: SessionStore, useExisting: AuthTokenStore },
  ],
};
