# Pendientes de la ronda critique r1

Estado al cierre de esta sesión. Rama: `fix/critique-r1` (basada en `origin/main` b9858e0). PR #12 (borrador).

Snapshots de referencia: `2026-11-05T17-43-34Z__apps-frontend-src.md` (web, 32/40 Good, P0=1, P1=4) y `2026-11-05T17-43-34Z__apps-mobile.md` (móvil, 23/40 Acceptable, P0=0, P1=4).

## Hecho

| Item | Comando | Commit | Notas |
|---|---|---|---|
| 1 | `harden` (web) | `866d125` | HC oscuro en Modo Enfoque, Espacio/Enter respetan controles, ficha de palabra con foco/Escape/clic-fuera. Spec `e2e/tests/lector-accesibilidad.spec.ts`. |
| 2 | `clarify` (web) | `6a15733` | Miss honesto en `dictionary.ts` (`WordInfo.found`), copy de sync/backup en `Library.tsx`, claves nuevas en los 5 idiomas. |
| 3 | `clarify` (móvil) | `b7788da`, `b3776d2` | Idioma de la interfaz persistente (AsyncStorage `msm.uiLocale`) e inicial desde el dispositivo. `useT()` en AppContext. Migración completa de todos los textos visibles a los 5 idiomas (catálogos por área: common, auth, library, book, capture). Prueba de claves sin sobrantes. |
| 4 | `harden` (móvil) | `488dfaa` | Banner del fallo de voz (derivado de `snap.state`), fila «No hay voz» con Configurar en `ReadingTab`, `takePhoto` devuelve `{ picked, denied }` y ofrece `Linking.openSettings()`. |
| 5 | `animate` (móvil) | `1ba5180` | Modo Lectura sigue el párrafo activo (`measureLayout` + `scrollTo`), instantáneo con movimiento reducido. |
| 6 | `adapt` (móvil) | `35491bc` | Tema pasa a la paleta de cuaderno de la web (nombres de tokens intactos). Bordes de tinta 2 px, sombra desplazada en iOS. `ui.tsx` de 9 estilos inline a 2. Sin fuente display: Fraunces/Karla requieren dependencia nueva (autorización pendiente). |
| 7 | `polish` (móvil) | `8f66897`, `07e848a` | Confirmación al cerrar sesión, título validado (≤150, sin `maxLength` que recorte en silencio), tokens en la biblioteca. Primario AA (5,96:1) cierra el CTA 3.3:1. Cabecera de biblioteca en dos filas (título no se parte). |

Tests móvil: 68/68, typecheck OK. Tests web: 30/30, build OK, e2e 61/61.

Verificado en simulador iOS (iPhone 17 Pro): carga, tema, textos en español e inglés, cambio de idioma en caliente, validación de formularios, cabecera de biblioteca. Sin verificar: auto-scroll en dispositivo, permiso de cámara, textos en pt/de/fr.

Cierre de snapshots: todos los P0/P1 de ambas snapshots están resueltos. La herramienta `critique-storage close` no está disponible en este entorno; los snapshots se consideran cerrados por resolución de todos los issues P0/P1.

## Fuera de alcance (P2/P3, dejados para PRs futuros)
- crop global en `apps/frontend/src/components/CaptureDialog.tsx:118-120` (web).
- menú ⋮ de la biblioteca (`apps/frontend/.../Library.tsx:327`), con `bg-white` y `slate` (web).
- «Añadir todas» sube N borradores sin revisión (BookScreen.tsx:343-347).
- PDF sin cancelar, busy apaga todo (BookScreen.tsx:297-319).
- Cabecera saturada (7 items) (distill).
- haptics (0 en toda la app).
- `KeyboardAvoidingView` en Dialog (ui.tsx:212-230).
- «Si se lee en es-US».
- «91 letras».
- Fuente display (Fraunces/Karla) en móvil: dependencia nueva, pendiente de autorización.
- Estilos inline restantes en las pantallas (~200 en móvil).
- Mensajes internos del motor de sincronización (no se muestran).
- Documentos legales: un documento por idioma (pendiente).
- `src/data/localDefinitions.ts` y `src/data/translationDictionary.ts`: contenido lingüístico en español (definiciones y traducciones de palabras). Sus `partOfSpeech` siguen en español.

## Antes de cerrar el PR
- Limpieza de cuentas de prueba: HECHO. Borradas 59 cuentas `e2e_` de la base de desarrollo (patrón `e2e\_%@example.com`, antes 59 / después 0). Mencionado en el PR.
- `.impeccable/` incluido en el commit del PR: HECHO (`f23206e`).
- Push y PR con resumen por item: HECHO (PR #12, borrador).

## Gotchas del entorno dev
- `docker-compose.override.yml` monta `/app/node_modules` como volumen anónimo. Si `origin/main` añade dependencias, hay que recrear con:
  `docker compose --env-file .env.dev up -d --build --renew-anon-volumes backend frontend`
- Si `npm run build` falla con `@sentry/react` no encontrado, ejecutar `npm ci --prefix apps/frontend`.
- Si el e2e falla con «Failed to resolve import» en el contenedor, aplicar el rebuild de arriba.
- `npm run test:e2e` tarda ~1.2 min y necesita el stack levantado (`/api/health` → `{"ok":true}`).
