# Quickstart: Pantalla de Inicio de Sesión de KynWallet

Guía para ejecutar frontend y backend en local y validar la funcionalidad de punta a punta.

> Esta guía describe el resultado esperado tras la implementación. Los comandos se confirman
> al crear los proyectos (`frontend/`, `backend/`).

## Prerrequisitos

- **Node.js 24 LTS** (`.nvmrc`: `24`) y npm 11 o superior. Con nvm: `nvm use`.
- Git (el repositorio debe inicializarse antes de integrar cambios, Constitución 11.3).

## Configuración del backend

```bash
cd backend
npm ci
cp .env.example .env
```

1. Genera el JWT secret (≥ 32 caracteres) y colócalo en `JWT_SECRET` de `.env`. No lo compartas.
2. Crea una cuenta ficticia con hash:

   ```bash
   npm run hash-password -- "contraseña-ficticia-de-15-o-mas"
   ```

3. Copia el resultado dentro de `DEMO_ACCOUNTS` en `.env`, siguiendo el formato de
   [data-model.md](./data-model.md#demoaccount-configuración).

`.env` no se versiona (Constitución 5.3). Usa solo cuentas ficticias.

## Configuración del frontend

```bash
cd frontend
npm ci
```

El proxy de desarrollo reenvía `/api` a `http://localhost:3000`; no se requiere configuración.

## Ejecutar

```bash
# terminal 1
cd backend
npm run start:dev          # API en http://localhost:3000/api/v1

# terminal 2
cd frontend
npm start                  # aplicación en http://localhost:4200
```

## Verificar calidad (Constitución 11.4)

```bash
cd backend && npm run verify    # lint, typecheck, test:cov (≥ 80 %), build, audit:deps, audit:licenses
cd frontend && npm run verify   # lint, typecheck, test:coverage (≥ 80 %), build, audit:deps, audit:licenses
cd .. && npm run scan:secrets   # secretlint sobre el repositorio
```

Resultado esperado: todos los pasos terminan con código 0 y la cobertura es ≥ 80 % en cada
proyecto.

## Verificar la API con curl

```bash
# Inicio de sesión válido (201 y token)
curl -s -X POST http://localhost:3000/api/v1/party-authentication/sessions \
  -H "Content-Type: application/json" \
  -d '{"email":"<correo>","password":"<contraseña>"}'

# Consulta protegida con el token (200)
curl -s http://localhost:3000/api/v1/party-authentication/sessions/current \
  -H "Authorization: Bearer <accessToken>"

# Sin token (401 con WWW-Authenticate)
curl -i http://localhost:3000/api/v1/party-authentication/sessions/current
```

Detalles de códigos y cuerpos en [contracts/auth-api.md](./contracts/auth-api.md).

## Escenarios de validación manual

Siendo `<correo>` y `<contraseña>` una cuenta definida en `DEMO_ACCOUNTS`:

| # | Acción | Resultado esperado | Spec |
|---|---|---|---|
| 1 | Ingresar credenciales válidas y presionar "Iniciar sesión" | Botón en carga ~1 s; luego "¡Bienvenido, {nombre}!" con "Cerrar sesión" | US1-1, US1-2 |
| 2 | Presionar "Cerrar sesión" | Vuelve el formulario vacío | US1-5 |
| 3 | Correo en mayúsculas y con espacios, contraseña correcta | Acceso exitoso | US1-3 |
| 4 | Correo válido con contraseña incorrecta | "Correo o contraseña incorrectos"; correo conservado, contraseña vacía y con el foco | US2-1, US2-4 |
| 5 | Correo inexistente | El mismo mensaje que en el escenario 4 | US2-2 |
| 6 | Enviar con los campos vacíos | Errores en ambos campos; foco en el correo | US3-1 |
| 7 | Escribir "usuario@" y salir del campo | "Ingresa un correo electrónico válido" | US3-2 |
| 8 | Contraseña de 14 caracteres | "La contraseña debe tener al menos 15 caracteres" | US3-3 |
| 9 | Activar el icono de visibilidad | Se muestra y se oculta la contraseña | US4 |
| 10 | Presionar Google, Apple, "¿Olvidaste…?" o "Regístrate" | "Función no disponible en esta demostración" | US5-1 |
| 11 | Detener el backend e intentar acceder | "Servicio de acceso no disponible. Intenta más tarde." | Caso límite |
| 12 | Hacer 6 intentos en un minuto | El sexto recibe 429 y el mensaje de no disponible | OWASP A07 |
| 13 | Reducir la ventana a 320 px | Sin scroll horizontal; logo visible; formulario usable | FR-018 |
| 14 | Recorrer la pantalla solo con Tab y Enter | Orden según [contracts/ui-login.md](./contracts/ui-login.md#teclado); foco visible | FR-014 |

## Solución de problemas

- **503 en la API**: revisa `DEMO_ACCOUNTS` y `JWT_SECRET` en `backend/.env`; el backend registra
  el motivo sin mostrar valores sensibles.
- **El arranque del backend falla**: la configuración es inválida (variable faltante, latencia
  fuera de 0–4000 ms o secreto corto). El mensaje indica la variable, nunca su valor.
