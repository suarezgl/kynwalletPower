# Data Model: Pantalla de Inicio de Sesión de KynWallet

**Feature**: `001-login-billetera` | **Date**: 2026-10-19

No hay persistencia: todas las entidades viven en memoria durante la ejecución (backend) o la
sesión del navegador (frontend). Las reglas de validación son idénticas en ambos lados
(defensa en profundidad, Constitución 5.1).

## Backend

### Party (dominio)

Titular autenticado. Operación BIAN *Party Authentication*.

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | string | Identificador opaco (UUID v4), generado al cargar la configuración |
| `displayName` | string | Obligatorio, 1–80 caracteres; se devuelve en `party.displayName` |

Nunca se expone el correo ni el hash en las respuestas de la API.

### DemoAccount (configuración)

Cuenta de demostración leída de `DEMO_ACCOUNTS` (ver [research.md R4](./research.md#r4-origen-de-las-cuentas-de-demostración)).

| Campo | Tipo | Reglas |
|---|---|---|
| `email` | string | Obligatorio, válido (R7), normalizado; único en el conjunto |
| `displayName` | string | Obligatorio, 1–80 caracteres |
| `passwordHash` | string | Formato `scrypt$N$r$p$salt$hash`, con `salt` y `hash` en base64; nunca contraseña en claro |

**Invariantes**: el conjunto tiene al menos una cuenta; los correos repetidos o un hash mal
formado hacen fallar el arranque (fail fast) o devuelven `503` si se detectan en tiempo de
ejecución.

### ConfigurationSettings (configuración validada al arranque)

| Variable | Obligatoria | Regla |
|---|---|---|
| `DEMO_ACCOUNTS` | Sí | JSON válido con `DemoAccount[]` |
| `JWT_SECRET` | Sí | ≥ 32 caracteres; nunca en el código ni en logs |
| `JWT_EXPIRES_IN_SECONDS` | No | Entero; por defecto 900; máximo 900 |
| `SIMULATED_LATENCY_MS` | No | Entero entre 0 y 4000; por defecto 1000 |
| `PORT` | No | Por defecto 3000 |

### LoginRequest (DTO de entrada)

| Campo | Tipo | Reglas de validación |
|---|---|---|
| `email` | string | Requerido; trim y minúsculas; ≤ 254; `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` |
| `password` | string | Requerido; 15–128 caracteres; sin recortar |

### SessionToken (JWT, claims)

| Claim | Valor |
|---|---|
| `iss` | `kynwallet-backend` |
| `aud` | `kynwallet-web` |
| `sub` | `Party.id` |
| `iat`, `exp` | emisión y expiración (900 s) |
| `name` | `Party.displayName` |

Algoritmo: HS256, fijado al verificar.

### AuthOutcome (resultado del caso de uso)

Unión discriminada, traducida a HTTP por el controlador:

| Variante | Datos | HTTP |
|---|---|---|
| `Initiated` | `accessToken`, `expiresIn`, `party` | 201 |
| `InvalidCredentials` | — | 401 |
| `ServiceUnavailable` | — | 503 |

## Frontend

### LoginCredentials (dominio, valor)

| Campo | Tipo | Reglas de validación (FR-003, FR-004) | Mensaje |
|---|---|---|---|
| `email` | string | Vacío tras trim | "Ingresa tu correo electrónico" |
| | | No cumple formato, espacios o > 254 caracteres | "Ingresa un correo electrónico válido" |
| `password` | string | Vacío | "Ingresa tu contraseña" |
| | | < 15 caracteres | "La contraseña debe tener al menos 15 caracteres" |
| | | > 128 caracteres | "La contraseña no puede superar 128 caracteres" |

`validateCredentials(c) → FieldErrors` es una función pura en `login-validation.ts`; `{}` significa
válido. El texto de los mensajes vive en `messages.ts` (fuente única, DRY).

### AuthResult (dominio)

| Variante | Datos | Origen |
|---|---|---|
| `success` | `displayName` | HTTP 201 |
| `invalid-credentials` | — | HTTP 401 (FR-010) |
| `unavailable` | — | 400, 429, 503, 5xx, red o tiempo agotado (FR-019) |

### LoginFormState (UI, signals)

```text
              submit (con errores)
          ┌──────────────────────────┐
          ▼                          │
 ┌──────────────┐  submit (válido)  ┌┴─────────────┐
 │    editing   │──────────────────▶│  submitting  │
 └──────────────┘                   └──────┬───────┘
   ▲  ▲  ▲                    success      │  invalid / unavailable
   │  │  │          ┌────────────────┐◀────┤
   │  │  │          │    welcome     │     ▼
   │  │  │          └───────┬────────┘   ┌──────────────┐
   │  │  └── logout ────────┘            │ authError    │
   │  └──── edición de un campo ─────────┤ (mensaje)    │
   └────────────────────────────────────-└──────────────┘
```

| Señal | Tipo | Descripción |
|---|---|---|
| `status` | `'editing' \| 'submitting' \| 'authError' \| 'welcome'` | Estado actual |
| `touched` | `{ email, password }` | Campo visitado (validación al salir, FR-005) |
| `fieldErrors` | `FieldErrors` | Errores visibles por campo |
| `authError` | `'invalid-credentials' \| 'unavailable' \| null` | Mensaje global |
| `welcomeName` | `string \| null` | Nombre del titular en `welcome` |
| `rememberMe` | boolean | Solo visual, no persiste (FR-017) |
| `notice` | `string \| null` | Aviso "Función no disponible en esta demostración" (FR-016) |

El formulario reactivo (`FormGroup`) guarda `email` y `password`. La visibilidad de la contraseña
(FR-013) es estado local del componente `PasswordField`.

**Transiciones clave**:

- `submit` con errores → sigue en `editing`, marca todos los campos como tocados y el foco va al
  primer campo con error.
- `submit` válido → `submitting`; envíos adicionales ignorados (FR-008).
- `invalid-credentials` → `authError`; se conserva el correo, se vacía la contraseña y el foco va
  a la contraseña (US2-4).
- Editar un campo en `authError` → `editing` y se limpia `authError` (US2-3).
- `success` → `welcome` con `displayName`; el foco va al título de bienvenida (FR-009).
- `logout` → estado inicial vacío (FR-009a); se descarta el token en memoria.
