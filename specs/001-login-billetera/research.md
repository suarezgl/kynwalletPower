# Research: Pantalla de Inicio de Sesión de KynWallet

**Feature**: `001-login-billetera` | **Date**: 2026-10-19

Todas las incógnitas del Technical Context quedan resueltas aquí. Las versiones se verificaron
en las fuentes oficiales a la fecha indicada; deben confirmarse de nuevo al crear los proyectos.

## R1. Arquitectura desacoplada y versiones (ADR candidato)

- **Decision**: frontend en Angular 22 (LTS) y backend en NestJS 12 sobre Node.js 24 LTS.
  Comunicación exclusiva por REST (Constitución 7.2). Dos proyectos hermanos en el repositorio.
- **Estado de soporte verificado (2026-10-19)**:
  - Angular 22: lanzado el 3-jun-2026; soporte activo hasta el 30-jun-2027 y LTS hasta el
    30-jun-2028. Es la línea vigente más reciente.
  - Angular 21: LTS hasta el 30-jun-2027. Alternativa válida si se prefiere una línea ya
    madura.
  - Angular 20: LTS hasta el 28-nov-2026; **no usar** para un proyecto nuevo.
  - NestJS 12.1.x: versión vigente; ESM; requiere Node.js 20.19+ o 22.12+ para el runtime, y
    22.22.3+, 24.15+ o 26+ para la CLI.
  - Node.js 22: LTS hasta abril de 2027 (sin "superior a 22"). Node.js 24: LTS (Krypton), soporte
    hasta alrededor de 2028. Node.js 26: Current (mayo de 2026), sin LTS aún.
- **Rationale**: "superior a 22" se cumple con 24 LTS, que es la línea de soporte largo. Angular 22
  LTS ofrece soporte hasta 2028, mientras que el proyecto debe mantenerse con soporte vigente
  (Constitución 9.1.d). El desacoplamiento cumple Principios III y VII.
- **Alternatives considered**:
  - Node.js 26: válido por ser superior a 22, pero es Current y no LTS; se descarta para
    producción y se deja como opción del usuario.
  - Angular 21 LTS: soporte hasta 2027; válido pero más corto.
  - Angular 20: fin de LTS en 2026; incumple 9.1.d.
  - NestJS 11: funcional, pero 12 es la línea vigente.
  - Monolito con API embebida en Angular (SSR): acopla despliegue; incumple el pedido de
    desacoplamiento.
- **ADR**: esta decisión se registrará como ADR en `docs/adr/` durante la implementación (10.3).

## R2. Estilos, tokens de diseño y tipografía

- **Decision**: estilos del frontend con CSS nativo y variables CSS en `tokens.css`, con los
  nombres de las variables de Figma (`--neutral-0`, `--neutral-900`, `--brand-500`, `--brand-600`,
  etc.). Estilos por componente con los estilos de componente de Angular (encapsulación nativa).
  Tipografía Inter autoalojada con `@fontsource-variable/inter`.
- **Rationale**: cero dependencias de UI; los tokens replican 1:1 las variables de Figma (fuente
  única, DRY); Inter local evita peticiones a terceros.
- **Alternatives considered**: Angular Material (sistema de diseño ajeno, peso alto para dos
  pantallas, YAGNI); Tailwind (dependencia y configuración no requeridas).

**Tokens extraídos de Figma (`get_variable_defs`, nodo 2:2)**:

| Token Figma | Valor | Uso en diseño |
|---|---|---|
| neutral/0 | `#ffffff` | Fondo panel formulario, inputs |
| neutral/300 | `#d7d9e6` | Bordes de inputs, divisor |
| neutral/400 | `#a9abc2` | Placeholder |
| neutral/500 | `#8a8ca8` | Subtítulo, "o continúa con", "¿No tienes cuenta?" |
| neutral/700 | `#3d3f5c` | Etiquetas |
| neutral/900 | `#16182c` | Título, texto botones sociales |
| brand/500 | `#ff6b3d` | Fondo botón "Iniciar sesión" |
| brand/600 | `#ef5226` | Enlaces "¿Olvidaste…?", "Regístrate" |

Valores sin variable (de `get_design_context`): degradado del panel de marca
`linear-gradient(121.19deg, #ff8a65 0%, #ef5226 70.71%)`; tarjeta `rgba(255,255,255,.16)` con borde
`rgba(255,255,255,.35)`, radio 22px; chip `rgba(255,217,128,.9)`; radios de input y botón 12px;
alto de input y botón 52px, sociales 48px; gap del formulario 22px; ancho del formulario 400px;
panel de marca 620px con padding 64/56px. Tipografía: título 30px Bold, titular 44px Bold
(line-height 1.08), cuerpo 16–17px Regular, etiquetas 14px Medium, botón 16px SemiBold.

## R3. Contraste de color frente a WCAG 2.1 AA (Constitución 10.4)

Medición de contraste sobre blanco de los tokens del diseño:

| Uso | Colores | Ratio | Requisito | Resultado |
|---|---|---|---|---|
| Texto botón principal | blanco / brand-500 | 2.83:1 | 4.5:1 | ❌ |
| Enlaces 14px | brand-600 / blanco | 3.56:1 | 4.5:1 | ❌ |
| Textos secundarios | neutral-500 / blanco | 3.28:1 | 4.5:1 | ❌ |
| Placeholder | neutral-400 / blanco | 2.26:1 | 4.5:1 (recomendado) | ❌ |
| Borde de input | neutral-300 / blanco | 1.40:1 | 3:1 (1.4.11) | ❌ |
| Etiquetas | neutral-700 / blanco | 10.17:1 | 4.5:1 | ✅ |

- **Decision**: conservar los tokens de Figma y añadir tokens accesibles derivados, usados solo
  donde el original no cumple: `--brand-700: #d04721` (4.56:1, botón y enlaces),
  `--neutral-600: #73748b` (4.57:1, textos secundarios y placeholder),
  `--neutral-border: #92949c` (3.03:1, bordes de controles). El matiz se mantiene; solo se
  oscurecen.
- **Rationale**: 10.4 es obligatorio y la desviación del sistema de diseño requiere aprobación
  (10.6); ajustar la luminosidad es el menor cambio visual que cumple.
- **Alternatives considered**: colores exactos (incumple 10.4 y SC-005); texto oscuro sobre el
  naranja (cambia más la identidad visual).
- **Pending**: aprobación del responsable de diseño (Complexity Tracking del plan).

## R4. Origen de las cuentas de demostración

- **Conflicto**: el usuario pidió "usuarios ficticios predefinidos en el código"; la Constitución
  5.3 y FR-011 prohíben credenciales en el código fuente y en archivos versionados.
- **Decision**: el backend lee `DEMO_ACCOUNTS` (JSON) desde variables de entorno. Cada cuenta
  contiene `email`, `displayName` y `passwordHash` en formato `scrypt$N$r$p$salt$hash`. Nunca
  hay contraseñas en claro. Un script `npm run hash-password` genera el hash. `.env` no se
  versiona; `.env.example` contiene solo valores ficticios.
- **Validación al arranque**: si `DEMO_ACCOUNTS` falta, es inválido o tiene correos repetidos,
  el backend no arranca (fail fast) y la API responde 503 si se consulta sin configuración válida.
- **Rationale**: cumple 5.3 sin base de datos; el dominio recibe las cuentas por el puerto
  `PartyDirectory`, así que cambiar el origen afecta un único archivo.
- **Alternatives considered**: hash en el código (sigue siendo material de credenciales
  versionado); base de datos (YAGNI para una demo).

## R5. Simulación de la API y latencia

- **Decision**: el backend simula la API de *Party Authentication* con un directorio en
  configuración y una espera `SIMULATED_LATENCY_MS` (1000 por defecto; validación de 0 a 4000).
  La espera se inyecta como puerto para que las pruebas unitarias no esperen en tiempo real.
- **Rationale**: cumple FR-007 (API mockeada) con comportamiento realista y medible frente a
  8.1 (< 5 s).
- **Alternatives considered**: MSW en el navegador (simula una red que el alcance no necesita y
  no ejercita JWT ni validación del lado servidor); json-server (no permite JWT ni problem details
  sin código propio).

## R6. Formularios y estado en Angular

- **Decision**: formularios reactivos de Angular (`FormGroup`, `Validators` personalizados que
  delegan en las funciones puras de `login-validation.ts`). Estado de la vista con signals en
  `login-form.state.ts`, con una máquina de estados explícita:
  `editing → submitting → authError | welcome`.
- **Rationale**: los formularios reactivos ya forman parte de Angular (sin dependencia extra,
  Principio IV); los signals son el estado nativo recomendado por Angular 22.
- **Alternatives considered**: NgRx (estado global innecesario para una pantalla, YAGNI); formularios
  basados en plantillas (menos testables y con validación menos explícita).

## R7. Validación de formulario y reglas de seguridad

- **Decision**:
  - Correo: normalizado (trim y minúsculas), no vacío, ≤ 254 caracteres y con la expresión
    `^[^\s@]+@[^\s@]+\.[^\s@]{2,}$`. Se rechazan espacios y caracteres de control.
  - Contraseña: 15–128 caracteres, sin recortar y sin reglas de composición, según NIST SP
    800-63B-4 para autenticación de un solo factor (spec, FR-004).
  - Las mismas reglas se aplican en backend (`class-validator`) como defensa en profundidad (5.1).
- **Rationale**: cubre los casos de la spec sin la complejidad de RFC 5322 completo; el límite
  superior evita ataques de denegación por hash de contraseñas largas.
- **Alternatives considered**: RFC 5322 completo (regex ilegible, bajo valor); reglas de
  composición obligatorias (desaconsejadas por NIST).

## R8. Pruebas, cobertura y herramientas

- **Decision**:
  - Frontend: Vitest + TestBed + `@testing-library/angular` (opcional, decidir en la
    implementación; si no se usa, TestBed basta), `@testing-library/user-event`, `axe-core` con un
    helper propio (`vitest-axe` se descarta por falta de mantenimiento, 9.1.b),
    `@vitest/coverage-v8`, umbral 80 %.
  - Backend: Jest (plantilla oficial de NestJS), `supertest` para integración, umbral 80 %.
  - Lint: `angular-eslint` y `typescript-eslint` con reglas de dependencias entre capas; Prettier
    en ambos.
  - Análisis: `npm audit --audit-level=high` y `license-checker-rseidelsohn` con lista blanca
    (MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0, 0BSD, OFL-1.1, CC0-1.0, BlueOak-1.0.0);
    `secretlint` en la raíz.
- **Rationale**: cada herramienta es la estándar de su framework (KISS) y mantenida. Los scripts
  `verify` hacen verificables los controles de 11.4 mientras no exista CI.
- **Note**: el directorio aún no es un repositorio git; las reglas de revisión (11.3) requieren
  inicializarlo antes de integrar cambios.

## R9. Seguridad de la API (OWASP Top 10:2025)

- **Decision**:
  - JWT HS256, secreto `JWT_SECRET` ≥ 32 caracteres desde entorno; `iss`, `aud`, `exp` (900 s);
    algoritmo fijado al verificar.
  - Comparación de contraseñas con `crypto.scrypt` y `timingSafeEqual`; si el correo no existe se
    verifica contra un hash ficticio para igualar el tiempo de respuesta (A07).
  - Límite de tasa con `@nestjs/throttler`: 5 intentos por minuto por IP en el inicio de sesión;
    respuesta 429 (A07).
  - `helmet`; `X-Powered-By` desactivado; CORS deshabilitado (mismo origen con proxy en
    desarrollo, A02).
  - Filtro global de excepciones que devuelve `application/problem+json` (RFC 9457) sin detalles
    internos (A10).
  - Logs estructurados de intentos fallidos sin contraseña ni token (A09, 10.7).
- **Rationale**: cubre OWASP Top 10:2025 con dependencias mínimas; los controles son verificables
  en pruebas de integración.
- **Alternatives considered**: `argon2` (dependencia nativa adicional; scrypt cumple OWASP y está
  en Node); refresh tokens (YAGNI para la demo, el token es de vida corta).

## R10. Diseño responsivo

- **Decision**: puntos de quiebre según FR-018: smartphone 320–767 px (una columna), tablet
  768–1023 px y escritorio ≥ 1024 px. El panel de marca se oculta por debajo de 960 px y solo se
  muestra el logo. Unidades fluidas (`rem`, `%`, `clamp`) en lugar de anchos fijos; el formulario
  tiene ancho máximo de 400 px.
- **Verificación**: pruebas automatizadas de layout (sin scroll horizontal) en 320, 768, 1024 y
  1440 px, más revisión visual manual (10.4).
- **Alternatives considered**: CSS Grid con un solo breakpoint (no cubre tableta); librerías de
  grid (dependencia innecesaria).
