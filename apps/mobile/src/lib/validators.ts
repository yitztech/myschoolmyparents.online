import { tr } from '../i18n';

/** Validadores de los formularios. Devuelven el error traducido al idioma activo, o null. */
const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜçÇ\s'-]+$/;
const EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const UPPER = /[A-ZÁÉÍÓÚÜÑ]/;
const LOWER = /[a-záéíóúüñ]/;
const DIGIT = /[0-9]/;
const SYMBOL = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s]/;

export const validateName = (v?: string | null): string | null => {
  if (!v || v.trim().length === 0) return tr('validation.nameRequired');
  const trimmed = v.trim();
  if (trimmed.length < 2) return tr('validation.nameMin');
  if (trimmed.length > 120) return tr('validation.nameMax');
  if (!NAME_PATTERN.test(trimmed)) return tr('validation.nameChars');
  return null;
};

export const validateEmail = (v?: string | null): string | null => {
  if (!v || v.trim().length === 0) return tr('validation.emailRequired');
  const trimmed = v.trim();
  if (trimmed.length > 180) return tr('validation.emailMax');
  if (!EMAIL.test(trimmed)) return tr('validation.emailInvalid');
  return null;
};

export const validatePassword = (v?: string | null): string | null => {
  if (!v) return tr('validation.passwordRequired');
  if (v.length < 8) return tr('validation.passwordMin');
  if (v.length > 128) return tr('validation.passwordMax');
  if (!UPPER.test(v)) return tr('validation.passwordUpper');
  if (!LOWER.test(v)) return tr('validation.passwordLower');
  if (!DIGIT.test(v)) return tr('validation.passwordDigit');
  if (!SYMBOL.test(v)) return tr('validation.passwordSymbol');
  return null;
};

export const validateConfirmPassword = (v: string | null | undefined, original: string): string | null => {
  if (!v) return tr('validation.confirmRequired');
  if (v !== original) return tr('validation.confirmMismatch');
  return null;
};

export const validateBookTitle = (v?: string | null): string | null => {
  if (!v || v.trim().length === 0) return tr('validation.titleRequired');
  const trimmed = v.trim();
  if (trimmed.length > 150) return tr('validation.titleMax');
  return null;
};

export const validateParagraphContent = (v?: string | null): string | null => {
  if (!v || v.trim().length === 0) return tr('validation.paragraphRequired');
  if (v.length > 10000) return tr('validation.paragraphMax');
  return null;
};
