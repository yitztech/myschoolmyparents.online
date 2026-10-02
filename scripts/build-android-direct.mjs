#!/usr/bin/env node
/**
 * APK firmado de distribución directa, compilado en local (JDK 17 + Android SDK):
 *   - compilación «release» nativa con la API HTTPS de producción;
 *   - la clave de firma se genera una vez y vive FUERA del repositorio, en ~/.myschoolmyparents-secrets/android;
 *     consérvala: sin ella no se podrá actualizar sobre las instalaciones existentes;
 *   - el APK final se publica en dist/ con los nombres oficiales (scripts/publish-apk.mjs).
 *
 *   node scripts/build-android-direct.mjs
 *
 * Variables: JAVA_HOME, ANDROID_HOME, APKSIGNER (por defecto, la última build-tools del SDK).
 */
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { chmod, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mobile = path.join(root, 'apps/mobile');
const keyDir = path.join(homedir(), '.myschoolmyparents-secrets/android');
await mkdir(keyDir, { recursive: true, mode: 0o700 });
await chmod(keyDir, 0o700);

const javaHome = process.env.JAVA_HOME || '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home';
const sdk = process.env.ANDROID_HOME || path.join(homedir(), 'Library/Android/sdk');
const credentials = path.join(keyDir, 'signing.json');
const keystore = path.join(keyDir, 'release.keystore');

let signing;
try {
  signing = JSON.parse(await readFile(credentials, 'utf8'));
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
  signing = { alias: 'myschoolmyparents', password: randomBytes(32).toString('base64url') };
  await writeFile(credentials, `${JSON.stringify(signing)}\n`, { mode: 0o600 });
}

const buildTools = path.join(sdk, 'build-tools');
const latest = (await readdir(buildTools).catch(() => [])).sort().at(-1);
const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  ANDROID_HOME: sdk,
  PATH: `${path.join(javaHome, 'bin')}:${process.env.PATH}`,
  MYSCHOOL_LOCAL_RELEASE: 'true',
  EXPO_PUBLIC_API_URL: 'https://myschoolmyparents.online/api',
  APKSIGNER: process.env.APKSIGNER || (latest ? path.join(buildTools, latest, 'apksigner') : 'apksigner'),
  MYSCHOOL_KEYSTORE: keystore,
  MYSCHOOL_KEY_ALIAS: signing.alias,
  MYSCHOOL_KEY_PASSWORD: signing.password,
};

const run = (command, args, cwd = mobile) =>
  new Promise((resolve, reject) => {
    const p = spawn(command, args, { cwd, env, stdio: 'inherit' });
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${command} terminó con código ${code}`))));
  });

try {
  await readFile(keystore);
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
  await run(path.join(javaHome, 'bin/keytool'), [
    '-genkeypair', '-keystore', keystore, '-storepass:env', 'MYSCHOOL_KEY_PASSWORD', '-keypass:env', 'MYSCHOOL_KEY_PASSWORD',
    '-alias', signing.alias, '-keyalg', 'RSA', '-keysize', '4096', '-validity', '10000', '-dname', 'CN=MySchoolMyParents Online',
  ]);
  await chmod(keystore, 0o600);
}

await run('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install']);

const gradle = path.join(mobile, 'android/app/build.gradle');
let text = await readFile(gradle, 'utf8');
if (!text.includes('productionDirect {')) {
  text = text.replace(
    '    signingConfigs {',
    `    signingConfigs {
        productionDirect {
            storeFile file(System.getenv('MYSCHOOL_KEYSTORE'))
            storePassword System.getenv('MYSCHOOL_KEY_PASSWORD')
            keyAlias System.getenv('MYSCHOOL_KEY_ALIAS')
            keyPassword System.getenv('MYSCHOOL_KEY_PASSWORD')
        }`,
  );
}
// La plantilla de Expo escribe `signingConfig signingConfigs.debug` (Groovy, sin `=`); se aceptan las dos formas.
text = text.replace(/(release\s*\{[\s\S]*?signingConfig\s*=?\s*)signingConfigs\.debug/, '$1signingConfigs.productionDirect');
if (!/release\s*\{[\s\S]*?signingConfig\s*=?\s*signingConfigs\.productionDirect/.test(text)) throw new Error('No se pudo configurar la firma de release');
await writeFile(gradle, text);
await writeFile(path.join(mobile, 'android/local.properties'), `sdk.dir=${sdk.replace(/ /g, '\\ ')}\n`);

// Solo ARM: es lo que llevan los teléfonos. x86/x86_64 son para emuladores y casi
// duplican el tamaño del APK.
await run(
  './gradlew',
  ['assembleRelease', '--no-daemon', '--console=plain', '--max-workers=2', '-PreactNativeArchitectures=armeabi-v7a,arm64-v8a'],
  path.join(mobile, 'android'),
);
const apk = path.join(mobile, 'android/app/build/outputs/apk/release/app-release.apk');
await run('node', [path.join(root, 'scripts/publish-apk.mjs'), apk], root);
console.log(`APK firmado publicado en dist/. Clave de firma en ${keyDir}: consérvala para futuras actualizaciones.`);
