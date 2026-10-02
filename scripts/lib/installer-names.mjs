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

/**
 * IPA de iOS sin firmar (para firmar con AltStore o Sideloadly mientras no haya
 * cuenta de desarrollador de Apple). El sufijo lo deja claro en el propio nombre.
 */
export function ipaNames(version, build) {
  const { full, friendly } = apkNames(version, build);
  return {
    full: full.replace(/\.apk$/, '-sin-firmar.ipa'),
    friendly: friendly.replace(/\.apk$/, '-sin-firmar.ipa'),
  };
}

/**
 * Alias fijos de la última versión: GitHub solo sirve
 * releases/latest/download/<archivo> con un nombre que no cambie, y es lo que
 * enlaza /descargas/<plataforma> en la web. Llevan la plataforma, nunca son
 * genéricos, y la versión exacta sigue en los otros nombres y en la web.
 */
export const LATEST_NAMES = {
  android: `${APP_FILE_PREFIX}-android.apk`,
  ios: `${APP_FILE_PREFIX}-ios-sin-firmar.ipa`,
};

const GENERIC = /^(app-(release|debug)|runner)\.(apk|ipa|aab)$/i;
export const isGenericInstallerName = (name) => GENERIC.test(name);
