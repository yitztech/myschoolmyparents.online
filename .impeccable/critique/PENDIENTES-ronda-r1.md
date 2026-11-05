# Pendientes de la ronda critique r1

Estado al cierre de esta sesión. Rama: `fix/critique-r1` (basada en `origin/main` b9858e0). Aún no hay PR abierto.

Snapshots de referencia: `2026-11-05T17-43-34Z__apps-frontend-src.md` (web, 32/40 Good, P0=1, P1=4) y `2026-11-05T17-43-34Z__apps-mobile.md` (móvil, 23/40 Acceptable, P0=0, P1=4).

## Hecho

| Item | Comando | Commit | Notas |
|---|---|---|---|
| 1 | `harden` (web) | `866d125` | HC oscuro en Modo Enfoque, Espacio/Enter respetan controles, ficha de palabra con foco/Escape/clic-fuera. Spec `e2e/tests/lector-accesibilidad.spec.ts`. |
| 2 | `clarify` (web) | `6a15733` | Miss honesto en `dictionary.ts` (`WordInfo.found`), copy de sync/backup en `Library.tsx`, claves nuevas en los 5 idiomas. |
| 3 (parcial) | `clarify` (móvil) | `b7788da` | Idioma de la interfaz persistente (AsyncStorage `msm.uiLocale`) e inicial desde el dispositivo. `useStrings()` en `AppContext`. Pendiente: migrar los literales (ver abajo). |
| 4 | `harden` (móvil) | `488dfaa` | Banner del fallo de voz (derivado de `snap.state`, sin `useEffect`), fila «No hay voz» con Configurar en `ReadingTab`, `takePhoto` devuelve `{ picked, denied }` y ofrece `Linking.openSettings()`. |
| 5 | `animate` (móvil) | `1ba5180` | Modo Lectura sigue el párrafo activo (`measureLayout` + `scrollTo`), instantáneo con movimiento reducido. Efecto en `ReadingTab` porque ahí están las refs de párrafo. |
| 6 | `adapt` (móvil) | `35491bc` | Tema pasa a la paleta de cuaderno de la web (nombres de tokens intactos). Bordes de tinta 2 px, sombra desplazada en iOS. `ui.tsx` de 9 estilos inline a 2. Sin fuente display: Fraunces/Karla requieren dependencia nueva (autorización pendiente). |
| 7 | `polish` (móvil) | `8f66897` | Confirmación al cerrar sesión, título validado (≤150, sin `maxLength` que recorte en silencio), tokens en la biblioteca. Primario AA (5,96:1) cierra el CTA 3.3:1 de la lista de P2. |

Tests móvil: 66/66, typecheck OK. **No verificado en dispositivo**: el auto-scroll y el permiso de cámara necesitan emulador o simulador.

Verificación del último estado: tests frontend 30/30, build OK, e2e 61/61.

## Pendiente

### 3. `clarify` (móvil, i18n) — `apps/mobile` — PARCIAL
- Hecho: persistencia e inicialización del idioma (`b7788da`).
- Pendiente: migrar los literales a `useStrings()`. Son ~40 archivos y cientos de cadenas en español fijo (`App.tsx` y `ui.tsx` incluidos). El catálogo solo tiene 10 claves y lo usan dos archivos. Necesita decisión de alcance y traducciones revisadas por una persona nativa en cada idioma.
- `App.tsx` (pantallas de carga y error) sigue en español: se renderiza antes de que exista el proveedor.
- El mensaje de error de `speechController.ts:213` sigue en español (lo muestra el banner de §4).

### 4. `harden` (móvil) — `apps/mobile`
- `speech/speechController.ts:213`: `snap.error` no se renderiza. Mostrar un Banner en `BookScreen.tsx:463` (useEffect sobre `snap.state === 'failed'`).
- `ReadingTab`: cuando `!canListen`, fila «No hay voz para {idioma} · Configurar».
- `media.ts`: separar `{picked, denied}` para distinguir cancelación de permiso denegado.
- `BookScreen.tsx:228-231`: `Linking.openSettings()` cuando el permiso está denegado.

### 5. `animate` (móvil) — auto-scroll
- Ref del ScrollView (`BookScreen.tsx:445`), offsets por párrafo con `onLayout`, y `scrollTo` en `useEffect([snap.activeParagraph])`.
- Respetar movimiento reducido si el sistema lo pide.

### 6. `adapt` (móvil) — estética cuaderno — HECHO (`35491bc`)
- Resto fuera de alcance: los ~200 `style={{` de las pantallas (solo se tocó `ui.tsx`, que es lo que pedía el archivo; el recuento «~30» era inexacto).
- Leer `reference/adapt.native.md` antes de empezar.
- `theme.ts` pasa del tema Material 3 a la estética cuaderno: papel `#FFFEF9`, tinta, offsets, display.
- Consolidar los ~30 inline styles de `ui.tsx` en tokens.

### 7. `polish` — cierre — HECHO SALVO LO ANOTADO (`8f66897`)
- Snapshot NO cerrado: sigue abierto el P1 de i18n (migración de literales, ítem 3), y «Añadir todas» y «PDF sin cancelar» (BookScreen) no se han tocado.
- Leer `reference/polish.md`, releer los snapshots y cerrar los 9 issues.
- Dejar en la lista P2/P3 lo que no entre:
  - crop global en `apps/frontend/src/components/CaptureDialog.tsx:118-120` (**es web, no móvil**);
  - menú ⋮ de la biblioteca (`apps/frontend/.../Library.tsx:327`, **es web, no móvil**), con `bg-white` y `slate`;
  - haptics;
  - `KeyboardAvoidingView`;
  - «Si se lee en es-US»;
  - «91 letras».
- Incluir `.impeccable/` en el commit del PR.
- Push y PR con resumen por item.

## Antes de cerrar el PR
- Limpiar cuentas de prueba: `DELETE FROM users WHERE email LIKE 'e2e_%'` (receta en `e2e/tests/helpers.ts`). Las cuentas `e2e_critiqueA_*` y `e2e_critiqueB_*` son desechables.
- Mencionar la limpieza en el PR.

## Gotchas del entorno dev
- `docker-compose.override.yml` monta `/app/node_modules` como volumen anónimo. Si `origin/main` añade dependencias, hay que recrear con:
  `docker compose --env-file .env.dev up -d --build --renew-anon-volumes backend frontend`
- Si `npm run build` falla con `@sentry/react` no encontrado, ejecutar `npm ci --prefix apps/frontend`.
- Si el e2e falla con «Failed to resolve import» en el contenedor, aplicar el rebuild de arriba.
- `npm run test:e2e` tarda ~1.2 min y necesita el stack levantado (`/api/health` → `{"ok":true}`).
