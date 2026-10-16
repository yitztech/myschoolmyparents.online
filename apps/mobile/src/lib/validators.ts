/** Validadores de los formularios de autenticación (ES). Devuelven el error o null. */
const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜçÇ\s'-]+$/;
const EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const UPPER = /[A-ZÁÉÍÓÚÜÑ]/;
const LOWER = /[a-záéíóúüñ]/;
const DIGIT = /[0-9]/;
const SYMBOL = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]/;

export const validateName = (v?: string | null): string | null => {
  if (!v || v.trim().length === 0) return 'Escribe tu nombre.';
  const trimmed = v.trim();
  if (trimmed.length < 2) return 'El nombre debe tener al menos 2 letras.';
  if (trimmed.length > 120) return 'El nombre no puede superar los 120 caracteres.';
  if (!NAME_PATTERN.test(trimmed)) return 'El nombre solo puede contener letras, espacios, guiones y apóstrofes.';
  return null;
};

export const validateEmail = (v?: string | null): string | null => {
  if (!v || v.trim().length === 0) return 'Escribe tu correo electrónico.';
  const trimmed = v.trim();
  if (trimmed.length > 180) return 'El correo no puede superar los 180 caracteres.';
  if (!EMAIL.test(trimmed)) return 'Ese correo no parece válido. Revísalo.';
  return null;
};

export const validatePassword = (v?: string | null): string | null => {
  if (!v) return 'Escribe una contraseña.';
  if (v.length < 8) return 'Mínimo 8 caracteres.';
  if (v.length > 128) return 'La contraseña no puede superar los 128 caracteres.';
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

export const validateBookTitle = (v?: string | null): string | null => {
  if (!v || v.trim().length === 0) return 'El título no puede estar vacío.';
  const trimmed = v.trim();
  if (trimmed.length > 150) return 'El título no puede superar los 150 caracteres.';
  return null;
};

export const validateParagraphContent = (v?: string | null): string | null => {
  if (!v || v.trim().length === 0) return 'El contenido no puede estar vacío.';
  if (v.length > 10000) return 'El párrafo no puede superar los 10000 caracteres.';
  return null;
};

