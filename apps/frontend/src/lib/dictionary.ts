/**
 * Diccionario educativo didáctico y traducción para el Lector Web.
 * Basado en las tablas bilingües de la app móvil para consulta instantánea sin conexión.
 */

export interface WordInfo {
  word: string;
  displayWord: string;
  partOfSpeech?: string;
  meaning: string;
  translation?: string;
  translationLocale?: string;
}

const COMMON_TRANSLATIONS: Record<string, string> = {
  cat: 'gato',
  dog: 'perro',
  bird: 'pájaro',
  fish: 'pez',
  lion: 'león',
  tiger: 'tigre',
  bear: 'oso',
  rabbit: 'conejo',
  frog: 'rana',
  duck: 'pato',
  horse: 'caballo',
  cow: 'vaca',
  pig: 'cerdo',
  sheep: 'oveja',
  wolf: 'lobo',
  fox: 'zorro',
  mouse: 'ratón',
  elephant: 'elefante',
  giraffe: 'jirafa',
  monkey: 'mono',
  tree: 'árbol',
  flower: 'flor',
  forest: 'bosque',
  sun: 'sol',
  moon: 'luna',
  star: 'estrella',
  sky: 'cielo',
  water: 'agua',
  river: 'río',
  sea: 'mar',
  mountain: 'montaña',
  house: 'casa',
  school: 'escuela',
  family: 'familia',
  mother: 'mamá / madre',
  father: 'papá / padre',
  brother: 'hermano',
  sister: 'hermana',
  friend: 'amigo / amiga',
  teacher: 'maestro / maestra',
  book: 'libro',
  page: 'página',
  pencil: 'lápiz',
  story: 'cuento / historia',
  color: 'color',
  red: 'rojo',
  blue: 'azul',
  green: 'verde',
  yellow: 'amarillo',
  happy: 'feliz',
  big: 'grande',
  small: 'pequeño / pequeña',
  good: 'bueno / buena',
  play: 'jugar',
  read: 'leer',
  write: 'escribir',
  listen: 'escuchar',
  learn: 'aprender',
  gato: 'cat',
  perro: 'dog',
  pájaro: 'bird',
  pez: 'fish',
  casa: 'house',
  escuela: 'school',
  familia: 'family',
  libro: 'book',
  árbol: 'tree',
  sol: 'sun',
  luna: 'moon',
  amigo: 'friend',
  amiga: 'friend',
  leer: 'read',
  jugar: 'play',
};

const COMMON_DEFINITIONS: Record<string, string> = {
  cat: 'Animal doméstico de la familia de los felinos con garras retráctiles.',
  dog: 'Animal mamífero doméstico, leal y fiel compañero de las personas.',
  bird: 'Animal con plumas y alas que usualmente puede volar.',
  book: 'Conjunto de hojas escritas encuadernadas que cuenta una historia o enseña algo.',
  family: 'Grupo de personas unidas por el amor, el cuidado mutuo y el parentesco.',
  house: 'Edificio o lugar donde vive una familia protegida.',
  school: 'Lugar donde los niños van a aprender, jugar y compartir con maestros.',
  sun: 'Estrella luminosa en el centro de nuestro sistema solar que da luz y calor a la Tierra.',
  tree: 'Planta grande de tronco leñoso con ramas y hojas verdes.',
  read: 'Mirar palabras escritas y comprender su significado en la mente.',
  play: 'Hacer una actividad divertida por placer y entretenimiento.',
  gato: 'Animal doméstico felino de orejas puntiagudas y bigotes sensibles.',
  perro: 'Mamífero domesticado conocido por su fidelidad y alegría.',
  escuela: 'Espacio de aprendizaje donde compartimos lecturas y descubrimientos.',
  libro: 'Obra con textos o dibujos que nos transporta a historias y conocimientos.',
  familia: 'Las personas que nos cuidan, apoyan y aman en el hogar.',
};

const CLEAN_WORD_REGEX = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

export function normalizeWord(raw: string): string {
  return raw.trim().toLowerCase().replace(CLEAN_WORD_REGEX, '');
}

export function lookupWord(
  rawWord: string,
  options: { homeLocale: string; learningLocale: string }
): WordInfo {
  const norm = normalizeWord(rawWord);
  const displayWord = norm ? norm.charAt(0).toUpperCase() + norm.slice(1) : rawWord.trim();
  const translation = COMMON_TRANSLATIONS[norm];
  const meaning =
    COMMON_DEFINITIONS[norm] ??
    `Palabra del texto («${rawWord.trim()}») en el idioma de lectura.`;

  return {
    word: norm || rawWord.trim(),
    displayWord: displayWord || rawWord.trim(),
    meaning,
    translation: translation ? translation.charAt(0).toUpperCase() + translation.slice(1) : undefined,
    translationLocale: options.homeLocale,
  };
}
