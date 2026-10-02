import { Platform } from 'react-native';

/** Paleta heredada de la app Flutter (Material 3 con semilla azul #1d4ed8 y papel cálido). */
export const colors = {
  primary: '#1d4ed8',
  onPrimary: '#ffffff',
  primaryContainer: '#dbeafe',
  onPrimaryContainer: '#1e3a8a',
  secondary: '#d97706',
  secondaryContainer: '#fef3c7',
  onSecondaryContainer: '#78350f',
  tertiary: '#059669',
  tertiaryContainer: '#d1fae5',
  onTertiaryContainer: '#064e3b',
  surface: '#fdfbf7',
  onSurface: '#1e293b',
  surfaceLow: '#f8f4ec',
  surfaceMid: '#f2ede2',
  card: '#ffffff',
  outline: '#cbd5e1',
  outlineVariant: '#e8e2d8',
  cardBorder: '#ede6db',
  inputBorder: '#e2d9cd',
  accent: '#f59e0b',
  error: '#b3261e',
  errorContainer: '#fee2e2',
  onErrorContainer: '#7f1d1d',
  success: '#15803d',
  muted: '#64748b',
  subtle: '#94a3b8',
  text: '#1e293b',
  textSoft: '#334155',
  highlight: '#fde68a',
  selected: '#fef3c7',
  selectedText: '#92400e',
  info: '#0284c7',
  infoContainer: '#f0f9ff',
  infoBorder: '#bae6fd',
  scrim: 'rgba(15,23,42,0.45)',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const fonts = { regular: 'Nunito', italic: 'Nunito-Italic' } as const;

export const shadow = Platform.select({
  ios: { shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  default: { elevation: 2 },
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
] as const;

export const friendlyLocale = (locale: string) => LOCALES.find((l) => l.value === locale)?.label ?? locale;
