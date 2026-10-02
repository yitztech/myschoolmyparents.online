# App móvil (Expo + React Native)

`apps/mobile` sustituye a la app Flutter. Misma funcionalidad, mismos datos y mismo backend.

## Capas

```
App.tsx                      proveedores: fuentes, toast, AppProvider (BD + auth + sync), navegación
src/
  db/                        SQLite (expo-sqlite): esquema v3, migraciones por user_version, AppDatabase
  services/                  auth HTTP, cola OCR, importación PDF, exportación/importación de libros,
                             diccionario y traducción (local + en línea), medios y archivos
  sync/                      motor de sincronización bajo demanda (push/pull) y cliente HTTP
  speech/                    SpeechController (karaoke, pausa/reanudación) sobre expo-speech
  screens/ components/       interfaz: acceso, biblioteca, lector (Lectura · Ver Libro · Páginas)
  lib/                       utilidades puras: rangos de texto UTF-16, validadores, versión, base64
modules/msm-ocr/             módulo Expo nativo: ML Kit (Android) · Apple Vision + PDFKit (iOS)
tests/                       node:test sobre la lógica pura y la BD (node:sqlite en memoria)
```

La lógica no depende de la plataforma: la BD, el motor de voz, la cola de OCR, el diccionario o la
sincronización reciben sus dependencias (SQLite, motor TTS, OCR, `fetch`) por inyección, y por eso se
prueban en Node sin emulador.

## Equivalencias con Flutter

| Flutter | Expo |
|---|---|
| Drift (`AppDatabase`, `Stream`) | `expo-sqlite` + `AppDatabase` + `useLiveQuery` (emisor de cambios) |
| `flutter_tts` (`SpeechProbe`) | `expo-speech` + `SpeechController` |
| `MethodChannel online.myschoolmyparents/ocr` | módulo `msm-ocr` (mismo código nativo) |
| `image_picker`, `image` (Isolate) | `expo-image-picker`, `expo-image-manipulator` |
| `file_picker`, `path_provider` | `File.pickFileAsync`, `expo-file-system` |
| `FakeInternetAuthService` | `HttpAuthService` contra el backend real (`/api/auth/*`) |
| `google_fonts` / Nunito | `expo-font` con `assets/fonts/Nunito*.ttf` |
| `package_info_plus` | `expo-application` |

## Backend

La app usa el mismo backend que la web: `POST /api/auth/register|login`, `/api/auth/password/recover|reset`,
`GET /api/auth/me`. La sesión se guarda en `expo-secure-store`. El modo invitado (100 % local) sigue
existiendo. La sincronización apunta a `/api/v1/sync/{push,pull}`: **el backend aún no lo implementa**; mientras
tanto la app responde «Error al sincronizar» sin tocar los datos locales.

Sin Google: el backend responde `410` a `/auth/google` y la app Flutter solo lo simulaba.

## OCR y PDF en el dispositivo

`modules/msm-ocr` porta el código de `MainActivity.kt` y `AppDelegate.swift` sin cambiar su comportamiento:

- Android: ML Kit de texto latino empaquetado (`text-recognition:16.0.1`) y `PdfRenderer` a 3×.
- iOS: `VNRecognizeTextRequest` (en-US, es-ES, sin corrección lingüística) y `PDFKit` a 2,5×; si el PDF trae
  texto seleccionable se usa directamente (`pdfkit-direct`).

Es código nativo: requiere un *development build* (`expo run:android|ios` o EAS), no funciona en Expo Go.
