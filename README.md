# KynWallet

Billetera virtual. Este repositorio es un monorepo con un frontend en Angular y un backend en NestJS que expone APIs simuladas (mock) para el flujo de inicio de sesión.

## Estructura

| Carpeta | Descripción |
|---------|-------------|
| [frontend/](frontend/README.md) | Aplicación Angular 22 (LTS). Formulario de inicio de sesión, vista de bienvenida y layout responsive. |
| [backend/](backend/README.md) | API NestJS 12 con endpoints REST mock, autenticación JWT y respuestas RFC 9457. |
| `specs/` | Especificación, plan, investigación, contratos y tareas (Spec Kit). |
| `.specify/` | Constitución del proyecto y plantillas de Spec Kit. |

La arquitectura está desacoplada: el frontend solo se comunica con el backend mediante REST (`/api/v1`), protegido con JWT.

## Requisitos

- Node.js **24 LTS** o superior (ver [.nvmrc](.nvmrc)).
- npm 11 o superior.

## Puesta en marcha

```powershell
npm run setup          # instala dependencias de backend y frontend
npm run dev:backend    # API en http://localhost:3000
npm run dev:frontend   # aplicación en http://localhost:4200
```

El frontend usa un proxy de desarrollo (`frontend/proxy.conf.json`) que redirige `/api` al backend.

Para el backend, consulta [backend/.env.example](backend/.env.example) y define esas variables en tu entorno antes de arrancar (en PowerShell: `$env:JWT_SECRET = "..."`). El backend no lee ficheros `.env` por sí mismo. Nunca subas valores reales al repositorio.

## Scripts de la raíz

| Script | Qué hace |
|--------|----------|
| `setup` | Instala dependencias con `npm ci` en `backend/` y `frontend/`. |
| `build` | Compila backend (`nest build`) y frontend (`ng build`). |
| `test` | Ejecuta los tests de backend y frontend. |
| `audit:deps` | `npm audit --audit-level=high` en ambos proyectos. |
| `scan:secrets` | Busca secretos en el repositorio con secretlint. |
| `verify` | Encadena `scan:secrets`, `test`, `build` y `audit:deps`. Es la comprobación previa a cualquier entrega. |

## Calidad y seguridad

- **Cobertura objetivo del 80 %** en tests unitarios y de integración. Ambos proyectos lo aplican como umbral en su configuración de cobertura.
- **Sin vulnerabilidades críticas o altas** en dependencias (`audit:deps`).
- **Sin secretos en el código** (`scan:secrets`).
- **Versiones con soporte vigente** (Node 24, Angular 22, NestJS 12).
- **OWASP Top 10** aplicado: validación de entrada, cabeceras con helmet, rate limit en el login, errores sin detalles internos y JWT con emisor, audiencia y expiración.
- **Accesibilidad WCAG 2.2 AA** y diseño responsive de 320 px a escritorio.

## Documentación

- Especificación: [specs/001-login-billetera/spec.md](specs/001-login-billetera/spec.md)
- Plan y arquitectura: [specs/001-login-billetera/plan.md](specs/001-login-billetera/plan.md)
- Contratos de API: [specs/001-login-billetera/contracts/auth-api.md](specs/001-login-billetera/contracts/auth-api.md)
- Guía rápida: [specs/001-login-billetera/quickstart.md](specs/001-login-billetera/quickstart.md)
