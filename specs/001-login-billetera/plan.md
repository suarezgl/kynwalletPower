# Implementation Plan: Pantalla de Inicio de Sesión de KynWallet

**Branch**: `001-login-billetera` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-login-billetera/spec.md`

**Constitución aplicable**: v1.1.0 (Principios I–VIII, secciones 9 y 10, gobernanza 11)

## Summary

Pantalla de inicio de sesión de KynWallet (correo y contraseña), fiel al diseño de Figma
(`01 · Login`, nodo `2:2`) y a la imagen adjunta, con validación del formulario según las
recomendaciones actuales de seguridad y mensajes de error visibles.

La arquitectura queda **desacoplada** en dos proyectos independientes que se comunican
exclusivamente por una API REST versionada:

- **Frontend** (`frontend/`): Angular 22 (LTS), componentes standalone, signals y formularios
  reactivos. Consume la API mediante un adaptador HTTP que implementa el puerto `AuthGateway`.
- **Backend** (`backend/`): NestJS 12 sobre Node.js 24 LTS. Expone las APIs **simuladas** del
  dominio *Party Authentication* (BIAN), con JWT, validación de entrada, límite de solicitudes y
  respuestas de error conformes a RFC 9457 (problem details).

Ambos proyectos siguen Clean Architecture (dominio → aplicación → infraestructura/presentación),
TDD y cobertura ≥ 80 %. El contrato REST en [contracts/auth-api.md](./contracts/auth-api.md) es la
única fuente de verdad entre capas (Principio VII).

## Technical Context

**Language/Version**: TypeScript 5.x en modo `strict` (ambos proyectos); **Node.js 24 LTS**
(`engines` y `.nvmrc`: `24`), por encima de la 22 pedida como mínimo

**Frontend — Primary Dependencies**: Angular 22 (`@angular/core`, `@angular/forms`,
`@angular/common/http`, `@angular/router` solo si se requiere navegación), RxJS,
`@fontsource-variable/inter`. Sin librerías de UI ni de formularios de terceros (Principio IV).

**Backend — Primary Dependencies**: NestJS 12 (`@nestjs/common`, `@nestjs/core`,
`@nestjs/platform-express`), `@nestjs/jwt`, `@nestjs/throttler`, `helmet`,
`class-validator`, `class-transformer`, `reflect-metadata`, `rxjs`. Hash de contraseñas con
`crypto.scrypt` de Node (sin dependencia adicional). La configuración se valida desde
`process.env` sin `@nestjs/config`.

**Storage**: N/A. Sin persistencia. Las cuentas de demostración llegan por configuración
(variable de entorno con hashes; ver R4). El frontend guarda el token solo en memoria.

**Testing**: Frontend y backend: Vitest (ver desviación D2 más abajo). Frontend con TestBed,
`axe-core` mediante un helper propio y `@vitest/coverage-v8`. Backend con pruebas unitarias y
de integración, y cobertura con `@vitest/coverage-v8`.

**Desviaciones de la planificación inicial**:
- **D1 · Router**: el frontend no usa `@angular/router`. `App` alterna entre el login y la
  bienvenida según la señal de sesión (`SessionStore`). Con una sola pantalla de login y una
  de bienvenida, un router añadía complejidad sin beneficio (KISS).
- **D2 · Vitest en lugar de Jest**: aprobado por el usuario durante la implementación. Vitest es
  el runner por defecto de Angular CLI y se usa también en el backend para tener un único
  runner en el monorepo.

**Target Platform**: Frontend en navegadores modernos (las dos últimas versiones de Chrome,
Firefox, Safari y Edge) de 320 px a escritorio. Backend en Node.js 24 LTS, Linux/Windows.

**Project Type**: Web application desacoplada (SPA Angular + API REST NestJS)

**Performance Goals**: toda respuesta de API < 5 s (Constitución 8.1); el intento de login
responde en ≤ 2 s (SC-002) con una latencia simulada de 1000 ms configurable.

**Constraints**: WCAG 2.1 AA (10.4); sin scroll horizontal desde 320 px; JWT en todas las APIs
excepto el inicio de sesión (7.4); OWASP Top 10:2025; sin credenciales en el código (5.3).

**Scale/Scope**: 1 pantalla con 2 vistas (login y bienvenida), 2 endpoints REST, ~10
componentes de UI, 2 proyectos.

## Constitution Check

*GATE: Debe cumplirse antes de la Fase 0 y re-verificarse tras la Fase 1.*

| Principio / Regla (v1.1.0) | Cumplimiento en el diseño | Estado |
|---|---|---|
| I. TDD (1.1–1.4) | Cada historia inicia con pruebas en rojo: dominio y validaciones → caso de uso → adaptador HTTP → componentes → endpoints NestJS. Pruebas nombradas con IDs (US/FR/SC) | ✅ |
| II. SOLID (2.1–2.5) | Un caso de uso por operación; `AuthGateway` como abstracción (DIP) con dos implementaciones intercambiables (HTTP y simulada en pruebas); `ValidationPipe` y filtros como piezas separadas | ✅ |
| III. Clean Architecture (3.1–3.5) | Frontend: `domain/`, `application/`, `infrastructure/http/`, `presentation/`. Backend: `domain/`, `application/`, `infrastructure/`, `interfaces/http/`. Reglas de dependencia verificadas con ESLint (`no-restricted-imports`) en el frontend y con una prueba de arquitectura en el backend | ✅ |
| IV. DRY/KISS/YAGNI (4.1–4.4) | Reglas de validación en un único módulo por proyecto (espejo deliberado en backend por defensa en profundidad, documentado); sin NgRx, sin router adicional, sin E2E; sin refresh tokens ni persistencia | ✅ |
| V. Seguridad por diseño (5.1–5.6) | Validación en frontend y backend (5.1); JWT en APIs protegidas (5.2); secretos y hashes solo por variables de entorno validadas al arranque (5.3); mensaje genérico y tiempo constante (5.5); `secretlint` y análisis estático (5.6) | ✅ con desviación de origen de cuentas (ver Complexity Tracking) |
| VI. BRD/ARD/ADR (6.1–6.5) | No hay BRD, ARD ni ADR para esta funcionalidad (supuesto de la spec). Se documenta la decisión arquitectónica desacoplada en [research.md R1](./research.md) como ADR candidato | ✅ N/A |
| VII. Servicios REST, BIAN, JWT (7.1–7.5) | Capas separadas en ambos proyectos (7.1); toda comunicación por REST (7.2); dominio BIAN *Party Authentication* con operaciones Initiate y Retrieve y contrato versionado `/api/v1` (7.3); JWT con firma HS256 verificada, emisor, audiencia y expiración (7.4); controladores sin reglas de negocio (7.5) | ✅ |
| VIII. Rendimiento (8.1–8.3) | Latencia simulada de 1000 ms, validada con máximo 4000 ms en configuración; prueba de integración que mide < 5 s por endpoint (8.2); la operación es corta y síncrona, por lo que 8.3 no aplica | ✅ |
| 9.1 Dependencias permitidas | Licencias MIT/ISC/Apache-2.0/BSD/OFL; mantenimiento activo; Angular 22 (soporte LTS hasta 2028) y NestJS 12 (activo); Node.js 24 LTS | ✅ |
| 9.2 Versiones fijadas | Versiones exactas o con rango acotado y `package-lock.json` versionado en ambos proyectos | ✅ |
| 9.3 Análisis automático | `npm audit --audit-level=high` y verificación de licencias en `verify` de cada proyecto; un hallazgo crítico bloquea | ✅ |
| 9.4 Justificación de dependencias | Cada dependencia se justifica en research.md (R1, R8). Se evita `vitest-axe` por falta de mantenimiento | ✅ |
| 9.5 Sin dependencias obsoletas | Se usan solo versiones con soporte vigente; se elimina cualquier plantilla no usada | ✅ |
| 10.1 Pruebas y cobertura ≥ 80 % | Unitarias e integración en ambos proyectos; umbral 80 % en líneas, ramas y funciones | ✅ |
| 10.2 Convenciones | ESLint (angular-eslint en frontend, typescript-eslint en backend), Prettier y `tsc --noEmit` | ✅ |
| 10.3 Documentación y README | `README.md` en la raíz, en `frontend/` y en `backend/`, con instalación, ejecución, pruebas y configuración; contratos documentados | ✅ |
| 10.4 Accesibilidad y resoluciones | WCAG 2.1 AA con pruebas axe; diseño adaptable verificado en 320, 768, 1024 y 1440 px. Desviación de colores de Figma pendiente de aprobación (Complexity Tracking) | ⚠️ aprobación pendiente |
| 10.5 Reutilización | Componentes compartidos del frontend (`TextField`, `PasswordField`, `Button`, etc.) modulares y documentados | ✅ |
| 10.6 Sistema de diseño | Tokens de Figma replicados con los mismos nombres; tokens accesibles derivados solo donde el original no cumple | ⚠️ aprobación pendiente |
| 10.7 Observabilidad | Logs estructurados en backend (JSON) sin contraseñas ni tokens; el frontend no registra datos de formulario | ✅ |
| 11.2 Trazabilidad | Pruebas y tareas referencian FR/US/SC; contrato referencia FR | ✅ |
| 11.4 Controles de cumplimiento | Script `verify` en cada proyecto con lint, typecheck, test con cobertura, build, auditoría y licencias; `secretlint` en la raíz | ✅ |
| 11.5 Verificación en planificación | Este cuadro, más la tabla de mitigaciones OWASP de abajo | ✅ |

**Mapa OWASP Top 10:2025** (requisito del usuario, aplicable a la pantalla y a sus APIs):

| Riesgo | Mitigación en el diseño |
|---|---|
| A01 Control de acceso roto | Recursos protegidos con guard JWT global; `GET` de sesión exige token; ningún dato de otra cuenta es accesible |
| A02 Configuración de seguridad incorrecta | `helmet` (cabeceras), CORS deshabilitado con proxy de mismo origen en desarrollo, sin stack traces en respuestas, configuración validada al arranque, `X-Powered-By` desactivado |
| A03 Fallas en la cadena de suministro | Versiones fijadas, `package-lock.json`, `npm audit` y verificación de licencias bloqueantes; dependencias mínimas |
| A04 Fallas criptográficas | JWT HS256 con secreto ≥ 32 caracteres desde entorno; hashes con `scrypt` y sal aleatoria; comparación en tiempo constante; sin datos sensibles en URL |
| A05 Inyección | Validación estricta con `class-validator` (`whitelist`, `forbidNonWhitelisted`); sin SQL (no hay BD); Angular escapa la salida; sin `innerHTML` |
| A06 Diseño inseguro | Requisitos de seguridad en la spec (NIST 800-63B-4); límite de tasa por IP; respuesta genérica; tiempo de respuesta uniforme |
| A07 Fallas de autenticación | Mensaje genérico (FR-010); verificación de contraseña aunque el correo no exista; límite de 5 intentos por minuto por IP (429); contraseña sin recortar; token de vida corta (900 s) |
| A08 Fallas de integridad de software y datos | Validación de la firma y del algoritmo del JWT (pinned HS256); artefactos desde el lockfile; sin deserialización insegura de configuración |
| A09 Fallas de registro y alertas | Logs estructurados de intentos fallidos sin contraseña ni token, con IP y tiempo; 429 registrado |
| A10 Manejo excepcional de errores | Filtro global que devuelve problem+json genérico; el frontend trata cualquier error inesperado como `unavailable` sin revelar detalles |

**Resultado del gate**: APROBADO con dos desviaciones justificadas (origen de las cuentas de
demostración y colores accesibles) que requieren aprobación del responsable, y una acción previa
(inicializar git antes de integrar, Constitución 11.3).

**Re-check post-diseño (Fase 1)**: data-model, contrato REST y quickstart mantienen las mismas
conclusiones. No se añadieron capas ni dependencias más allá de las listadas.

## Project Structure

### Documentation (this feature)

```text
specs/001-login-billetera/
├── plan.md                  # Este archivo
├── research.md              # Fase 0: decisiones de versiones, arquitectura y seguridad
├── data-model.md            # Fase 1: entidades de frontend y backend
├── quickstart.md            # Fase 1: guía de ejecución y validación
├── contracts/
│   ├── auth-api.md          # Contrato REST (BIAN, JWT, problem details)
│   └── ui-login.md          # Contrato observable de la interfaz
├── checklists/
│   └── requirements.md
└── tasks.md                 # Fase 2 (/speckit-tasks): pendiente de regenerar
```

### Source Code (repository root)

```text
README.md                    # visión general, arranque de ambos proyectos
.nvmrc                       # 24
.secretlintrc.json           # análisis de secretos del repositorio

frontend/
├── README.md
├── package.json             # scripts: start, build, test, test:coverage, lint, typecheck, audit:deps, audit:licenses, verify
├── proxy.conf.json          # /api → http://localhost:3000 (desarrollo)
├── eslint.config.js         # angular-eslint + regla de dependencias entre capas
├── angular.json
├── src/
│   ├── main.ts              # raíz de composición: provee API_BASE_URL, interceptor y AuthGateway HTTP
│   ├── app/
│   │   ├── app.ts
│   │   ├── app.config.ts
│   │   ├── domain/
│   │   │   ├── auth.model.ts        # LoginCredentials, AuthResult, Party
│   │   │   ├── login-validation.ts  # validateCredentials, normalizeEmail (función pura)
│   │   │   └── messages.ts          # textos de error y aviso (fuente única)
│   │   ├── application/
│   │   │   ├── auth-gateway.port.ts # interfaz AuthGateway
│   │   │   └── authenticate.usecase.ts
│   │   ├── infrastructure/
│   │   │   ├── http-auth.gateway.ts       # adaptador REST → AuthResult
│   │   │   ├── auth-token.store.ts        # token solo en memoria
│   │   │   └── auth-token.interceptor.ts  # añade Bearer a rutas protegidas
│   │   └── presentation/
│   │       ├── shared/
│   │       │   ├── text-field/
│   │       │   ├── password-field/
│   │       │   ├── button/
│   │       │   ├── checkbox/
│   │       │   ├── social-button/
│   │       │   ├── divider/
│   │       │   └── alert/
│   │       ├── layout/brand-panel/
│   │       └── login/
│   │           ├── login-page.component.ts
│   │           ├── login-form.component.ts
│   │           ├── login-form.state.ts     # máquina de estados con signals
│   │           └── welcome-view.component.ts
│   ├── styles/
│   │   ├── tokens.css       # variables de Figma y tokens accesibles
│   │   └── global.css
│   └── assets/              # SVG exportados de Figma
└── src/**/*.spec.ts         # pruebas junto al código
    test-helpers/
    ├── a11y.ts              # expectNoA11yViolations (axe-core)
    └── fakes.ts             # AuthGateway falso para pruebas de componentes

backend/
├── README.md
├── package.json             # scripts: start:dev, build, test, test:cov, lint, typecheck, audit:deps, audit:licenses, hash-password, verify
├── .env.example             # variables con valores de ejemplo marcados como ficticios
├── nest-cli.json
├── tsconfig.json
├── eslint.config.mjs
├── src/
│   ├── main.ts              # arranque: helmet, ValidationPipe global, prefijo /api/v1
│   ├── app.module.ts        # raíz de composición
│   ├── config/
│   │   ├── env.validation.ts    # esquema de variables (JWT_SECRET ≥ 32, latencia ≤ 4000 ms)
│   │   └── app.config.ts
│   ├── domain/
│   │   ├── party.ts             # Party (titular)
│   │   ├── credentials.ts       # reglas de validación espejo del frontend
│   │   └── password-hash.ts     # verificación scrypt en tiempo constante
│   ├── application/
│   │   ├── initiate-session.usecase.ts   # BIAN: Initiate
│   │   ├── retrieve-session.usecase.ts   # BIAN: Retrieve
│   │   └── ports/
│   │       ├── party-directory.port.ts
│   │       └── token-issuer.port.ts
│   ├── infrastructure/
│   │   ├── env-party-directory.ts       # lee DEMO_ACCOUNTS (hashes) desde entorno
│   │   ├── jwt-token-issuer.ts          # @nestjs/jwt, HS256, iss/aud/exp
│   │   └── simulated-latency.ts        # espera configurable
│   └── interfaces/http/
│       ├── party-authentication.controller.ts  # DTO → caso de uso → DTO
│       ├── dto/
│       ├── guards/jwt-auth.guard.ts
│       └── filters/problem-details.filter.ts
└── test/
    ├── unit/                # dominio y casos de uso
    └── integration/         # supertest: contrato REST, JWT, límite de tasa, tiempo < 5 s
```

**Structure Decision**: dos proyectos hermanos en la raíz del repositorio (`frontend/` y
`backend/`) con la misma regla de capas en cada uno, comunicados solo por el contrato REST de
[contracts/auth-api.md](./contracts/auth-api.md). Las pruebas se ubican junto al código fuente
(frontend) o en `test/` (backend). No hay paquete compartido de tipos: el contrato se duplica
deliberadamente en DTOs de cada lado para mantener el desacoplamiento (KISS); si la duplicación
crece, se revisará en una enmienda.

## Complexity Tracking

| Violación / desviación | Por qué es necesaria | Alternativa más simple rechazada porque |
|---|---|---|
| Dos proyectos (frontend y backend) | El usuario pidió arquitectura desacoplada y backend NestJS (Principios III y VII) | Un solo proyecto con API embebida acopla despliegue y ciclo de vida |
| Colores de texto, botón y bordes distintos a los de Figma (`--brand-700`, `--neutral-600`, `--neutral-border`) | Los tokens originales no alcanzan WCAG AA (ver research R3); 10.4 es obligatorio. **Requiere aprobación del responsable de diseño (10.6).** | Reproducir los colores exactos incumple 10.4 y SC-005 |
| Cuentas de demostración en variable de entorno (con hashes) en vez de "predefinidas en el código", como pidió el usuario | 5.3 y FR-011 prohíben credenciales en código o archivos versionados. Los hashes evitan contraseñas en claro incluso en el entorno | Un arreglo en el código solo es viable con excepción aprobada y temporal (6.4). Si se aprueba, se cambia solo `env-party-directory.ts` |

## Decisiones pendientes para el usuario

- Confirmar **Node.js 24 LTS** (recomendado) o **Node.js 26** (Current) como versión objetivo.
- Confirmar el nombre del dominio de servicio BIAN (*Party Authentication*) frente a la
  versión vigente del catálogo BIAN.
- Aprobar las dos desviaciones de la tabla de Complexity Tracking.
- `tasks.md` está desactualizado (era del diseño React); se debe regenerar con `/speckit-tasks`.
