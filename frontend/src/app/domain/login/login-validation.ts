export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

export type EmailError = 'required' | 'invalid';
export type PasswordError = 'required' | 'too-short' | 'too-long';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string): EmailError | null {
  const email = normalizeEmail(value);
  if (email.length === 0) {
    return 'required';
  }
  if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
    return 'invalid';
  }
  return null;
}

export function validatePassword(value: string): PasswordError | null {
  if (value.length === 0) {
    return 'required';
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return 'too-short';
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return 'too-long';
  }
  return null;
}
