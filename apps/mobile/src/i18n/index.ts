export type MobileLocale = 'es' | 'en' | 'pt' | 'de' | 'fr';

export interface MobileLocaleOption {
  code: MobileLocale;
  label: string;
  flag: string;
  header: string;
}

export const MOBILE_LOCALES: MobileLocaleOption[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸', header: 'VER ESTA APP EN ESPAÑOL' },
  { code: 'en', label: 'English', flag: '🇺🇸', header: 'VIEW THIS APP IN ENGLISH' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', header: 'VER ESTE APP EM PORTUGUÊS' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', header: 'DIESE APP AUF DEUTSCH ANSEHEN' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', header: 'VOIR CETTE APPLICATION EN FRANÇAIS' },
];

export const DEFAULT_MOBILE_LOCALE: MobileLocale = 'es';

export const fillText = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

export function isMobileLocale(value: unknown): value is MobileLocale {
  return MOBILE_LOCALES.some((l) => l.code === value);
}

export function matchMobileLocale(languageCode: string | null | undefined): MobileLocale {
  return isMobileLocale(languageCode) ? languageCode : DEFAULT_MOBILE_LOCALE;
}

export const MOBILE_STRINGS: Record<MobileLocale, Record<string, string>> = {
  es: {
    booksTitle: 'Mis libros',
    createBook: 'Crear libro',
    readsIn: 'Se lee en',
    emptyTitle: 'Sin libros todavía',
    emptyDesc: 'Toma fotos de una lectura o importa un PDF para empezar.',
    settings: 'Ajustes',
    sync: 'Sincronización',
    account: 'Cuenta',
    about: 'Acerca de',
    close: 'Cerrar',
    cancel: 'Cancelar',
    openSettings: 'Abrir ajustes',
    cameraDenied: 'Necesitamos permiso para usar la cámara. Puedes activarlo en los ajustes del teléfono.',
    noVoiceFor: 'No hay voz para {language}.',
    configureVoice: 'Configurar',
    logoutTitle: '¿Cerrar sesión?',
    logoutMessage: 'Para sincronizar tendrás que volver a iniciar sesión.',
    logoutConfirm: 'Cerrar sesión',
  },
  en: {
    booksTitle: 'My books',
    createBook: 'Create book',
    readsIn: 'Reads in',
    emptyTitle: 'No books yet',
    emptyDesc: 'Take photos of reading pages or import a PDF to start.',
    settings: 'Settings',
    sync: 'Sync',
    account: 'Account',
    about: 'About',
    close: 'Close',
    cancel: 'Cancel',
    openSettings: 'Open Settings',
    cameraDenied: 'We need permission to use the camera. You can turn it on in your phone settings.',
    noVoiceFor: 'No voice for {language}.',
    configureVoice: 'Set up',
    logoutTitle: 'Sign out?',
    logoutMessage: 'To sync, you will need to sign in again.',
    logoutConfirm: 'Sign out',
  },
  pt: {
    booksTitle: 'Meus livros',
    createBook: 'Criar livro',
    readsIn: 'Lê-se em',
    emptyTitle: 'Sem livros ainda',
    emptyDesc: 'Tire fotos de uma leitura ou importe um PDF para começar.',
    settings: 'Configurações',
    sync: 'Sincronização',
    account: 'Conta',
    about: 'Sobre',
    close: 'Fechar',
    cancel: 'Cancelar',
    openSettings: 'Abrir configurações',
    cameraDenied: 'Precisamos de permissão para usar a câmera. Pode ativá-la nas configurações do telefone.',
    noVoiceFor: 'Não há voz para {language}.',
    configureVoice: 'Configurar',
    logoutTitle: 'Sair da conta?',
    logoutMessage: 'Para sincronizar, será preciso entrar de novo.',
    logoutConfirm: 'Sair',
  },
  de: {
    booksTitle: 'Meine Bücher',
    createBook: 'Buch erstellen',
    readsIn: 'Liest auf',
    emptyTitle: 'Noch keine Bücher',
    emptyDesc: 'Fotografieren Sie Leseseiten oder importieren Sie ein PDF.',
    settings: 'Einstellungen',
    sync: 'Synchronisierung',
    account: 'Konto',
    about: 'Über',
    close: 'Schließen',
    cancel: 'Abbrechen',
    openSettings: 'Einstellungen öffnen',
    cameraDenied: 'Wir benötigen die Berechtigung für die Kamera. Sie können sie in den Telefoneinstellungen aktivieren.',
    noVoiceFor: 'Keine Stimme für {language}.',
    configureVoice: 'Einrichten',
    logoutTitle: 'Abmelden?',
    logoutMessage: 'Zum Synchronisieren müssen Sie sich erneut anmelden.',
    logoutConfirm: 'Abmelden',
  },
  fr: {
    booksTitle: 'Mes livres',
    createBook: 'Créer un livre',
    readsIn: 'Se lit en',
    emptyTitle: 'Pas encore de livres',
    emptyDesc: 'Prenez en photo des pages ou importez un PDF pour commencer.',
    settings: 'Paramètres',
    sync: 'Synchronisation',
    account: 'Compte',
    about: 'À propos',
    close: 'Fermer',
    cancel: 'Annuler',
    openSettings: 'Ouvrir les réglages',
    cameraDenied: 'L\'application a besoin de l\'autorisation d\'utiliser l\'appareil photo. Vous pouvez l\'activer dans les réglages du téléphone.',
    noVoiceFor: 'Aucune voix pour {language}.',
    configureVoice: 'Configurer',
    logoutTitle: 'Se déconnecter ?',
    logoutMessage: 'Pour synchroniser, vous devrez vous reconnecter.',
    logoutConfirm: 'Se déconnecter',
  },
};
