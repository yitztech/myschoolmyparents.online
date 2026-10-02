#!/usr/bin/env node
/**
 * Prepara una release de la app a partir de lo que dejan en dist/ los scripts de compilación
 * (build-android-direct.mjs → android.json, build-ios-unsigned.mjs → ios.json):
 *   - copia cada instalador con su alias fijo de «última versión» (LATEST_NAMES), que es lo
 *     que enlaza https://myschoolmyparents.online/descargas;
 *   - escribe en la salida estándar las notas de la release con las huellas SHA-256.
 *
 *   node scripts/release-notes.mjs [dist] > notas.md
 */
import { copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { LATEST_NAMES } from './lib/installer-names.mjs';

const dist = path.resolve(process.argv[2] ?? 'dist');

async function manifest(name) {
  try {
    return JSON.parse(await readFile(path.join(dist, name), 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

const android = await manifest('android.json');
const ios = await manifest('ios.json');
if (!android && !ios) {
  console.error(`No hay android.json ni ios.json en ${dist}: compila antes la app.`);
  process.exit(1);
}
if (android && ios && (android.version !== ios.version || android.build !== ios.build)) {
  console.error(`Android (${android.version}+${android.build}) e iOS (${ios.version}+${ios.build}) no coinciden.`);
  process.exit(1);
}

if (android) await copyFile(path.join(dist, android.fullName), path.join(dist, LATEST_NAMES.android));
if (ios) await copyFile(path.join(dist, ios.fullName), path.join(dist, LATEST_NAMES.ios));

const { version, build } = android ?? ios;
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const fila = (m, alias) =>
  `| \`${m.fullName}\` | ${mb(m.size)} | \`${m.sha256}\` |\n| \`${m.file}\` y \`${alias}\` | | mismo archivo |`;

const lines = [
  `Versión **${version}** (compilación ${build}) de MySchoolMyParents Online para usuarios avanzados, fuera de las tiendas.`,
  '',
  'Descarga desde https://myschoolmyparents.online/descargas. No hace falta cuenta: la app funciona en modo invitado.',
  '',
  '| Archivo | Tamaño | SHA-256 |',
  '|---|---|---|',
];
if (android) lines.push(fila(android, LATEST_NAMES.android));
if (ios) lines.push(fila(ios, LATEST_NAMES.ios));
lines.push(
  '',
  '### Android',
  'APK firmado. Android 7.0 o posterior. Instala encima de la versión anterior conservando los libros.',
  '',
  '### iOS',
  'IPA **sin firmar** (iOS 16.4 o posterior). Fírmala e instálala con tu Apple ID usando AltStore o Sideloadly.',
  '',
  'Comprueba la huella antes de instalar: `shasum -a 256 <archivo>` (macOS/Linux) o `certutil -hashfile <archivo> SHA256` (Windows).',
  '',
  'Términos: https://myschoolmyparents.online/legal/terminos · Privacidad: https://myschoolmyparents.online/legal/privacidad',
);
console.log(lines.join('\n'));
