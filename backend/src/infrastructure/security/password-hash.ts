import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const MAX_MEMORY = 64 * 1024 * 1024;
const PREFIX = 'scrypt';
const HASH_PATTERN = /^scrypt\$16384\$8\$1\$([A-Za-z0-9+/]+={0,2})\$([A-Za-z0-9+/]+={0,2})$/;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt);
  return [PREFIX, N, R, P, salt.toString('base64'), key.toString('base64')].join('$');
}

export function isWellFormedHash(value: string): boolean {
  const match = HASH_PATTERN.exec(value);
  if (!match) return false;
  return (
    Buffer.from(match[1], 'base64').length === SALT_LENGTH &&
    Buffer.from(match[2], 'base64').length === KEY_LENGTH
  );
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const match = HASH_PATTERN.exec(storedHash);
  if (!match) return false;
  const salt = Buffer.from(match[1], 'base64');
  const expected = Buffer.from(match[2], 'base64');
  if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) return false;
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
}

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return scryptAsync(password, salt, KEY_LENGTH, { N, r: R, p: P, maxmem: MAX_MEMORY });
}
