import { describe, expect, it } from 'vitest';
import { LOGIN_MESSAGES } from './messages';

describe('LOGIN_MESSAGES', () => {
  it('usa los textos exactos del contrato de UI', () => {
    expect(LOGIN_MESSAGES.invalidCredentials).toBe('Correo o contraseña incorrectos');
    expect(LOGIN_MESSAGES.unavailable).toBe('Servicio de acceso no disponible. Intenta más tarde.');
    expect(LOGIN_MESSAGES.featureUnavailable).toBe('Función no disponible en esta demostración');
  });

  it('cubre todos los códigos de error de campo', () => {
    expect(LOGIN_MESSAGES.email.required).toBe('Ingresa tu correo electrónico');
    expect(LOGIN_MESSAGES.email.invalid).toBe('Ingresa un correo electrónico válido');
    expect(LOGIN_MESSAGES.password.required).toBe('Ingresa tu contraseña');
    expect(LOGIN_MESSAGES.password.tooShort).toBe('La contraseña debe tener al menos 15 caracteres');
    expect(LOGIN_MESSAGES.password.tooLong).toBe('La contraseña no puede superar 128 caracteres');
  });
});
