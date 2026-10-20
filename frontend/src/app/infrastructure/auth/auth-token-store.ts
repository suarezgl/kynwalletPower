import { Injectable, computed, signal } from '@angular/core';
import { type Session, SessionStore } from '../../application/ports/session-store';

@Injectable({ providedIn: 'root' })
export class AuthTokenStore extends SessionStore {
  private readonly current = signal<Session | null>(null);
  private readonly token = computed(() => this.current()?.accessToken ?? null);

  session(): Session | null {
    return this.current();
  }

  accessToken(): string | null {
    return this.token();
  }

  open(session: Session): void {
    this.current.set(session);
  }

  close(): void {
    this.current.set(null);
  }
}
