import { Injectable, inject } from '@angular/core';
import { SessionStore } from './ports/session-store';

@Injectable({ providedIn: 'root' })
export class LogoutUseCase {
  private readonly sessions = inject(SessionStore);

  execute(): void {
    this.sessions.close();
  }
}
