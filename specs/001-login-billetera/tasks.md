# Tareas: Formulario de inicio de sesión (Login billetera)

**Rama / Feature**: `001-login-billetera`
**Entradas**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md), [contracts/auth-api.md](./contracts/auth-api.md), [contracts/ui-login.md](./contracts/ui-login.md), [quickstart.md](./quickstart.md)

**Organización**: las tareas se agrupan por historia de usuario para permitir implementación y prueba independientes.

**TDD obligatorio (Constitución, Principio I)**: en cada fase, las tareas de prueba (`[TEST]`) se ejecutan y fallan antes de las tareas de implementación correspondientes.

## Formato

`- [ ] TNNN [P?] [USn?] Descripción con ruta de archivo`

- `[P]`: se puede ejecutar en paralelo (archivos distintos, sin dependencias pendientes).
- `[USn]`: historia de usuario a la que pertenece la tarea (solo en fases de historia).
- `[TEST]`: tarea de prueba que debe fallar antes de implementar (TDD).

## Rutas base

- Frontend: `frontend/` (Angular 22 LTS, Node 24 LTS)
- Backend: `backend/` (NestJS 12, API mock)
- Raíz: `README.md`, `.nvmrc`, `.env.example`, `.secretlintrc.json`

## Bloqueadores pendientes de decisión del usuario

- **B1 (Node 24 vs 26)**: la plan usa Node 24 LTS. Las tareas T001 y T002 asumen 24. Si se elige 26, actualizar `.nvmrc` y `engines`.
- **B2 (desviación de color)**: los tokens `--brand-700`, `--neutral-600` y `--neutral-border` son derivaciones de accesibilidad. T018 queda marcada como pendiente de aprobación. Se puede implementar con los colores del diseño, pero el criterio WCAG AA no se cumpliría.
- **B3 (cuentas demo)**: la plan propone `DEMO_ACCOUNTS` por variable de entorno con hashes scrypt, no en código. T013 y T014 siguen esa decisión. Requiere aprobación.
- **B4 (código legado `src/`)**: el código React de `src/` no se elimina en este listado. La tarea T119 solo aplica si el usuario lo aprueba.

---

## Fase 1: Setup (infraestructura compartida)

**Objetivo**: crear la estructura del monorepo, herramientas de calidad y scripts de verificación.

- [ ] T001 Crear `.nvmrc` en la raíz con el valor `24` (Node.js 24 LTS)
- [X] T002 Actualizar `engines` a `"node": ">=24"` en `package.json` (raíz) sin alterar scripts existentes de la app legada
- [ ] T003 Generar el proyecto Angular 22 con `npx @angular/cli@22 new kynwallet-frontend --directory frontend --style css --routing false --ssr false` en `frontend/`
- [ ] T004 Generar el proyecto NestJS 12 con `npx @nestjs/cli@12 new kynwallet-backend --directory backend --package-manager npm --skip-git` en `backend/`
- [ ] T005 [P] Configurar `frontend/tsconfig.json` con `strict: true`, `noImplicitReturns` y `noPropertyAccessFromIndexSignature`
- [ ] T006 [P] Configurar `backend/tsconfig.json` con `strict: true` y módulos ESM (research R1)
- [ ] T007 [P] Añadir ESLint de reglas de capas en `frontend/eslint.config.mjs` (prohibir importar `presentation` desde `domain`, `infrastructure` desde `domain`)
- [ ] T008 [P] Añadir ESLint de reglas de capas en `backend/eslint.config.mjs` (prohibir importar `infrastructure` desde `domain` y `application`)
- [ ] T009 [P] Configurar Prettier en `frontend/.prettierrc` y `backend/.prettierrc` con la misma configuración
- [ ] T010 [P] Instalar `@vitest/coverage-v8` y configurar umbral de cobertura 80 % (líneas, funciones, ramas, sentencias) en `frontend/vitest.config.ts`
- [X] T011 [P] Configurar umbral de cobertura 80 % en el backend. Hecho en `backend/vitest.config.ts` (`coverage.thresholds`), no en `jest.config.ts`, porque el runner es Vitest (desviación D2 en `plan.md`)
- [ ] T012 [P] Crear `frontend/proxy.conf.json` para redirigir `/api` a `http://localhost:3000` y registrarlo en `frontend/angular.json`
- [X] T013 [P] Crear `backend/.env.example` con valores ficticios para `PORT`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_EXPIRES_IN_SECONDS`, `SIMULATED_LATENCY_MS`, `DEMO_ACCOUNTS` (sin secretos reales). Ver data-model.md, sección "Configuración"
- [ ] T014 Actualizar `.gitignore` en la raíz para ignorar `.env`, `frontend/dist/`, `backend/dist/`, `coverage/` y `node_modules/` de ambos proyectos
- [X] T015 Instalar `secretlint` y `@secretlint/secretlint-rule-preset-recommend` en la raíz, con configuración en `.secretlintrc.json` (research R8)
- [ ] T016 Añadir scripts `audit:deps` (`npm audit --audit-level=high`), `audit:licenses` (`license-checker-rseidelsohn` con lista blanca) y `scan:secrets` en la raíz y en cada proyecto. Parcial: en la raíz hay `audit:deps` y `scan:secrets`; falta `audit:licenses` y los scripts por proyecto
- [ ] T017 Añadir script `verify` en `frontend/package.json` y `backend/package.json` que ejecute lint, formato, tests con cobertura, `audit:deps` y `audit:licenses`

---

## Fase 2: Foundational (prerrequisitos bloqueantes)

**Objetivo**: base de dominio, seguridad y composición que todas las historias necesitan. Ninguna historia puede empezar antes de completar esta fase.

### Backend: pruebas primero (TDD)

- [ ] T018 [TEST] Escribir prueba unitaria de validación de configuración de entorno en `backend/test/unit/config/env.spec.ts`: rechaza `JWT_SECRET` menor de 32 caracteres, `SIMULATED_LATENCY_MS` fuera de 0–4000, `JWT_EXPIRES_IN_SECONDS` mayor de 900, y `PORT` por defecto 3000
- [ ] T019 [P] [TEST] Escribir prueba unitaria de reglas de credenciales en `backend/test/unit/domain/credentials.spec.ts`: email `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$` con máximo 254 caracteres y contraseña entre 15 y 128 caracteres (data-model.md, LoginRequest)
- [ ] T020 [P] [TEST] Escribir prueba unitaria de hash scrypt en `backend/test/unit/infrastructure/password-hash.spec.ts`: verificación con `timingSafeEqual`, formato `scrypt$N$r$p$salt$hash` y rechazo de hashes mal formados
- [ ] T021 [P] [TEST] Escribir prueba de arquitectura de capas en `backend/test/unit/architecture.spec.ts` que falle si `domain` importa de `application`, `infrastructure` o `interfaces`
- [ ] T022 [P] [TEST] Escribir prueba unitaria de `EnvPartyDirectory` en `backend/test/unit/infrastructure/env-party-directory.spec.ts`: falla al arrancar con emails duplicados o hashes inválidos en `DEMO_ACCOUNTS`

### Backend: implementación base

- [ ] T023 Implementar carga y validación de configuración con `@nestjs/config` y esquema en `backend/src/config/env.validation.ts`
- [ ] T024 [P] Implementar entidad `Party` y tipo `DemoAccount` en `backend/src/domain/party/party.ts` (data-model.md)
- [ ] T025 [P] Implementar reglas de credenciales y normalización de email (trim y minúsculas) en `backend/src/domain/credentials/credentials.ts`
- [ ] T026 [P] Implementar `AuthOutcome` como tipo de resultado (éxito, credenciales inválidas, no disponible) en `backend/src/domain/auth/auth-outcome.ts`
- [ ] T027 Definir el puerto `PartyDirectory` en `backend/src/application/ports/party-directory.port.ts`
- [ ] T028 Definir el puerto `PasswordVerifier` en `backend/src/application/ports/password-verifier.port.ts`
- [ ] T029 Definir el puerto `TokenIssuer` en `backend/src/application/ports/token-issuer.port.ts`
- [ ] T030 Implementar `password-hash.ts` con `crypto.scrypt` y `timingSafeEqual` en `backend/src/infrastructure/security/password-hash.ts`
- [ ] T031 Implementar `EnvPartyDirectory` que lea `DEMO_ACCOUNTS`, valide duplicados y formato de hash al arrancar en `backend/src/infrastructure/persistence/env-party-directory.ts`
- [ ] T032 Implementar `JwtTokenIssuer` con HS256, `iss=kynwallet-backend`, `aud=kynwallet-web`, `exp=900s` y `sub` opaco en `backend/src/infrastructure/security/jwt-token-issuer.ts`
- [ ] T033 Implementar latencia simulada acotada a 0–4000 ms (defecto 1000) en `backend/src/infrastructure/simulation/simulated-latency.ts`
- [ ] T034 Implementar guard global de JWT y decorador `@Public()` en `backend/src/interfaces/http/security/jwt-auth.guard.ts` (solo `POST /sessions` es público)
- [ ] T035 Configurar `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true` en `backend/src/main.ts`
- [ ] T036 Configurar `helmet` y límite de 5 solicitudes por minuto por IP con `@nestjs/throttler` en `backend/src/app.module.ts`
- [ ] T037 Implementar filtro de excepciones RFC 9457 (`application/problem+json`) en `backend/src/interfaces/http/filters/problem-details.filter.ts`
- [ ] T038 Crear script `hash-password` en `backend/scripts/hash-password.ts` para generar hashes scrypt de cuentas demo (sin persistir contraseñas)

### Frontend: pruebas primero (TDD)

- [ ] T039 [TEST] Escribir prueba unitaria de validación de formulario en `frontend/src/app/domain/login/login-validation.spec.ts`: email obligatorio y válido, contraseña obligatoria y entre 15 y 128 caracteres
- [ ] T040 [P] [TEST] Escribir prueba unitaria de mensajes de error en `frontend/src/app/domain/login/messages.spec.ts` con textos exactos de contract ui-login.md
- [ ] T041 [P] [TEST] Escribir prueba unitaria de `AuthTokenStore` en `frontend/src/app/infrastructure/auth/auth-token-store.spec.ts`: token solo en memoria, sin `localStorage` ni `sessionStorage`
- [ ] T042 [P] [TEST] Escribir prueba unitaria del interceptor JWT en `frontend/src/app/infrastructure/http/auth.interceptor.spec.ts`: agrega `Authorization: Bearer` solo a `/api/v1/party-authentication/sessions/current`

### Frontend: implementación base

- [ ] T043 Implementar reglas de validación y regex en `frontend/src/app/domain/login/login-validation.ts`
- [ ] T044 [P] Implementar catálogo de mensajes en `frontend/src/app/domain/login/messages.ts`
- [ ] T045 Definir puerto `AuthGateway` y tipos `LoginCredentials` y `AuthResult` en `frontend/src/app/application/ports/auth-gateway.ts` (data-model.md)
- [ ] T046 Implementar `AuthTokenStore` basado en señales en `frontend/src/app/infrastructure/auth/auth-token-store.ts`
- [ ] T047 Implementar interceptor JWT en `frontend/src/app/infrastructure/http/auth.interceptor.ts`
- [ ] T048 [P] Implementar tokens de diseño CSS en `frontend/src/styles/tokens.css` con valores Figma (`--brand-500 #ff6b3d`, `--brand-600 #ef5226`) y derivaciones de accesibilidad (`--brand-700 #d04721`, `--neutral-600 #73748b`, `--neutral-border #92949c`). Marcar derivaciones como pendientes de aprobación (B2)
- [ ] T049 [P] Configurar tipografía Inter con `@fontsource-variable/inter` en `frontend/src/styles/global.css`
- [ ] T050 Implementar composición raíz con `API_BASE_URL` e interceptor en `frontend/src/app/app.config.ts` y `frontend/src/main.ts`
- [ ] T051 Implementar layout compartido con puntos de quiebre de R10 (320–767, 768–1023, ≥1024; panel de marca oculto por debajo de 960 px) en `frontend/src/app/presentation/layout/auth-layout.component.ts`

**Punto de control**: base de dominio, seguridad y layout lista. Las historias pueden empezar.

---

## Fase 3: Historia de usuario 1 - Inicio de sesión exitoso (Prioridad: P1) 🎯 MVP

**Objetivo**: un usuario con credenciales válidas inicia sesión, ve la vista de bienvenida y puede cerrar sesión.

**Prueba independiente**: con `demo@kynwallet.test` y una contraseña válida de 15 o más caracteres, el formulario muestra "Cargando..." durante la latencia simulada, luego la bienvenida con el nombre y el botón "Cerrar sesión". Pulsar Enter envía el formulario. Cerrar sesión borra el token y vuelve al formulario.

### Pruebas US1 (TDD)

- [ ] T052 [P] [US1] [TEST] Escribir prueba unitaria del caso de uso `AuthenticateParty` en `backend/test/unit/application/authenticate-party.spec.ts`: éxito con credenciales válidas y normalización de email
- [ ] T053 [P] [US1] [TEST] Escribir prueba de contrato de `POST /api/v1/party-authentication/sessions` en `backend/test/integration/sessions.initiate.spec.ts` con respuesta 201 y `accessToken` (contracts/auth-api.md)
- [ ] T054 [P] [US1] [TEST] Escribir prueba de contrato de `GET /api/v1/party-authentication/sessions/current` en `backend/test/integration/sessions.retrieve.spec.ts`: 200 con JWT válido, 401 sin token y 401 con token expirado
- [ ] T055 [P] [US1] [TEST] Escribir prueba de componente del formulario en `frontend/src/app/presentation/login/login-form.component.spec.ts`: envío válido llama a `AuthGateway` y muestra estado de carga
- [ ] T056 [P] [US1] [TEST] Escribir prueba de componente: Enter envía el formulario y el botón está deshabilitado mientras carga (contracts/ui-login.md, #teclado)
- [ ] T057 [P] [US1] [TEST] Escribir prueba de componente de la vista de bienvenida en `frontend/src/app/presentation/welcome/welcome.component.spec.ts`: muestra nombre, mueve foco al encabezado y "Cerrar sesión" limpia estado
- [ ] T058 [P] [US1] [TEST] Escribir prueba unitaria de normalización de email (trim y minúsculas) en `frontend/src/app/domain/login/login-validation.spec.ts`

### Implementación US1 - Backend

- [ ] T059 [US1] Implementar caso de uso `AuthenticateParty` en `backend/src/application/authenticate-party.use-case.ts`
- [ ] T060 [US1] Implementar caso de uso `RetrieveCurrentParty` en `backend/src/application/retrieve-current-party.use-case.ts`
- [ ] T061 [US1] Implementar controlador `POST /sessions` (Initiate, público) y DTO con `class-validator` en `backend/src/interfaces/http/party-authentication/sessions.controller.ts`
- [ ] T062 [US1] Implementar controlador `GET /sessions/current` (Retrieve, protegido) en `backend/src/interfaces/http/party-authentication/sessions.controller.ts`
- [ ] T063 [US1] Registrar módulo `PartyAuthenticationModule` con sus puertos e implementaciones en `backend/src/party-authentication.module.ts`

### Implementación US1 - Frontend

- [ ] T064 [US1] Implementar adaptador HTTP de `AuthGateway` con `HttpClient` en `frontend/src/app/infrastructure/auth/http-auth.gateway.ts`
- [ ] T065 [US1] Implementar caso de uso `LoginUseCase` (valida, llama al puerto, guarda el token) en `frontend/src/app/application/login.use-case.ts`
- [ ] T066 [US1] Implementar formulario reactivo con campos de email y contraseña, estado con señales y OnPush en `frontend/src/app/presentation/login/login-form.component.ts`
- [ ] T067 [US1] Implementar vista de bienvenida con nombre, foco en encabezado y botón "Cerrar sesión" en `frontend/src/app/presentation/welcome/welcome.component.ts`
- [ ] T068 [US1] Implementar estado de carga con botón deshabilitado y `aria-busy` en `frontend/src/app/presentation/login/login-form.component.ts`
- [ ] T069 [US1] Implementar cierre de sesión que limpia `AuthTokenStore` y regresa al formulario en `frontend/src/app/application/logout.use-case.ts`
- [X] T070 [US1] Conectar enrutamiento de formulario y bienvenida según estado de sesión. Resuelto sin router: `App` alterna según `SessionStore`, desviación D1 en `plan.md`

**Punto de control US1**: el flujo feliz funciona de extremo a extremo. Validar con quickstart.md, escenarios 1, 2 y 3.

---

## Fase 4: Historia de usuario 2 - Retroalimentación ante credenciales inválidas (Prioridad: P1)

**Objetivo**: credenciales incorrectas muestran un mensaje genérico, conservan el correo y limpian la contraseña.

**Prueba independiente**: con contraseña incorrecta aparece "Correo o contraseña incorrectos" en el resumen del formulario. El correo se mantiene, la contraseña se limpia y el foco va al campo de contraseña. Al editar un campo, el error desaparece.

### Pruebas US2 (TDD)

- [ ] T071 [P] [US2] [TEST] Escribir prueba de contrato: `POST /sessions` devuelve 401 con mensaje genérico igual para correo inexistente y contraseña incorrecta en `backend/test/integration/sessions.invalid.spec.ts` (regla C1)
- [ ] T072 [P] [US2] [TEST] Escribir prueba unitaria de equiparación de tiempo: se verifica contra hash señuelo cuando el correo no existe, en `backend/test/unit/application/authenticate-party.spec.ts`
- [ ] T073 [P] [US2] [TEST] Escribir prueba de contrato: `429` y `503` en `POST /sessions` se asignan a `unavailable` en `frontend/src/app/infrastructure/auth/http-auth.gateway.spec.ts`
- [ ] T074 [P] [US2] [TEST] Escribir prueba de tiempo de espera de 4500 ms en `frontend/src/app/infrastructure/auth/http-auth.gateway.spec.ts` (regla C5)
- [ ] T075 [P] [US2] [TEST] Escribir prueba de componente: tras 401, se muestra el error genérico, se conserva el correo, se limpia la contraseña y el foco pasa a contraseña (contracts/ui-login.md)
- [ ] T076 [P] [US2] [TEST] Escribir prueba de componente: editar un campo limpia `authError`, en `frontend/src/app/presentation/login/login-form.component.spec.ts`

### Implementación US2 - Backend

- [ ] T077 [US2] Implementar respuesta 401 genérica (RFC 9457) para credenciales inválidas en `backend/src/interfaces/http/party-authentication/sessions.controller.ts`
- [ ] T078 [US2] Implementar comparación contra hash señuelo cuando el correo no existe en `backend/src/application/authenticate-party.use-case.ts` (regla C1)
- [ ] T079 [US2] Asignar límite de 5 solicitudes por minuto a `POST /sessions` con respuesta 429 en `backend/src/interfaces/http/party-authentication/sessions.controller.ts`

### Implementación US2 - Frontend

- [ ] T080 [US2] Mapear 400, 429, 503, 5xx, error de red y tiempo de espera a `unavailable` en `frontend/src/app/infrastructure/auth/http-auth.gateway.ts`
- [ ] T081 [US2] Implementar timeout de 4500 ms con `timeout` de RxJS en `frontend/src/app/infrastructure/auth/http-auth.gateway.ts`
- [ ] T082 [US2] Mostrar error genérico en el resumen y limpiar `authError` al editar un campo en `frontend/src/app/presentation/login/login-form.component.ts`
- [ ] T083 [US2] Conservar correo, limpiar contraseña y mover foco a contraseña tras 401 en `frontend/src/app/presentation/login/login-form.component.ts`

**Punto de control US2**: el MVP (US1 + US2) queda completo. Validar con quickstart.md, escenarios 4 y 5.

---

## Fase 5: Historia de usuario 3 - Validación de campos (Prioridad: P2)

**Objetivo**: los errores de campo aparecen en blur y al enviar, con resumen accesible que enlaza a cada campo.

**Prueba independiente**: enviar vacío muestra errores de ambos campos, con resumen en la parte superior. Cada enlace del resumen lleva al campo. Al corregir un error, desaparece. Los lectores de pantalla anuncian los errores.

### Pruebas US3 (TDD)

- [ ] T084 [P] [US3] [TEST] Escribir prueba de componente: validación en blur muestra error de email inválido y de contraseña menor a 15 en `frontend/src/app/presentation/login/login-form.component.spec.ts`
- [ ] T085 [P] [US3] [TEST] Escribir prueba de componente: enviar con errores no llama a `AuthGateway` (FR-006)
- [ ] T086 [P] [US3] [TEST] Escribir prueba de componente: resumen de errores con enlaces a cada campo y foco en el primer error (FR-005)
- [ ] T087 [P] [US3] [TEST] Escribir prueba de accesibilidad con axe-core en `frontend/src/app/presentation/login/login-form.a11y.spec.ts`: `aria-describedby` y `aria-invalid` presentes en estado de error
- [ ] T088 [P] [US3] [TEST] Escribir prueba de componente: el error de un campo desaparece al corregirlo, en `frontend/src/app/presentation/login/login-form.component.spec.ts`

### Implementación US3 - Frontend

- [ ] T089 [US3] Implementar validación al perder foco y al enviar en `frontend/src/app/presentation/login/login-form.component.ts`
- [ ] T090 [US3] Implementar componente de resumen de errores con enlaces a campos en `frontend/src/app/presentation/login/form-error-summary.component.ts`
- [ ] T091 [US3] Implementar `aria-describedby`, `aria-invalid` y región `aria-live` para anuncios en `frontend/src/app/presentation/login/login-form.component.ts`
- [ ] T092 [US3] Implementar enfoque automático en el primer campo con error en `frontend/src/app/presentation/login/login-form.component.ts`

**Punto de control US3**: validación completa y accesible. Validar con quickstart.md, escenarios 6, 7 y 8.

---

## Fase 6: Historia de usuario 4 - Mostrar u ocultar contraseña (Prioridad: P3)

**Objetivo**: un botón permite ver u ocultar la contraseña, usable con teclado y lector de pantalla.

**Prueba independiente**: el botón alterna el tipo del campo entre `password` y `text`, con `aria-pressed` correcto y etiqueta accesible.

### Pruebas US4 (TDD)

- [ ] T093 [P] [US4] [TEST] Escribir prueba de componente del botón de mostrar contraseña en `frontend/src/app/presentation/login/password-field.component.spec.ts`: alterna tipo y `aria-pressed`
- [ ] T094 [P] [US4] [TEST] Escribir prueba de teclado: el botón recibe foco con Tab y se activa con Espacio y Enter, en `frontend/src/app/presentation/login/password-field.component.spec.ts`

### Implementación US4 - Frontend

- [ ] T095 [US4] Implementar componente `PasswordFieldComponent` con alternancia de visibilidad en `frontend/src/app/presentation/login/password-field.component.ts`
- [ ] T096 [US4] Integrar `PasswordFieldComponent` en el formulario de inicio de sesión en `frontend/src/app/presentation/login/login-form.component.ts`

**Punto de control US4**: validar con quickstart.md, escenario 9.

---

## Fase 7: Historia de usuario 5 - Elementos fuera de alcance (Prioridad: P3)

**Objetivo**: elementos no implementados informan al usuario sin romper el flujo.

**Prueba independiente**: "¿Olvidaste tu contraseña?", "Continuar con Google", "Continuar con Apple" y "Crear cuenta" muestran "Función no disponible en esta demostración". "Recordarme" cambia visualmente sin afectar la sesión.

### Pruebas US5 (TDD)

- [ ] T097 [P] [US5] [TEST] Escribir prueba de componente: los cuatro elementos fuera de alcance muestran el aviso "Función no disponible en esta demostración" en `frontend/src/app/presentation/login/out-of-scope.component.spec.ts`
- [ ] T098 [P] [US5] [TEST] Escribir prueba de componente: "Recordarme" alterna su estado visual sin llamar a `AuthGateway`, en `frontend/src/app/presentation/login/login-form.component.spec.ts`

### Implementación US5 - Frontend

- [ ] T099 [US5] Implementar aviso no disponible reutilizable en `frontend/src/app/presentation/login/out-of-scope.component.ts`
- [ ] T100 [US5] Integrar enlaces y botones fuera de alcance en `frontend/src/app/presentation/login/login-form.component.ts`
- [ ] T101 [US5] Implementar casilla "Recordarme" solo visual en `frontend/src/app/presentation/login/login-form.component.ts`

**Punto de control US5**: validar con quickstart.md, escenario 10.

---

## Fase N: Pulido y temas transversales

**Objetivo**: documentación, verificación completa, seguridad, accesibilidad y cumplimiento de criterios de éxito.

- [X] T102 [P] Escribir `README.md` raíz con objetivo, arquitectura, requisitos (Node 24) y comandos (documentación obligatoria, Constitución 10.3)
- [X] T103 [P] Escribir `frontend/README.md` con estructura por capas, scripts, pruebas y accesibilidad
- [X] T104 [P] Escribir `backend/README.md` con endpoints, variables de entorno, scripts y seguridad
- [ ] T105 [P] Verificar que `specs/001-login-billetera/quickstart.md` coincide con los scripts y rutas reales. Ajustar comandos si es necesario
- [ ] T106 Ejecutar `npm run verify` en `backend/` y confirmar cobertura de 80 % o más
- [ ] T107 Ejecutar `npm run verify` en `frontend/` y confirmar cobertura de 80 % o más
- [ ] T108 Ejecutar `audit:deps` y `audit:licenses` en ambos proyectos y confirmar cero vulnerabilidades críticas o altas sin remediación
- [ ] T109 Ejecutar `scan:secrets` en la raíz y confirmar que no hay secretos en el repositorio
- [ ] T110 Validar layout en las nueve resoluciones de SC-008 con la guía de quickstart.md, escenario 13
- [ ] T111 Validar contraste WCAG AA en todos los estados con axe-core y revisión manual de `--neutral-border` (B2)
- [ ] T112 Comparar visualmente con el diseño de Figma (SC-006) y registrar desviaciones en `specs/001-login-billetera/checklists/requirements.md`
- [ ] T113 Revisar medidas de seguridad OWASP Top 10:2025 contra la tabla de plan.md y documentar cumplimiento en `backend/README.md`
- [ ] T114 Verificar que las respuestas de la API cumplen el límite de 5 s (FR-021) y registrar tiempos en `specs/001-login-billetera/quickstart.md`
- [ ] T115 Verificar que ningún código de producción contiene credenciales ni contraseñas en claro (FR-011)
- [ ] T116 Verificar que el token JWT no se guarda en `localStorage` ni `sessionStorage` (regla C6)
- [ ] T117 Revisar trazabilidad FR/SC contra tests y registrarla en `specs/001-login-billetera/checklists/requirements.md`
- [ ] T118 Ejecutar el escenario completo de quickstart.md (escenarios 1 a 14) y registrar resultados
- [X] T119 Eliminar el código legado de `src/` (aprobado por el usuario, B4) y limpiar referencias en `README.md` raíz

---

## Dependencias

### Orden de finalización de historias

```text
Fase 1 (Setup)
   │
   ▼
Fase 2 (Foundational) ── bloquea todas las historias
   │
   ├──► Fase 3 (US1, P1) 🎯 MVP
   │         │
   │         ▼
   ├──► Fase 4 (US2, P1)   (depende de US1: usa el mismo formulario y gateway)
   │         │
   │         ▼
   ├──► Fase 5 (US3, P2)   (depende de US1: extiende el formulario)
   │
   ├──► Fase 6 (US4, P3)   (independiente de US2 y US3 tras la Fase 2)
   └──► Fase 7 (US5, P3)   (independiente tras la Fase 2)
            │
            ▼
Fase N (Pulido)
```

### Dependencias de tareas relevantes

- T018–T022 (pruebas backend) deben fallar antes de T023–T038.
- T039–T042 (pruebas frontend) deben fallar antes de T043–T051.
- T023 bloquea T031, T032 y T033, porque todas leen configuración.
- T027 a T029 (puertos) bloquean T059 y T060 (casos de uso).
- T045 (puerto `AuthGateway`) bloquea T064 y T065.
- T066 bloquea T068, T089 y T095, porque todos modifican el mismo componente.
- T048 y T051 bloquean las historias de frontend con estilos.
- T102 a T104 no dependen de ninguna otra tarea y pueden empezar desde la Fase 1.

## Ejemplos de ejecución en paralelo

### Fase 2 (backend)

```text
# Pruebas en paralelo:
T019 Reglas de credenciales (credentials.spec.ts)
T020 Hash scrypt (password-hash.spec.ts)
T021 Arquitectura de capas (architecture.spec.ts)
T022 EnvPartyDirectory (env-party-directory.spec.ts)

# Implementación en paralelo tras las pruebas:
T024 Party (party.ts)
T025 Credenciales (credentials.ts)
T026 AuthOutcome (auth-outcome.ts)
```

### Fase 3 (US1)

```text
# Pruebas en paralelo:
T052 Caso de uso (authenticate-party.spec.ts)
T053 Initiate (sessions.initiate.spec.ts)
T054 Retrieve (sessions.retrieve.spec.ts)
T055 Formulario (login-form.component.spec.ts)
T057 Bienvenida (welcome.component.spec.ts)
```

### Fases 6 y 7

```text
# Ambas historias P3 pueden desarrollarse en paralelo por personas distintas:
T093 y T094 (US4)
T097 y T098 (US5)
```

## Estrategia de implementación

### MVP primero (solo US1 y US2)

1. Completar Fase 1 (Setup).
2. Completar Fase 2 (Foundational). Es el bloqueo principal.
3. Completar Fase 3 (US1) y validar el flujo feliz.
4. Completar Fase 4 (US2) y validar los errores de credenciales.
5. **Detenerse y validar el MVP** con quickstart.md, escenarios 1 a 5.

### Entrega incremental

1. MVP (US1 + US2).
2. Añadir US3 (validación de campos, P2).
3. Añadir US4 y US5 (P3).
4. Completar Fase N (Pulido) antes de dar por cerrada la funcionalidad.

### Principio TDD

En cada tarea `[TEST]`, escribir la prueba primero, ejecutarla y verificar que falla por la razón esperada. Después implementar la tarea de código correspondiente hasta que pase.

---

## Resumen de formato

- Total de tareas: 119
- Fase 1 (Setup): T001–T017 (17)
- Fase 2 (Foundational): T018–T051 (34)
- Fase 3 (US1): T052–T070 (19)
- Fase 4 (US2): T071–T083 (13)
- Fase 5 (US3): T084–T092 (9)
- Fase 6 (US4): T093–T096 (4)
- Fase 7 (US5): T097–T101 (5)
- Fase N (Pulido): T102–T119 (18)
- Todas las tareas usan la forma `- [ ] TNNN [P?] [USn?] descripción con ruta`.
