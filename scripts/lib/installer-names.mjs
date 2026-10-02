// Reglas de nombres de instaladores (docs/REGLAS-DEL-PROYECTO.md, regla 1).
// Nunca se distribuye un instalador con un nombre genérico como `app-release.apk`.

export const APP_FILE_PREFIX = 'MySchoolMyParents-Online';

const VERSION = /^\d+\.\d+\.\d+$/;
const BUILD = /^\d+$/;

/** Nombres oficiales del APK: con compilación y el alias amigable sin ella. */
export function apkNames(version, build) {
  if (!VERSION.test(version)) throw new Error(`Versión inválida: «${version}» (se espera x.y.z)`);
  if (!BUILD.test(String(build))) throw new Error(`Número de compilación inválido: «${build}»`);
  return {
    full: `${APP_FILE_PREFIX}-v${version}+${build}.apk`,
    friendly: `${APP_FILE_PREFIX}-v${version}.apk`,
  };
}

const GENERIC = /^(app-(release|debug)|runner)\.(apk|ipa|aab)$/i;
export const isGenericInstallerName = (name) => GENERIC.test(name);
