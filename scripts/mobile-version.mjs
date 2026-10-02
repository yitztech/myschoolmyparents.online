#!/usr/bin/env node
// Lee la versión de la app móvil. La versión y la compilación viven en app.json y deben ir juntas:
//   expo.version = x.y.z · expo.android.versionCode = N · expo.ios.buildNumber = "N"
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function readMobileVersion(file = path.join(ROOT, 'apps/mobile/app.json')) {
  const { expo } = JSON.parse(readFileSync(file, 'utf8'));
  const code = expo.android?.versionCode;
  const build = expo.ios?.buildNumber;
  if (String(code) !== String(build)) {
    throw new Error(`versionCode (${code}) e ios.buildNumber (${build}) deben coincidir en app.json`);
  }
  return { version: expo.version, build: String(code) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const v = readMobileVersion();
  console.log(process.argv.includes('--json') ? JSON.stringify(v) : `v${v.version}+${v.build}`);
}
