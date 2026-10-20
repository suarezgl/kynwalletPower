# Contract: API REST de Party Authentication (KynWallet)

**Feature**: `001-login-billetera` | **Versión del contrato**: `v1` | **Base**: `/api/v1`

Contrato entre el frontend Angular y el backend NestJS. Cumple:

- **Constitución 7.2**: toda comunicación es REST sobre HTTPS (HTTP en local).
- **Constitución 7.3**: dominio de servicio BIAN *Party Authentication*. Las operaciones usan los
  verbos de acción BIAN (`Initiate`, `Retrieve`): `Initiate` crea una sesión, `Retrieve`
  consulta la sesión vigente. *Confirmar el nombre contra el catálogo BIAN vigente.*
- **Constitución 7.4**: todas las APIs requieren JWT, excepto la operación `Initiate`, que es el
  punto de obtención del token.
- **Constitución 8.1**: toda respuesta < 5 s; la latencia simulada es 1000 ms por defecto.
- **OWASP Top 10:2025**: ver el mapa en [plan.md](../plan.md#constitution-check).

Todas las respuestas de error usan `application/problem+json` (RFC 9457) y **nunca** incluyen
trazas, nombres de clases ni datos de la cuenta.

## Operaciones

### 1. Initiate: iniciar sesión (pública)

`POST /api/v1/party-authentication/sessions`

**Request** (`application/json`, máximo 4 KB):

```json
{ "email": "titular@ejemplo.com", "password": "contraseña-de-15-o-mas" }
```

| Campo | Regla (espejo de las validaciones del frontend, FR-003/FR-004) |
|---|---|
| `email` | string, requerido, trim y minúsculas, ≤ 254, sin espacios, `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` |
| `password` | string, requerido, 15–128 caracteres, sin recortar |

Cualquier propiedad adicional produce 400 (`forbidNonWhitelisted`).

**Respuestas**:

| Código | Cuándo | Cuerpo |
|---|---|---|
| `201 Created` | Correo y contraseña válidos | Ver abajo |
| `400 Bad Request` | Violación de esquema | problem+json con `errors` (nombre del campo, sin valor) |
| `401 Unauthorized` | Correo inexistente o contraseña incorrecta (indistinguibles) | problem+json `invalid-credentials` |
| `429 Too Many Requests` | Más de 5 intentos por minuto desde la misma IP | problem+json `rate-limited` y cabecera `Retry-After` |
| `503 Service Unavailable` | Configuración de cuentas ausente o inválida | problem+json `service-unavailable` |

Respuesta `201`:

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "party": { "displayName": "Nombre del titular" }
}
```

Respuesta `401`:

```json
{
  "type": "https://kynwallet.local/problems/invalid-credentials",
  "title": "Credenciales incorrectas",
  "status": 401,
  "detail": "Correo o contraseña incorrectos"
}
```

**Reglas de comportamiento**:

- **C1** El backend compara el correo normalizado y verifica la contraseña con `scrypt` y
  `timingSafeEqual`. Si el correo no existe, verifica contra un hash ficticio para igualar el
  tiempo de respuesta (OWASP A07).
- **C2** La contraseña nunca se registra, ni en logs ni en respuestas de error.
- **C3** El JWT se firma con HS256, `iss = kynwallet-backend`, `aud = kynwallet-web`,
  `sub` = identificador opaco del titular (no el correo), `exp` = 900 s desde la emisión.
- **C4** La latencia simulada se aplica antes de responder en todos los resultados (éxito,
  fallo y error de validación de cuenta), para no revelar cuál ocurrió.

### 2. Retrieve: consultar la sesión vigente (protegida)

`GET /api/v1/party-authentication/sessions/current`

**Cabeceras**: `Authorization: Bearer <jwt>`

| Código | Cuándo | Cuerpo |
|---|---|---|
| `200 OK` | Token válido (firma, `iss`, `aud`, `exp`, algoritmo HS256) | `{ "party": { "displayName": "..." } }` |
| `401 Unauthorized` | Falta el token, está expirado, firma inválida o algoritmo no permitido | problem+json `unauthenticated` y `WWW-Authenticate: Bearer` |

Sin token válido no se revela ningún dato del titular (OWASP A01).

## Cabeceras comunes

- Respuestas: `Content-Type: application/json` o `application/problem+json`, `Cache-Control: no-store`
  en respuestas con token, `X-Content-Type-Options: nosniff` (helmet).
- Versionado: el prefijo `/api/v1` cambia solo con cambios incompatibles (Constitución 7.3).

## Mapeo en el frontend (adaptador `HttpAuthGateway`)

| Resultado HTTP / error | `AuthResult` del dominio |
|---|---|
| `201` | `success` con `party.displayName` |
| `401` | `invalid-credentials` |
| `400`, `429`, `503`, `5xx`, error de red o tiempo agotado | `unavailable` |

- **C5** El frontend aplica un tiempo máximo de 4500 ms a la solicitud; si se supera, el resultado
  es `unavailable` (Constitución 8.1).
- **C6** El token se conserva solo en memoria (servicio `AuthTokenStore`), nunca en
  `localStorage`, `sessionStorage` ni cookies accesibles desde JavaScript (OWASP A02/A07).
- **C7** El frontend normaliza el correo (trim y minúsculas) antes de enviarlo, igual que el backend.
- **C8** La URL base se inyecta con el token `API_BASE_URL`. En desarrollo, el proxy de Angular
  reenvía `/api` a `http://localhost:3000`, por lo que no se requiere CORS.

## Pruebas de contrato

- Backend (integración con `supertest`): los códigos y cuerpos de la tabla; el `401` idéntico
  para correo inexistente y contraseña incorrecta; `429` tras el quinto intento; `WWW-Authenticate`
  presente; `201` por debajo de 5000 ms (8.2).
- Frontend (unitarias del adaptador): cada fila del mapeo, incluida la expiración de C5.
