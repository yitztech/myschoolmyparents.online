/** Misma política que el frontend: mayúscula, minúscula, número, símbolo, mín. 8. */
export const PASSWORD_PATTERN = '^(?=.*[a-záéíóúüñ])(?=.*[A-ZÁÉÍÓÚÜÑ])(?=.*\\d)(?=.*[^A-Za-z0-9ÁÉÍÓÚáéíóúÜüÑñ ]).{8,}$';
export const PASSWORD_MESSAGE =
  'La contraseña debe tener mayúsculas, minúsculas, un número y un símbolo (mínimo 8 caracteres).';
