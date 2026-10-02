# Reglas del proyecto: MySchoolMyParents Online

Reglas obligatorias de desarrollo, versionado y distribución. Vienen de la app Flutter original y
siguen vigentes en la app Expo (`apps/mobile`).

## 1. Nombres de instaladores y artefactos

- Prohibidos los nombres genéricos (`app-release.apk`, `app-debug.apk`, `runner.ipa`…).
- Todo APK de distribución se nombra con la app y la versión exacta:
  - `MySchoolMyParents-Online-v<versionName>+<versionCode>.apk` (ej. `MySchoolMyParents-Online-v0.3.0+5.apk`)
  - alias para enlaces amigables: `MySchoolMyParents-Online-v<versionName>.apk`
- IPA de iOS sin firmar (mientras no haya cuenta de Apple Developer):
  `MySchoolMyParents-Online-v<versionName>+<versionCode>-sin-firmar.ipa` y su alias `…-v<versionName>-sin-firmar.ipa`.
- Alias fijos de la **última** versión, solo para el enlace de https://myschoolmyparents.online/descargas
  (GitHub solo sirve `releases/latest/download/<archivo>` con un nombre que no cambie):
  `MySchoolMyParents-Online-android.apk` y `MySchoolMyParents-Online-ios-sin-firmar.ipa`. Llevan la plataforma,
  nunca son genéricos, y se publican junto a los versionados.
- Salida en `dist/`. Lo hacen `scripts/publish-apk.mjs`, `scripts/build-ios-unsigned.mjs` y
  `scripts/release-notes.mjs` (alias y notas con SHA-256), en local o en `.github/workflows/mobile-release.yml`.
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
node scripts/build-android-direct.mjs         # APK firmado (JDK 17 + Android SDK), solo ARM
node scripts/build-ios-unsigned.mjs           # IPA sin firmar (macOS + Xcode + CocoaPods)
node scripts/release-notes.mjs > notas.md     # alias de «última versión» y notas con SHA-256
eas build --platform all --profile production # tiendas (EAS), cuando haya cuentas
```

### Distribución directa (sin tiendas)

La clave de firma de Android vive en `~/.myschoolmyparents-secrets/android` (`release.keystore` y
`signing.json`), fuera del repo. **Es única e irremplazable**: con otra clave, Android no actualiza sobre la
versión instalada. Guarda una copia cifrada.

Publicar una versión: subir `expo.version` y la compilación en `app.json` y lanzar a mano el workflow
**App móvil · instaladores** (`mobile-release.yml`) desde `main`. Compila el APK en Linux y el IPA en macOS, y
crea la release `v<versión>` con los nombres oficiales, los alias y las huellas. Necesita en el entorno
`production` los secretos `ANDROID_RELEASE_KEYSTORE_BASE64` (base64 de `release.keystore`) y
`ANDROID_SIGNING_JSON` (contenido de `signing.json`).

## 5. Versiones de tecnologías

Se usa la última versión estable de cada tecnología y, en lo nativo de Expo, la versión compatible
con el SDK (`npx expo install`). Node: LTS activa (ver `.nvmrc`).
