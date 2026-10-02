#!/usr/bin/env node
/**
 * Dice cómo publicar los cambios de la app móvil:
 *   - «ninguno»: no cambia nada de apps/mobile.
 *   - «ota»: solo cambia JavaScript → actualización OTA con EAS Update (llega en minutos).
 *   - «tienda»: cambia algo nativo (dependencias, app.json, iconos, módulo msm-ocr…) → build nuevo.
 *
 *   node scripts/mobile-impact.mjs [rama-base] [--json]
 *
 * Aunque se equivocara, `runtimeVersion` (fingerprint) impide que una OTA llegue a un binario incompatible.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Lo que cambia el binario nativo, relativo a apps/mobile/. */
export const NATIVE_PREFIXES = ['app.json', 'app.config.', 'package-lock.json', 'eas.json', 'assets/', 'modules/', 'plugins/', 'metro.config.', 'babel.config.'];

/** Ficheros cambiados → tipo de publicación. `depsChanged` indica si cambiaron las dependencias de package.json. */
export function classify(files, { depsChanged = false } = {}) {
  const mobile = files.filter((f) => f.startsWith('apps/mobile/'));
  if (mobile.length === 0) return { release: 'ninguno', mobile, native: [] };
  const native = mobile.filter((f) => {
    const rel = f.slice('apps/mobile/'.length);
    if (rel === 'package.json') return depsChanged;
    return NATIVE_PREFIXES.some((p) => rel.startsWith(p));
  });
  return { release: native.length > 0 ? 'tienda' : 'ota', mobile, native };
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

function depsChangedSince(base) {
  try {
    const before = JSON.parse(git('show', `${base}:apps/mobile/package.json`));
    const now = JSON.parse(git('show', 'HEAD:apps/mobile/package.json'));
    return JSON.stringify(before.dependencies ?? {}) !== JSON.stringify(now.dependencies ?? {});
  } catch {
    return true;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const base = args.find((a) => !a.startsWith('--')) ?? 'origin/main';
  let mergeBase;
  try {
    mergeBase = git('merge-base', base, 'HEAD').trim();
  } catch {
    console.error(`No encuentro la rama base «${base}». Pásala como argumento: node scripts/mobile-impact.mjs main`);
    process.exit(2);
  }
  const lines = (t) => t.split('\n').filter(Boolean);
  const files = [...new Set([...lines(git('diff', '--name-only', mergeBase)), ...lines(git('ls-files', '--others', '--exclude-standard'))])];
  const result = classify(files, { depsChanged: depsChangedSince(mergeBase) });
  if (args.includes('--json')) {
    console.log(JSON.stringify({ mobile: result }));
  } else {
    console.log(`## App móvil\n\nPublicación: **${result.release}**`);
    if (result.native.length) console.log(`\nCambios nativos (${result.native.length}):\n${result.native.map((f) => `- ${f}`).join('\n')}`);
    else if (result.mobile.length) console.log('\nSolo JavaScript: se publica por OTA.');
  }
}
