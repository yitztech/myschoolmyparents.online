import type { Page } from '@playwright/test';

/** Contraseña que cumple la política (mayúscula, minúscula, número, símbolo, 8+). */
export const VALID_PASSWORD = 'Abcdef1!';

/**
 * Correo único por cuenta creada. El prefijo `e2e_` permite limpiarlas luego:
 *   docker compose --env-file .env.dev exec db \
 *     psql -U msm -d myschoolmyparents -c "DELETE FROM users WHERE email LIKE 'e2e_%@example.com';"
 */
export function uniqueEmail(): string {
  return `e2e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}@example.com`;
}

/**
 * Registra una cuenta desde la interfaz y deja la sesión iniciada.
 *
 * Ojo con el selector de la contraseña: el botón de mostrar/ocultar lleva
 * aria-label "Mostrar contraseña", así que sin `exact` el localizador casa
 * con dos elementos y Playwright falla por modo estricto.
 */
export async function registerAccount(page: Page, email: string, name = 'Prueba E2E') {
  await page.goto('/');
  await page.getByRole('button', { name: 'Regístrate' }).click();
  await page.getByRole('heading', { name: 'Crear cuenta' }).waitFor();
  await page.getByLabel('Nombre').fill(name);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(VALID_PASSWORD);
  await page.getByLabel('Confirmar contraseña').fill(VALID_PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByRole('heading', { name: /Mi biblioteca/ }).waitFor();
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();
}
