export interface PasswordChecks {
  minLength: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  symbol: boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

export function checkPassword(password: string): PasswordChecks {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    upper: /[A-ZÁÉÍÓÚÜÑ]/.test(password),
    lower: /[a-záéíóúüñ]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9ÁÉÍÓÚáéíóúÜüÑñ ]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const c = checkPassword(password);
  return c.minLength && c.upper && c.lower && c.number && c.symbol;
}

export const PASSWORD_RULE_LABELS: { key: keyof PasswordChecks; label: string }[] = [
  { key: 'minLength', label: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres` },
  { key: 'upper', label: 'Una mayúscula (A–Z)' },
  { key: 'lower', label: 'Una minúscula (a–z)' },
  { key: 'number', label: 'Un número (0–9)' },
  { key: 'symbol', label: 'Un símbolo (!, @, #, …)' },
];

export function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
