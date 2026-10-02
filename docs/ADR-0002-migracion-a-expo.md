# ADR 0002 — Migración de la app móvil de Flutter a Expo (React Native)

Estado: aceptada. Fecha: 2026-10-01. Sustituye en lo móvil a [ADR 0001](flutter-legacy/adr/0001-ocr-nativo-por-plataforma.md).

## Contexto

El repositorio juntaba la app Flutter (`apps/mobile`) y la web (React + NestJS). El proyecto hermano
`mytasklists.online` ya usa Expo con EAS, y la web de este proyecto ya está en TypeScript.

## Decisión

- La app móvil pasa a Expo SDK 57 / React Native 0.86 con TypeScript, como en `mytasklists.online`.
- El OCR y la lectura de PDF siguen siendo **nativos y locales** (sin red): un módulo Expo propio
  (`modules/msm-ocr`) con el código Kotlin/Swift que ya existía. Se descartó el OCR por servidor.
- Misma identidad de aplicación (`online.myschoolmyparents`) para actualizar sobre la versión Flutter.
- El código Flutter se elimina del árbol; permanece en el historial de git (commit `9a3c9a6` y anteriores).

## Consecuencias

- Una sola pila (TypeScript) para web y móvil; CI, versionado y publicación (OTA con EAS Update) como en
  mytasklists.
- Los datos locales de la app Flutter **no se migran automáticamente**. La base nueva (`images_to_book.sqlite`,
  esquema v3 con las mismas tablas y columnas) vive en otra ruta que la de Drift y guarda las fechas en
  milisegundos (Drift, en segundos). Quien ya tenga libros debe pasarlos con Exportar/Importar (Modo Lectura)
  antes de actualizar. Una migración en sitio (abrir el archivo de Drift y convertir las fechas) queda como mejora.
- El módulo nativo no se pudo compilar ni probar en el entorno de la migración: la primera build de EAS debe
  validarlo en dispositivo (G0: cámara, OCR, voz, PDF).
