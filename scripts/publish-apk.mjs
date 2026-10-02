#!/usr/bin/env node
/**
 * Copia un APK firmado a dist/ con los nombres oficiales y escribe su manifiesto.
 *
 *   node scripts/publish-apk.mjs <ruta/al/apk> [directorio-de-salida]
 *
 * La versión sale de apps/mobile/app.json. El APK debe verificar con apksigner
 * (ANDROID SDK build-tools; variable APKSIGNER si no está en el PATH).
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { apkNames } from './lib/installer-names.mjs';
import { readMobileVersion } from './mobile-version.mjs';

const [source, outArg] = process.argv.slice(2);
if (!source) {
  console.error('Uso: node scripts/publish-apk.mjs <ruta/al/apk> [directorio-de-salida]');
  process.exit(2);
}
const { version, build } = readMobileVersion();
const names = apkNames(version, build);
const out = path.resolve(outArg ?? 'dist');

execFileSync(process.env.APKSIGNER || 'apksigner', ['verify', '--verbose', path.resolve(source)], { stdio: ['ignore', 'pipe', 'pipe'] });
const bytes = await readFile(source);
if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('El archivo no es un APK válido');

await mkdir(out, { recursive: true });
for (const name of [names.full, names.friendly]) {
  const target = path.join(out, name);
  await copyFile(source, `${target}.tmp`);
  await rename(`${target}.tmp`, target);
}
const manifest = {
  file: names.friendly,
  fullName: names.full,
  version,
  build: Number(build),
  size: (await stat(path.join(out, names.full))).size,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  signed: true,
  publishedAt: new Date().toISOString(),
};
await writeFile(path.join(out, 'android.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`APK verificado y publicado: ${names.full} y ${names.friendly} en ${out}`);
