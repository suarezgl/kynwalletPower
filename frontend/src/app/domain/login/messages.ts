export const LOGIN_MESSAGES = {
  email: {
    required: 'Ingresa tu correo electrónico',
    invalid: 'Ingresa un correo electrónico válido',
  },
  password: {
    required: 'Ingresa tu contraseña',
    tooShort: 'La contraseña debe tener al menos 15 caracteres',
    tooLong: 'La contraseña no puede superar 128 caracteres',
  },
  invalidCredentials: 'Correo o contraseña incorrectos',
  unavailable: 'Servicio de acceso no disponible. Intenta más tarde.',
  featureUnavailable: 'Función no disponible en esta demostración',
} as const;
