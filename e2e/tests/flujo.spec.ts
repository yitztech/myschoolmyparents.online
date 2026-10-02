/**
 * Flujo principal de la web, de punta a punta: crear libro → subir una foto →
 * OCR en el backend → aprobar el borrador → leer. Usa la página de ejemplo de
 * la app móvil, que tiene texto conocido.
 */
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { registerAccount, uniqueEmail } from './helpers';

const SAMPLE_PAGE = resolve(__dirname, '../../apps/mobile/assets/sample/learning_page.png');

test('flujo principal: libro, OCR y lectura', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await registerAccount(page, uniqueEmail());

  await page.getByRole('button', { name: 'Crear libro' }).first().click();
  await page.getByLabel('Título').fill('Libro de prueba');
  await page.getByRole('button', { name: 'Crear', exact: true }).click();
  await page.getByRole('heading', { name: /Sumar/ }).waitFor();

  await page.getByLabel('Elegir fotos').setInputFiles(SAMPLE_PAGE);
  await page.getByRole('button', { name: /Importar 1 foto/ }).click();

  // El OCR pasa por el backend: aparece una tarjeta por revisar con el texto.
  const review = page.getByRole('region', { name: 'Pendientes por revisar' });
  await expect(review).toContainText('The cat is small', { timeout: 60_000 });

  await review.getByRole('button', { name: 'Añadir al libro' }).click();
  const reader = page.getByRole('region', { name: 'Lectura' });
  await expect(reader).toContainText('Learning is an adventure', { timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Escuchar todo' })).toBeEnabled();

  // Tras recargar, la sesión se revalida y el libro sigue (IndexedDB).
  await page.reload();
  await expect(page.getByText('Libro de prueba').first()).toBeVisible({ timeout: 15_000 });

  expect(errors, errors.join('\n')).toEqual([]);
});
