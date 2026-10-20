export interface Session {
  accessToken: string;
  displayName: string;
}

export abstract class SessionStore {
  abstract session(): Session | null;
  abstract open(session: Session): void;
  abstract close(): void;
}
