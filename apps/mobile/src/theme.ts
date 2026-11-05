import { Platform } from 'react-native';

/** Estética de cuaderno de la web: papel cálido, tinta y acentos de la marca (apps/frontend/src/index.css). */
export const colors = {
  primary: '#B9320A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#FDEDC7',
  onPrimaryContainer: '#262134',
  secondary: '#FFC52E',
  secondaryContainer: '#FDEDC7',
  onSecondaryContainer: '#262134',
  tertiary: '#0E7C5A',
  tertiaryContainer: '#D7EFE6',
  onTertiaryContainer: '#0A5941',
  surface: '#FFF6E9',
  onSurface: '#262134',
  surfaceLow: '#FFF6E9',
  surfaceMid: '#FDEDC7',
  card: '#FFFEF9',
  outline: '#262134',
  outlineVariant: '#E3D3B5',
  cardBorder: '#262134',
  inputBorder: '#262134',
  accent: '#FF4D1C',
  error: '#B3261E',
  errorContainer: '#FBE3DF',
  onErrorContainer: '#7A1D15',
  success: '#0E7C5A',
  muted: '#5C5570',
  subtle: '#736B84',
  text: '#262134',
  textSoft: '#3D3650',
  highlight: '#FFC52E',
  selected: '#FDEDC7',
  selectedText: '#262134',
  info: '#0E6A8A',
  infoContainer: '#E8F7FC',
  infoBorder: '#BFE6F5',
  scrim: 'rgba(38,33,52,0.45)',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const fonts = { regular: 'Nunito', italic: 'Nunito-Italic' } as const;

/** Sombra desplazada sin difuminar, como en la web. Android no admite sombras duras: allí solo queda el borde. */
export const shadow = Platform.select({
  ios: { shadowColor: colors.text, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 4, height: 4 } },
  default: { elevation: 0 },
}) as object;

/** Temas de las portadas de libros (lomo, insignia, icono), elegidos por hash del libro. */
export interface BookTheme {
  spine: string;
  spineDark: string;
  badge: string;
  badgeText: string;
  icon: 'auto-stories' | 'menu-book' | 'park' | 'wb-sunny' | 'star';
  vibe: string;
}

export const BOOK_THEMES: BookTheme[] = [
  { spine: '#f59e0b', spineDark: '#b45309', badge: '#fef3c7', badgeText: '#92400e', icon: 'auto-stories', vibe: 'Cuento Mágico' },
  { spine: '#2563eb', spineDark: '#1d4ed8', badge: '#dbeafe', badgeText: '#1e40af', icon: 'menu-book', vibe: 'Aventura Escolar' },
  { spine: '#10b981', spineDark: '#047857', badge: '#d1fae5', badgeText: '#065f46', icon: 'park', vibe: 'Naturaleza' },
  { spine: '#f97316', spineDark: '#c2410c', badge: '#ffedd5', badgeText: '#9a3412', icon: 'wb-sunny', vibe: 'Fantasía' },
  { spine: '#8b5cf6', spineDark: '#6d28d9', badge: '#ede9fe', badgeText: '#5b21b6', icon: 'star', vibe: 'Buenas Noches' },
];

/** Hash determinista de 32 bits (los `hashCode` de Dart no se pueden reproducir en JS). */
export function bookTheme(id: string, title: string): BookTheme {
  let h = 0;
  for (const ch of `${id}|${title}`) h = (Math.imul(h, 31) + ch.codePointAt(0)!) | 0;
  return BOOK_THEMES[Math.abs(h) % BOOK_THEMES.length];
}

export const LOCALES = [
  { value: 'en-US', label: '🇺🇸 English (US)' },
  { value: 'en-GB', label: '🇬🇧 English (UK)' },
  { value: 'es-MX', label: '🇲🇽 Español (México)' },
  { value: 'es-ES', label: '🇪🇸 Español (España)' },
  { value: 'pt-BR', label: '🇧🇷 Português (Brasil)' },
  { value: 'de-DE', label: '🇩🇪 Deutsch' },
  { value: 'fr-FR', label: '🇫🇷 Français' },
] as const;

export const friendlyLocale = (locale: string) => LOCALES.find((l) => l.value === locale)?.label ?? locale;
