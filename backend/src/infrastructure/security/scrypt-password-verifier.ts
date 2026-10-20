import { Injectable } from '@nestjs/common';
import type { PasswordVerifier } from '../../application/ports/password-verifier.port.js';
import { verifyPassword } from './password-hash.js';

@Injectable()
export class ScryptPasswordVerifier implements PasswordVerifier {
  constructor(readonly decoyHash: string) {}

  verify(password: string, storedHash: string): Promise<boolean> {
    return verifyPassword(password, storedHash);
  }
}
