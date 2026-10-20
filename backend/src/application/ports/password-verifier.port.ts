export interface PasswordVerifier {
  /** Hash de referencia que se compara cuando el correo no existe (C1). */
  readonly decoyHash: string;
  verify(password: string, storedHash: string): Promise<boolean>;
}
