# Pendientes tras la migración a Expo

Estado: la migración ya está en `main` (sin remoto). Última verificación: 61 pruebas de la app + 4 de
scripts, `tsc` y `expo-doctor` limpios, Metro empaqueta Android e iOS.

## Antes de publicar

- [ ] **Validar el módulo nativo `modules/msm-ocr` en dispositivo** (no se pudo compilar ni probar en la migración):
      cámara, OCR (ML Kit / Apple Vision), voz, importación de PDF. Requiere *development build*
      (`npm run mobile` + `expo run:android|ios` o EAS), no funciona en Expo Go.
- [ ] **Vincular EAS**: `npx eas init` y `npx eas update:configure` en `apps/mobile` (sustituir el
      `projectId` de relleno de `app.json`); crear el secreto `EXPO_TOKEN` y la variable `EAS_ENABLED=true`.
- [x] `scripts/build-android-direct.mjs` probado (v0.4.0+6): APK firmado, instalado y arrancado en un emulador
      Android 17. IPA sin firmar con `scripts/build-ios-unsigned.mjs` (Xcode 27).
- [ ] **Guardar una copia cifrada de la clave** `~/.myschoolmyparents-secrets/android` y cargarla como secretos del
      entorno `production` (ver docs/REGLAS-DEL-PROYECTO.md) para publicar desde CI.
- [ ] **Textos legales**: completar en `apps/frontend/src/legal/site.ts` los datos del titular, correos, ley aplicable
      y plazos, revisarlos con un abogado y poner `borrador: false`.

## Backend / producto

- [ ] El backend **no implementa `/api/v1/sync/{push,pull}`** ni `/user/data`: la sincronización de la app falla
      (sin tocar datos locales) hasta que exista. Contrato en `apps/mobile/src/sync/`.
- [ ] **Migración en sitio de los libros de Flutter**: hoy se pasan con Exportar/Importar. Mejora posible: abrir el
      archivo de Drift y convertir fechas (segundos → ms). Ver `docs/ADR-0002-migracion-a-expo.md`.
- [x] **Google Sign-In en la web**: implementado en backend (`/api/auth/google`, `/callback`, `/providers`) y frontend con OAuth 2.0 PKCE (se activa al configurar `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`). En la app móvil queda pendiente si se desea añadir nativo.

## Pulido de la app

- [ ] Icono adaptativo de Android: `assets/adaptive-icon.png` es el logo sin margen de seguridad (puede recortarse).
- [ ] Nunito es una fuente variable: React Native no respeta todos los pesos; valorar fuentes estáticas.
- [ ] Revisar en dispositivo la UX nueva de selección de texto (toque = ficha de palabra; pulsación larga = selección).
- [ ] Sin pruebas de interfaz (solo lógica): valorar Maestro como en mytasklists.

## Entorno y repo

- [x] Ningún `.env` se versiona (salvo las plantillas `*.example`). Los valores del antiguo `.env.dev` siguen en
      el historial de un repo público: son de juguete y no deben usarse fuera de desarrollo.
- [ ] Producción en Coolify: tras el primer push a `main`, comprobar que `deploy.yml` publicó
      `myschoolmyparents.online-backend` y `-nginx` en GHCR y pedir el despliegue a la plataforma.
- [ ] Probar `docker compose up` y el build web en el monorepo (solo se compilaron backend y frontend).
- [ ] Borrar el directorio original `MySchoolMyParentsOnline/` y los repos `flutter-app` y `site` cuando se dé por
      buena la migración.
- [ ] Añadir un remoto cuando se decida (hoy el repo es solo local).
- [ ] Node: `.nvmrc` pide 24; la máquina de la migración tenía 22.23 (las pruebas `node:test` pasan en ambas).
