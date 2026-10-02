/** Validadores de los formularios de autenticación (ES). Devuelven el error o null. */
const EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const UPPER = /[A-ZÁÉÍÓÚÜÑ]/;
const LOWER = /[a-záéíóúüñ]/;
const DIGIT = /[0-9]/;
const SYMBOL = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]/;

export const validateName = (v?: string | null): string | null => {
  if (!v || v.trim().length === 0) return 'Escribe tu nombre.';
  if (v.trim().length < 2) return 'El nombre debe tener al menos 2 letras.';
  return null;
};

export const validateEmail = (v?: string | null): string | null => {
  if (!v || v.trim().length === 0) return 'Escribe tu correo electrónico.';
  if (!EMAIL.test(v.trim())) return 'Ese correo no parece válido. Revísalo.';
  return null;
};

export const validatePassword = (v?: string | null): string | null => {
  if (!v) return 'Escribe una contraseña.';
  if (v.length < 8) return 'Mínimo 8 caracteres.';
  if (!UPPER.test(v)) return 'Añade al menos una mayúscula (A-Z).';
  if (!LOWER.test(v)) return 'Añade al menos una minúscula (a-z).';
  if (!DIGIT.test(v)) return 'Añade al menos un número (0-9).';
  if (!SYMBOL.test(v)) return 'Añade al menos un símbolo (ej. !, @, #).';
  return null;
};

export const validateConfirmPassword = (v: string | null | undefined, original: string): string | null => {
  if (!v) return 'Repite la contraseña.';
  if (v !== original) return 'Las contraseñas no coinciden.';
  return null;
};
