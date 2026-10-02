import * as Application from 'expo-application';
import Constants from 'expo-constants';

/**
 * Versión visible de la app: se muestra en la biblioteca, en el acceso y en «Acerca de».
 * Lee la versión nativa instalada y recurre a la del manifiesto (app.json) si no existe.
 */
export const APP_NAME = 'MySchoolMyParents Online';

const manifestVersion = Constants.expoConfig?.version ?? '0.0.0';
const manifestBuild = String(Constants.expoConfig?.android?.versionCode ?? Constants.expoConfig?.ios?.buildNumber ?? '0');

export const appVersion = () => Application.nativeApplicationVersion ?? manifestVersion;
export const appBuild = () => Application.nativeBuildVersion ?? manifestBuild;

/** Ejemplo: `v0.3.0 (Build 5)`. */
export const displayVersion = () => `v${appVersion()} (Build ${appBuild()})`;
export const shortVersion = () => `v${appVersion()}`;
