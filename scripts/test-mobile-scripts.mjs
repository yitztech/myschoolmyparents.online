import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apkNames, ipaNames, isGenericInstallerName, LATEST_NAMES } from './lib/installer-names.mjs';
import { classify } from './mobile-impact.mjs';
import { readMobileVersion } from './mobile-version.mjs';

test('nombres oficiales de instalador', () => {
  assert.deepEqual(apkNames('0.3.0', 5), {
    full: 'MySchoolMyParents-Online-v0.3.0+5.apk',
    friendly: 'MySchoolMyParents-Online-v0.3.0.apk',
  });
  assert.throws(() => apkNames('0.3', 5), /Versión inválida/);
  assert.throws(() => apkNames('0.3.0', 'x'), /compilación inválido/);
});

test('IPA sin firmar y alias de la última versión', () => {
  assert.deepEqual(ipaNames('0.4.0', 6), {
    full: 'MySchoolMyParents-Online-v0.4.0+6-sin-firmar.ipa',
    friendly: 'MySchoolMyParents-Online-v0.4.0-sin-firmar.ipa',
  });
  assert.equal(LATEST_NAMES.android, 'MySchoolMyParents-Online-android.apk');
  assert.equal(LATEST_NAMES.ios, 'MySchoolMyParents-Online-ios-sin-firmar.ipa');
  for (const n of Object.values(LATEST_NAMES)) assert.ok(!isGenericInstallerName(n), n);
});

test('detecta nombres genéricos prohibidos', () => {
  for (const n of ['app-release.apk', 'app-debug.apk', 'runner.ipa', 'App-Release.aab']) assert.ok(isGenericInstallerName(n), n);
  assert.ok(!isGenericInstallerName('MySchoolMyParents-Online-v0.3.0+5.apk'));
});

test('impacto móvil: ninguno, OTA o tienda', () => {
  assert.equal(classify(['apps/backend/src/main.ts']).release, 'ninguno');
  assert.equal(classify(['apps/mobile/src/screens/LibraryScreen.tsx']).release, 'ota');
  assert.equal(classify(['apps/mobile/package.json']).release, 'ota');
  assert.equal(classify(['apps/mobile/package.json'], { depsChanged: true }).release, 'tienda');
  assert.equal(classify(['apps/mobile/app.json']).release, 'tienda');
  assert.equal(classify(['apps/mobile/src/a.ts', 'apps/mobile/modules/msm-ocr/ios/MsmOcrModule.swift']).release, 'tienda');
  assert.equal(classify(['apps/mobile/assets/icon.png']).release, 'tienda');
});

test('la versión de app.json es coherente', () => {
  const v = readMobileVersion();
  assert.match(v.version, /^\d+\.\d+\.\d+$/);
  assert.match(v.build, /^\d+$/);
});

test('release-manifest.json se estructura correctamente', async () => {
  const { mkdtemp, writeFile, readFile, rm } = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');
  const { execSync } = await import('node:child_process');

  const tmp = await mkdtemp(path.join(os.tmpdir(), 'release-test-'));
  try {
    const mockAndroid = {
      fullName: 'MySchoolMyParents-Online-v0.4.0+6.apk',
      file: 'MySchoolMyParents-Online-v0.4.0.apk',
      version: '0.4.0',
      build: 6,
      size: 123456,
      sha256: 'deadbeef1234',
    };
    await writeFile(path.join(tmp, 'android.json'), JSON.stringify(mockAndroid));
    await writeFile(path.join(tmp, mockAndroid.fullName), 'dummy-apk');

    execSync(`node scripts/release-notes.mjs ${tmp}`, { stdio: 'pipe' });

    const manifestRaw = await readFile(path.join(tmp, 'release-manifest.json'), 'utf8');
    const manifest = JSON.parse(manifestRaw);

    assert.equal(manifest.version, '0.4.0');
    assert.equal(manifest.build, 6);
    assert.equal(manifest.tag, 'v0.4.0');
    assert.equal(manifest.android.file, mockAndroid.fullName);
    assert.equal(manifest.android.sha256, mockAndroid.sha256);
    assert.ok(manifest.android.url.includes('releases/download/v0.4.0/'));
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});
