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
  },
};
