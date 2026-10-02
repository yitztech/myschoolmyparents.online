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
