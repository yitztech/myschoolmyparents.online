# Reglas del proyecto: MySchoolMyParents Online

Reglas obligatorias de desarrollo, versionado y distribución. Vienen de la app Flutter original y
siguen vigentes en la app Expo (`apps/mobile`).

## 1. Nombres de instaladores y artefactos

- Prohibidos los nombres genéricos (`app-release.apk`, `app-debug.apk`, `runner.ipa`…).
- Todo APK de distribución se nombra con la app y la versión exacta:
  - `MySchoolMyParents-Online-v<versionName>+<versionCode>.apk` (ej. `MySchoolMyParents-Online-v0.3.0+5.apk`)
  - alias para enlaces amigables: `MySchoolMyParents-Online-v<versionName>.apk`
- Salida en `dist/`. Lo hace `scripts/publish-apk.mjs` (local) y `.github/workflows/mobile-release.yml` (CI).
  Las reglas están codificadas y probadas en `scripts/lib/installer-names.mjs`.

## 2. La versión es visible en la app

La versión no es un secreto técnico: es información para padres, educadores y soporte.

- **Biblioteca** (`LibraryScreen`): bajo el título «Mis libros» y en el modal «Acerca de la app»
  (logotipo, nombre, versión y compilación, estado de sincronización: Nube / Local).
- **Acceso** (`LoginScreen`): en el pie.
- Todo se alimenta de `apps/mobile/src/lib/appVersion.ts`, que lee la versión nativa instalada y
  recurre a `app.json` si no existe.

## 3. Incremento de versión y actualización in-place

- Cada entrega distribuible incrementa la compilación: `expo.android.versionCode` y
  `expo.ios.buildNumber` en `apps/mobile/app.json`, que **deben coincidir** (lo comprueba
  `scripts/mobile-version.mjs`). Así Android actualiza sobre la versión instalada y no se pierden los
  libros locales.
- El tag de release es `v<expo.version>` y debe coincidir con `app.json`.
- `applicationId` / `bundleIdentifier` es `online.myschoolmyparents`, el mismo de la app Flutter:
  la app Expo actualiza sobre la anterior.

## 4. Cómo compilar

```bash
npm run mobile:version                        # muestra vX.Y.Z+N
npm run mobile:test                           # pruebas (node:test)
npm run mobile:typecheck
node scripts/build-android-direct.mjs         # APK firmado en local (JDK 17 + Android SDK)
eas build --platform all --profile production # tiendas (EAS)
```

## 5. Versiones de tecnologías

Se usa la última versión estable de cada tecnología y, en lo nativo de Expo, la versión compatible
con el SDK (`npx expo install`). Node: LTS activa (ver `.nvmrc`).
