/**
 * Biblioteca de validación de datos para el frontend.
 * Centraliza las reglas de longitud recomendada y tipo de caracteres
 * acordes con el backend y las restricciones de base de datos.
 */

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 120;
export const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜçÇ\s'-]+$/;

export const EMAIL_MAX_LENGTH = 180;
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const UPPER_PATTERN = /[A-ZÁÉÍÓÚÜÑ]/;
export const LOWER_PATTERN = /[a-záéíóúüñ]/;
export const DIGIT_PATTERN = /[0-9]/;
export const SYMBOL_PATTERN = /[^A-Za-z0-9ÁÉÍÓÚáéíóúÜüÑñ\s]/;

export const BOOK_TITLE_MIN_LENGTH = 1;
export const BOOK_TITLE_MAX_LENGTH = 150;

export const PARAGRAPH_MIN_LENGTH = 1;
export const PARAGRAPH_MAX_LENGTH = 10000;

export function validateName(value?: string | null): string | null {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return 'Escribe tu nombre.';
  }
  const trimmed = value.trim();
  if (trimmed.length < NAME_MIN_LENGTH) {
    return `Escribe tu nombre (mínimo ${NAME_MIN_LENGTH} letras).`;
  }
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `El nombre no puede superar los ${NAME_MAX_LENGTH} caracteres.`;
  }
  if (!NAME_PATTERN.test(trimmed)) {
    return 'El nombre solo puede contener letras, espacios, guiones y apóstrofes.';
  }
  return null;
}

export function validateEmail(value?: string | null): string | null {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return 'Escribe un correo electrónico.';
  }
  const trimmed = value.trim();
  if (trimmed.length > EMAIL_MAX_LENGTH) {
    return `El correo no puede superar los ${EMAIL_MAX_LENGTH} caracteres.`;
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Escribe un correo electrónico válido.';
  }
  return null;
}

export function validatePassword(value?: string | null): string | null {
  if (!value || typeof value !== 'string' || value.length === 0) {
    return 'Escribe una contraseña.';
  }
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres.`;
  }
  if (!UPPER_PATTERN.test(value)) {
    return 'Añade al menos una mayúscula (A-Z).';
  }
  if (!LOWER_PATTERN.test(value)) {
    return 'Añade al menos una minúscula (a-z).';
  }
  if (!DIGIT_PATTERN.test(value)) {
    return 'Añade al menos un número (0-9).';
  }
  if (!SYMBOL_PATTERN.test(value)) {
    return 'Añade al menos un símbolo (!, @, #, etc.).';
  }
  return null;
}

export function validateBookTitle(value?: string | null): string | null {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return 'El título no puede estar vacío.';
  }
  const trimmed = value.trim();
  if (trimmed.length < BOOK_TITLE_MIN_LENGTH) {
    return `El título debe tener al menos ${BOOK_TITLE_MIN_LENGTH} carácter.`;
  }
  if (trimmed.length > BOOK_TITLE_MAX_LENGTH) {
    return `El título no puede superar los ${BOOK_TITLE_MAX_LENGTH} caracteres.`;
  }
  return null;
}

export function validateParagraphContent(value?: string | null): string | null {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return 'El contenido de la lectura no puede estar vacío.';
  }
  if (value.length > PARAGRAPH_MAX_LENGTH) {
    return `El párrafo no puede superar los ${PARAGRAPH_MAX_LENGTH} caracteres.`;
  }
  return null;
}
