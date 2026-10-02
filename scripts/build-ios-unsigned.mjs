#!/usr/bin/env node
/**
 * IPA de iOS SIN FIRMAR para usuarios avanzados, compilado en local (macOS + Xcode + CocoaPods):
 *   - compilación «Release» para dispositivo con la API HTTPS de producción;
 *   - sin firma: quien la instala la firma con su propio Apple ID (AltStore, Sideloadly…).
 *     Sirve mientras no haya cuenta de Apple Developer; después, EAS o Xcode con firma.
 *   - el IPA final se publica en dist/ con los nombres oficiales (scripts/lib/installer-names.mjs)
 *     y un manifiesto ios.json con su SHA-256.
 *
 *   node scripts/build-ios-unsigned.mjs
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ipaNames } from './lib/installer-names.mjs';
import { readMobileVersion } from './mobile-version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mobile = path.join(root, 'apps/mobile');
const ios = path.join(mobile, 'ios');
const out = path.join(root, 'dist');
const work = path.join(mobile, 'build-ios');

const env = {
  ...process.env,
  MYSCHOOL_LOCAL_RELEASE: 'true',
  EXPO_PUBLIC_API_URL: 'https://myschoolmyparents.online/api',
  LANG: process.env.LANG || 'en_US.UTF-8',
};

const run = (command, args, cwd = mobile) =>
  new Promise((resolve, reject) => {
    const p = spawn(command, args, { cwd, env, stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} terminó con código ${code}`))));
  });

const { version, build } = readMobileVersion();
const names = ipaNames(version, build);

await run('npx', ['expo', 'prebuild', '--platform', 'ios']);

const workspace = (await readdir(ios)).find((f) => f.endsWith('.xcworkspace'));
if (!workspace) throw new Error('expo prebuild no generó ningún .xcworkspace');
const scheme = workspace.replace(/\.xcworkspace$/, '');

await rm(work, { recursive: true, force: true });
await run('xcodebuild', [
  '-workspace', path.join(ios, workspace),
  '-scheme', scheme,
  '-configuration', 'Release',
  '-sdk', 'iphoneos',
  '-destination', 'generic/platform=iOS',
  '-derivedDataPath', work,
  'CODE_SIGNING_ALLOWED=NO',
  'CODE_SIGNING_REQUIRED=NO',
  'CODE_SIGN_IDENTITY=',
  'build',
]);

const products = path.join(work, 'Build/Products/Release-iphoneos');
const app = (await readdir(products)).find((f) => f.endsWith('.app'));
if (!app) throw new Error(`No se encontró el .app en ${products}`);

// Un IPA es un zip con Payload/<App>.app dentro.
const staging = path.join(work, 'ipa');
await mkdir(path.join(staging, 'Payload'), { recursive: true });
await cp(path.join(products, app), path.join(staging, 'Payload', app), { recursive: true, verbatimSymlinks: true });
await mkdir(out, { recursive: true });
const fullPath = path.join(out, names.full);
await rm(fullPath, { force: true });
await run('zip', ['-qry', fullPath, 'Payload'], staging);
await cp(fullPath, path.join(out, names.friendly));

const bytes = await readFile(fullPath);
const manifest = {
  file: names.friendly,
  fullName: names.full,
  version,
  build: Number(build),
  size: (await stat(fullPath)).size,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  signed: false,
  publishedAt: new Date().toISOString(),
};
await writeFile(path.join(out, 'ios.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`IPA sin firmar publicado: ${names.full} y ${names.friendly} en ${out}`);
