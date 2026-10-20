# Feature Specification: Pantalla de Inicio de Sesión de KynWallet

**Feature Branch**: `001-login-billetera`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Necesito construir una pantalla web de inicio de sesión para una
billetera virtual, con el objetivo de permitir que los usuarios accedan a la aplicación de manera
sencilla. El diseño de referencia se encuentra en Figma:
https://www.figma.com/design/f7uDsv8sh6ZOtK2OitTqtg/Billetera-Virtual---Prototipos?node-id=2-2.
La pantalla debe permitir ingresar correo y contraseña, validar los campos y simular una
autenticación. Si las credenciales son correctas, debe mostrar un mensaje de bienvenida; de lo
contrario, un mensaje de error. El alcance se limita a una demostración funcional del login, sin
servicios backend ni base de datos. Genera historias de usuario y criterios de aceptación,
respetando la Constitución del proyecto."

**Diseño de referencia**: Figma, frame `01 · Login` (nodo `2:2`). Compuesto por un panel de marca
(logo KynWallet, titular "Tu dinero, sin fronteras.", texto de apoyo y tarjeta ilustrativa) y un
panel de formulario ("Bienvenido de nuevo", campos Correo electrónico y Contraseña con control de
visibilidad, "Recordarme", "¿Olvidaste tu contraseña?", botón "Iniciar sesión", acceso con Google
y Apple, y enlace "Regístrate").

**Referencia visual adicional**: imagen adjunta a la solicitud. Define el look & feel: panel de marca
con gradiente naranja, logo KynWallet, titular "Tu dinero, sin fronteras.", subtítulo "Envía, recibe
y paga en segundos. Una billetera pensada para tu día a día." y tarjeta "Kyn Card"; panel de
formulario blanco con la misma jerarquía tipográfica y de espaciado. Los tonos exactos del naranja
no están medidos; deben validarse en la fase de diseño (ver FR-020).

## Clarifications

### Session 2026-10-14

- Q: Tras un inicio de sesión exitoso, ¿cómo debe presentarse el mensaje de bienvenida? → A: El
  formulario se reemplaza por una vista de bienvenida con un botón "Cerrar sesión" que vuelve al
  login vacío.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Iniciar sesión con credenciales válidas (Priority: P1)

Como usuario de la billetera virtual, quiero ingresar mi correo electrónico y mi contraseña y
recibir confirmación de acceso, para entrar a la aplicación de forma sencilla.

**Why this priority**: es el propósito central de la pantalla y de la demostración; sin este
flujo no existe valor demostrable.

**Independent Test**: se ingresa el correo y la contraseña de la cuenta de demostración, se
presiona "Iniciar sesión" y se verifica que aparece el mensaje de bienvenida personalizado.

**Acceptance Scenarios**:

1. **Given** la pantalla de inicio de sesión cargada, **When** el usuario ingresa el correo y la
   contraseña de una cuenta de demostración válida y presiona "Iniciar sesión", **Then** el
   formulario se reemplaza por una vista de bienvenida que muestra un mensaje con el nombre del
   titular de la cuenta y un botón "Cerrar sesión".
5. **Given** la vista de bienvenida, **When** el usuario presiona "Cerrar sesión", **Then** se
   vuelve a mostrar el formulario de inicio de sesión con ambos campos vacíos y sin mensajes.
2. **Given** el usuario envió el formulario con datos válidos, **When** la autenticación
   simulada está en curso, **Then** el botón "Iniciar sesión" muestra un estado de carga, queda
   deshabilitado y no admite envíos adicionales.
3. **Given** el usuario escribe el correo con mayúsculas o espacios al inicio o final, **When**
   envía credenciales correctas, **Then** el sistema lo autentica igualmente (el correo se
   compara sin distinguir mayúsculas y sin espacios periféricos).
4. **Given** el usuario está en el campo de contraseña, **When** presiona la tecla Enter,
   **Then** el formulario se envía igual que al presionar "Iniciar sesión".

---

### User Story 2 - Recibir retroalimentación ante credenciales incorrectas (Priority: P1)

Como usuario, quiero que se me informe claramente cuando mis credenciales no son correctas, para
poder corregirlas e intentarlo de nuevo.

**Why this priority**: el requerimiento exige explícitamente el mensaje de error, y es
indispensable para que la demostración refleje un comportamiento de autenticación completo y
seguro.

**Independent Test**: se ingresa un correo con formato válido y una contraseña incorrecta, se
envía el formulario y se verifica el mensaje de error genérico.

**Acceptance Scenarios**:

1. **Given** la pantalla de inicio de sesión, **When** el usuario envía un correo registrado con
   una contraseña incorrecta, **Then** el sistema muestra el mensaje "Correo o contraseña
   incorrectos" y no muestra el mensaje de bienvenida.
2. **Given** la pantalla de inicio de sesión, **When** el usuario envía un correo no registrado
   con cualquier contraseña, **Then** el sistema muestra exactamente el mismo mensaje genérico,
   sin revelar si el correo existe.
3. **Given** se muestra el mensaje de error de autenticación, **When** el usuario modifica
   cualquiera de los campos, **Then** el mensaje de error desaparece.
4. **Given** un intento fallido, **When** se muestra el error, **Then** el correo ingresado se
   conserva, el campo de contraseña se vacía y el foco se coloca en el campo de contraseña.

---

### User Story 3 - Validar los campos antes de enviar (Priority: P2)

Como usuario, quiero que el formulario me indique qué datos faltan o tienen formato incorrecto
antes de intentar el acceso, para corregir errores rápidamente.

**Why this priority**: mejora la usabilidad y evita intentos de autenticación innecesarios,
pero el flujo principal (P1) es demostrable sin ella.

**Independent Test**: se envía el formulario vacío y luego con un correo mal formado, y se
verifican los mensajes asociados a cada campo.

**Acceptance Scenarios**:

1. **Given** ambos campos vacíos, **When** el usuario presiona "Iniciar sesión", **Then** se
   muestran los mensajes "Ingresa tu correo electrónico" e "Ingresa tu contraseña" junto a cada
   campo, no se ejecuta la autenticación y el foco se mueve al primer campo con error.
2. **Given** un correo sin formato válido (por ejemplo, "usuario@" o "usuario.com"), **When** el
   usuario sale del campo o envía el formulario, **Then** se muestra "Ingresa un correo
   electrónico válido".
3. **Given** una contraseña con menos de 15 caracteres, **When** el usuario envía el formulario,
   **Then** se muestra "La contraseña debe tener al menos 15 caracteres" y no se ejecuta la
   autenticación.
4. **Given** un campo con mensaje de validación, **When** el usuario corrige el valor, **Then**
   el mensaje de ese campo desaparece.
5. **Given** un campo con error, **When** el campo es leído por un lector de pantalla, **Then**
   se anuncia el mensaje de error asociado a ese campo.

---

### User Story 4 - Mostrar u ocultar la contraseña (Priority: P3)

Como usuario, quiero poder ver temporalmente la contraseña que escribí, para confirmar que la
ingresé correctamente.

**Why this priority**: es una mejora de conveniencia presente en el diseño, no imprescindible
para el acceso.

**Independent Test**: se escribe una contraseña, se activa el control de visibilidad y se
verifica que el texto se muestra; se vuelve a activar y se oculta.

**Acceptance Scenarios**:

1. **Given** una contraseña ingresada y oculta, **When** el usuario activa el control de
   visibilidad, **Then** la contraseña se muestra en texto legible y el control indica
   "Ocultar contraseña".
2. **Given** la contraseña visible, **When** el usuario vuelve a activar el control, **Then** la
   contraseña se oculta y el control indica "Mostrar contraseña".
3. **Given** el control de visibilidad, **When** el usuario lo opera solo con teclado, **Then**
   puede alcanzarlo y activarlo, y su estado es anunciado por tecnologías de asistencia.

---

### User Story 5 - Elementos del diseño fuera del alcance de la demostración (Priority: P3)

Como usuario de la demostración, quiero que los elementos visibles del diseño que no forman
parte del alcance ("¿Olvidaste tu contraseña?", Google, Apple, "Regístrate") me informen que no
están disponibles, para no quedar con la impresión de un error.

**Why this priority**: garantiza fidelidad al diseño de referencia sin ampliar el alcance
funcional (YAGNI).

**Independent Test**: se activa cada uno de estos elementos y se verifica el aviso informativo.

**Acceptance Scenarios**:

1. **Given** la pantalla de inicio de sesión, **When** el usuario activa "¿Olvidaste tu
   contraseña?", "Google", "Apple" o "Regístrate", **Then** se muestra el aviso "Función no
   disponible en esta demostración" y la pantalla conserva los datos ingresados.
2. **Given** la casilla "Recordarme", **When** el usuario la marca o desmarca, **Then** la
   casilla cambia de estado visualmente sin almacenar ningún dato.

---

### Edge Cases

- El usuario presiona "Iniciar sesión" varias veces seguidas: solo se procesa un intento.
- El correo contiene espacios al inicio o al final: se ignoran al validar y comparar.
- La contraseña contiene espacios: se respetan tal cual, sin recortarlos.
- Correo o contraseña exceden longitudes razonables (correo > 254 caracteres, contraseña > 128):
  se rechaza con mensaje de validación y no se ejecuta la autenticación.
- El usuario pega texto en los campos: se acepta y se valida igual que el texto escrito.
- La configuración de cuentas de demostración no está disponible: la pantalla muestra
  "Servicio de acceso no disponible. Intenta más tarde." sin exponer detalles internos.
- Tras un acceso exitoso, el usuario recarga la página: vuelve a la pantalla de inicio de sesión
  (no existe sesión persistente).
- Ventana estrecha (dispositivo móvil): el formulario permanece completamente utilizable sin
  desplazamiento horizontal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla DEBE reproducir la estructura, textos y jerarquía visual del diseño de
  referencia de Figma (`01 · Login`), aplicando el sistema de diseño corporativo cuando exista.
- **FR-002**: La pantalla DEBE permitir ingresar un correo electrónico y una contraseña.
- **FR-003**: El sistema DEBE validar que el correo sea obligatorio, no contenga espacios ni
  caracteres de control, tenga formato de correo válido (parte local, símbolo "@" y dominio con al
  menos un punto y una extensión de 2 o más letras) y no exceda 254 caracteres. El correo se
  recorta de espacios periféricos antes de validar.
- **FR-004**: El sistema DEBE validar que la contraseña sea obligatoria y tenga entre 15 y 128
  caracteres, conforme a NIST SP 800-63B-4 para autenticación de un solo factor. No DEBE aplicar
  reglas de composición (mayúsculas, símbolos, números obligatorios), DEBE aceptar espacios y
  caracteres Unicode, y NO DEBE recortar la contraseña.
- **FR-005**: El sistema DEBE mostrar los mensajes de validación junto al campo correspondiente,
  al salir del campo y al intentar enviar, y DEBE ocultarlos cuando el valor se corrija. Al
  intentar enviar con errores, DEBE mostrar además un resumen de errores del formulario en la parte
  superior, con enlaces que llevan al campo con error.
- **FR-006**: El sistema NO DEBE ejecutar la autenticación mientras existan errores de
  validación.
- **FR-007**: La invocación a la API de autenticación DEBE estar mockeada. El mock DEBE respetar
  el contrato REST del proyecto (Constitución, Principio VII): recibe correo y contraseña, responde
  con éxito (nombre del titular y un token de acceso simulado tipo JWT, mantenido solo en memoria)
  o con credenciales incorrectas. La comparación se hace contra un conjunto de cuentas de
  demostración, sin servicios backend reales ni base de datos.
- **FR-008**: La autenticación simulada DEBE incluir una espera breve (aprox. 1 segundo) con
  indicador de carga, durante la cual el envío queda deshabilitado.
- **FR-009**: Ante credenciales correctas, el sistema DEBE reemplazar el formulario por una vista
  de bienvenida con un mensaje que incluya el nombre del titular de la cuenta y un botón "Cerrar
  sesión"; al cambiar de vista, el foco DEBE moverse al mensaje de bienvenida.
- **FR-009a**: El botón "Cerrar sesión" DEBE volver al formulario de inicio de sesión con los
  campos vacíos, sin mensajes previos y sin conservar datos del acceso anterior.
- **FR-010**: Ante credenciales incorrectas, el sistema DEBE mostrar un único mensaje genérico
  ("Correo o contraseña incorrectos") que no revele si el correo existe.
- **FR-011**: Las cuentas y credenciales de demostración NO DEBEN estar escritas en el código
  fuente; DEBEN provenir de configuración externa, conforme a la Constitución (regla 5.3).
- **FR-012**: El sistema NO DEBE registrar ni mostrar la contraseña en mensajes, registros de
  diagnóstico, URL ni almacenamiento del navegador.
- **FR-013**: El campo de contraseña DEBE ocultar los caracteres por defecto y ofrecer un control
  accesible para mostrarlos u ocultarlos.
- **FR-014**: El formulario DEBE poder enviarse con la tecla Enter y operarse completamente con
  teclado, con orden de foco lógico y foco visible.
- **FR-015**: La pantalla DEBE cumplir WCAG 2.1 nivel AA: etiquetas asociadas a cada campo,
  errores anunciados por tecnologías de asistencia, mensajes de resultado anunciados de forma
  automática y contraste suficiente.
- **FR-016**: Los elementos "¿Olvidaste tu contraseña?", "Google", "Apple" y "Regístrate" DEBEN
  mostrarse según el diseño y, al activarse, informar "Función no disponible en esta
  demostración".
- **FR-017**: La casilla "Recordarme" DEBE mostrarse y cambiar de estado, sin persistir datos.
- **FR-018**: La pantalla DEBE ser 100 % responsive y usable en los siguientes rangos, en
  orientación vertical y horizontal, sin desplazamiento horizontal:
  - Smartphone: 320 px a 767 px (referencia: 360 × 640, 390 × 844, 430 × 932).
  - Tablet: 768 px a 1023 px (referencia: 768 × 1024, 820 × 1180).
  - Escritorio: 1024 px en adelante (referencia: 1280 × 800, 1440 × 900, 1920 × 1080).
  En smartphone el panel de marca se oculta o se reduce, manteniendo el logo visible, y el
  formulario ocupa todo el ancho. En tablet y escritorio se muestra la distribución en dos paneles
  del diseño.
- **FR-019**: Los errores inesperados DEBEN mostrarse con un mensaje comprensible para el usuario,
  sin revelar detalles técnicos.
- **FR-020**: La apariencia DEBE seguir la referencia visual adjunta (colores, gradiente naranja,
  estructura y jerarquía del layout). Todo texto y control sobre el naranja, incluido el botón
  "Iniciar sesión", DEBE cumplir un contraste mínimo de 4,5:1 (texto normal) y 3:1 (texto grande y
  componentes de interfaz); si el tono de referencia no cumple, DEBE ajustarse el tono y
  documentarse.
- **FR-021**: Las respuestas de la API mockeada DEBEN devolverse en menos de 5 segundos
  (Constitución, Principio VIII), incluso cuando se simula la espera de carga.

### Key Entities

- **Cuenta de demostración**: representa a un usuario habilitado para la demo. Atributos: correo
  electrónico (identificador único, sin distinguir mayúsculas), contraseña y nombre del titular
  para el mensaje de bienvenida.
- **Intento de inicio de sesión**: datos ingresados en el formulario (correo y contraseña) y su
  resultado: error de validación, credenciales incorrectas o acceso exitoso. No se persiste.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario con credenciales de demostración completa el inicio de sesión en menos
  de 30 segundos desde que la pantalla se muestra.
- **SC-002**: El resultado de un intento (bienvenida o error) se muestra en un máximo de 2
  segundos tras presionar "Iniciar sesión".
- **SC-003**: El 100 % de los escenarios de aceptación de las historias P1 y P2 se verifican
  mediante pruebas automatizadas que pasan.
- **SC-004**: El 90 % de los participantes de una prueba de usabilidad completa el acceso en el
  primer intento sin asistencia.
- **SC-005**: La pantalla no presenta incumplimientos WCAG 2.1 AA en una auditoría automatizada
  de accesibilidad y es operable solo con teclado.
- **SC-006**: La revisión visual frente al diseño de Figma no detecta diferencias en textos,
  orden de elementos ni jerarquía visual.
- **SC-007**: El análisis de secretos no detecta credenciales en el código fuente versionado.
- **SC-008**: La pantalla se verifica sin desplazamiento horizontal ni elementos cortados en los
  nueve tamaños de referencia de FR-018 (tres de smartphone, dos de tablet y tres de escritorio),
  con el 100 % de las funciones operables en cada uno.
- **SC-009**: El 100 % de las respuestas de la autenticación mockeada se recibe en menos de 5
  segundos.
- **SC-010**: Las validaciones de correo y contraseña rechazan el 100 % de los casos inválidos
  definidos en las pruebas (incluidos espacios, longitudes límite y formatos mal formados) y
  aceptan los casos válidos.

## Assumptions

- La demostración es exclusivamente del lado del cliente: no hay backend, base de datos, sesión
  persistente ni pantallas adicionales de la aplicación; la vista de bienvenida (con "Cerrar
  sesión") es el final del flujo.
- Existe al menos una cuenta de demostración (por ejemplo, la del titular mostrado en el diseño,
  "Steven Luna"), definida en configuración externa al código.
- La política de contraseña (15 a 128 caracteres, sin reglas de composición) sigue NIST SP
  800-63B-4 para autenticación de un solo factor. Solo se aplica a la validación de formato; la
  demo no implementa bloqueo ni complejidad adicional.
- El bloqueo por intentos fallidos, la recuperación de contraseña, el registro, el acceso con
  Google/Apple y la persistencia de "Recordarme" quedan fuera del alcance; sus elementos se
  muestran solo por fidelidad al diseño.
- El idioma de la interfaz es español.
- No existen BRD ni ARD para esta funcionalidad; si se incorporan, esta especificación DEBE
  alinearse con ellos (Constitución, Principio VI).
- El diseño de referencia (Figma) y la imagen adjunta corresponden a escritorio (1440 × 1024); la
  adaptación a smartphone y tablet se deriva de ellos según los rangos de FR-018.
- Las credenciales de demostración, el mock de la API de autenticación y el token simulado viven
  en configuración o en una capa de simulación aislada, para poder reemplazarlos por la API real
  sin cambiar la pantalla.
