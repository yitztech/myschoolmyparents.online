import { expect, test } from '@playwright/test';
import { logout, registerAccount, uniqueEmail, VALID_PASSWORD } from './helpers';

test.describe('Autenticación', () => {
  test('la app abre en la pantalla de login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MySchoolMyParents/);
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('el registro inicia sesión y abre la biblioteca', async ({ page }) => {
    await registerAccount(page, uniqueEmail());
    await expect(page.getByRole('heading', { name: /Mi biblioteca/ })).toBeVisible();
  });

  test('rechaza una contraseña que incumple la política', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Regístrate' }).click();
    await page.getByLabel('Nombre').fill('Prueba E2E');
    await page.getByLabel('Correo electrónico').fill(uniqueEmail());
    await page.getByLabel('Contraseña', { exact: true }).fill('corta');
    await page.getByLabel('Confirmar contraseña').fill('corta');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    // Sigue en el registro: no ha creado nada.
    await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
  });

  test('cerrar sesión y volver a entrar con la misma cuenta', async ({ page }) => {
    const email = uniqueEmail();
    await registerAccount(page, email);
    await logout(page);

    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('heading', { name: /Mi biblioteca/ })).toBeVisible();
  });

  test('rechaza credenciales incorrectas', async ({ page }) => {
    const email = uniqueEmail();
    await registerAccount(page, email);
    await logout(page);

    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('OtraCosa9!');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert').first()).toContainText(/incorrect/i);
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('la recuperación llega al paso del código', async ({ page }) => {
    const email = uniqueEmail();
    await registerAccount(page, email);
    await logout(page);

    await page.getByRole('button', { name: /Recupérala|Olvidaste/i }).click();
    await expect(page.getByRole('heading', { name: 'Recuperar contraseña' })).toBeVisible();
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByRole('button', { name: 'Enviar código' }).click();
    await expect(page.getByLabel('Código')).toBeVisible();
  });
});

/**
 * Invariantes que cubren los arreglos hechos antes del despliegue. Si alguien
 * revierte `VITE_AUTH_API_URL=/api` o reintroduce el mock, estos fallan.
 */
test.describe('Invariantes de seguridad', () => {
  test('el bundle no lleva el mock de localStorage', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();
    const mockKeys = await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k === 'msm_users' || k === 'msm_reset_codes'),
    );
    expect(mockKeys).toEqual([]);
  });

  test('la sesión guarda un JWT del backend, no un token inventado', async ({ page }) => {
    await registerAccount(page, uniqueEmail());
    const token = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('msm_session') || '{}').token ?? '';
      } catch {
        return '';
      }
    });
    // Un JWT tiene tres segmentos; el mock generaba `tok_<base36>_<aleatorio>`.
    expect(token.split('.')).toHaveLength(3);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    expect(payload).toHaveProperty('sub');
    expect(payload).toHaveProperty('tv'); // tokenVersion: caduca sesiones al cambiar la contraseña
  });

  test('el botón de Google no se pinta sin OAuth configurado', async ({ page }) => {
    // El backend responde 410 en /api/auth/google, así que mostrarlo solo
    // llevaría a un error.
    await page.goto('/');
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();
    await expect(page.getByRole('button', { name: /Google/i })).toHaveCount(0);

    await page.getByRole('button', { name: 'Regístrate' }).click();
    await page.getByRole('heading', { name: 'Crear cuenta' }).waitFor();
    await expect(page.getByRole('button', { name: /Google/i })).toHaveCount(0);
  });

  test('el código de recuperación nunca se muestra en pantalla', async ({ page }) => {
    const email = uniqueEmail();
    await registerAccount(page, email);
    await logout(page);

    await page.getByRole('button', { name: /Recupérala|Olvidaste/i }).click();
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByRole('button', { name: 'Enviar código' }).click();
    await expect(page.getByLabel('Código')).toBeVisible();
    // "Vista previa local" solo aparece en modo mock.
    await expect(page.getByText(/Vista previa local/i)).toHaveCount(0);
  });
});
