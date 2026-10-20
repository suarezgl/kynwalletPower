# Contract: Interfaz de usuario de la pantalla de login

Contrato observable por el usuario y por las pruebas de componentes (las consultas se hacen por
rol y nombre accesible, no por clases CSS). Stack: Angular 22 (ver [plan.md](../plan.md)).
Textos exactos en español, tal como figuran en el diseño de Figma (nodo `2:2`) y en la spec.

## Vista de inicio de sesión

| Elemento | Rol / nombre accesible | Notas |
|---|---|---|
| Título | `heading` nivel 1 "Bienvenido de nuevo" | Subtítulo "Ingresa a tu cuenta para continuar" |
| Correo | `textbox` "Correo electrónico" | `type=email`, `autocomplete=username`, placeholder "tucorreo@ejemplo.com" |
| Contraseña | campo con etiqueta "Contraseña" | `type=password` (o `text` si es visible), `autocomplete=current-password` |
| Visibilidad | `button` "Mostrar contraseña" / "Ocultar contraseña" | `aria-pressed` refleja el estado |
| Recordarme | `checkbox` "Recordarme" | Sin persistencia |
| Recuperar contraseña | `button` "¿Olvidaste tu contraseña?" | Muestra el aviso de función no disponible |
| Enviar | `button` "Iniciar sesión" | En carga: `aria-busy=true`, deshabilitado, texto "Iniciando sesión…" |
| Separador | texto "o continúa con" | Decorativo |
| Google / Apple | `button` "Google", `button` "Apple" | Muestran el aviso |
| Registro | `button` "Regístrate" precedido por "¿No tienes cuenta?" | Muestra el aviso |

**Errores por campo**: texto bajo el campo, vinculado con `aria-describedby`; el campo lleva
`aria-invalid=true`.

**Mensajes globales**:

| Caso | Rol | Texto |
|---|---|---|
| Credenciales incorrectas | `alert` | "Correo o contraseña incorrectos" |
| No disponible | `alert` | "Servicio de acceso no disponible. Intenta más tarde." |
| Función fuera de alcance | `status` | "Función no disponible en esta demostración" |

## Vista de bienvenida

| Elemento | Rol / nombre accesible | Notas |
|---|---|---|
| Mensaje | `heading` nivel 1 "¡Bienvenido, {displayName}!" | Recibe el foco al aparecer (`tabIndex=-1`) |
| Cerrar sesión | `button` "Cerrar sesión" | Vuelve a la vista de login con todo vacío |

## Panel de marca

Logo "KynWallet", titular "Tu dinero, sin fronteras.", texto de apoyo y la tarjeta ilustrativa
(decorativa, `aria-hidden=true`). Por debajo de 960px solo se muestra el logo.

## Teclado

Orden de tabulación: correo → contraseña → visibilidad → recordarme → recuperar contraseña →
iniciar sesión → Google → Apple → regístrate. Enter en cualquier campo envía el formulario.
El foco siempre es visible (anillo de 2px con contraste ≥ 3:1).
