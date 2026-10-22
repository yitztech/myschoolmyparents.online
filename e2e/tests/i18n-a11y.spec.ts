import { expect, test } from '@playwright/test';
import { registerAccount, uniqueEmail } from './helpers';

test.describe('i18n y Accesibilidad Avanzada', () => {
  test('conmutador de idiomas: cambia fluido entre los 5 idiomas y actualiza la UI', async ({ page }) => {
    await page.goto('/landing');

    // Abre el selector de idiomas
    const langBtn = page.getByRole('button', { name: /Idioma actual|Current language/i });
    await expect(langBtn).toBeVisible();
    await langBtn.click();

    // Comprueba presencia de los 5 idiomas
    await expect(page.getByRole('menuitem', { name: /Español/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /English/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Português/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Deutsch/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /Français/i })).toBeVisible();

    // 1. Cambiar a English
    await page.getByRole('menuitem', { name: /English/i }).click();
    await expect(page.getByText('From school paper to family voice').first()).toBeVisible();

    // 2. Cambiar a Deutsch
    await page.getByRole('button', { name: /Current language|Idioma actual/i }).click();
    await page.getByRole('menuitem', { name: /Deutsch/i }).click();
    await expect(page.getByText('Vom Schulpapier zur Familien-Stimme').first()).toBeVisible();

    // 3. Cambiar a Français
    await page.getByRole('button', { name: /Aktuelle Sprache|Idioma actual/i }).click();
    await page.getByRole('menuitem', { name: /Français/i }).click();
    await expect(page.getByText('Du papier scolaire à la voix familiale').first()).toBeVisible();

    // 4. Cambiar a Português
    await page.getByRole('button', { name: /Langue actuelle|Idioma actual/i }).click();
    await page.getByRole('menuitem', { name: /Português/i }).click();
    await expect(page.getByText('Do papel da escola à voz da família').first()).toBeVisible();

    // 5. Regresar a Español
    await page.getByRole('button', { name: /Idioma atual|Idioma actual/i }).click();
    await page.getByRole('menuitem', { name: /Español/i }).click();
    await expect(page.getByText('Del papel de la escuela a la voz de casa').first()).toBeVisible();
  });

  test('landing page y descargas muestran enlaces válidos de release', async ({ page }) => {
    await page.goto('/landing');
    await expect(page.getByRole('heading', { name: /voz de casa/i })).toBeVisible();

    // Enlace de descarga en landing
    const downloadCta = page.getByRole('link', { name: /Descargar app móvil/i });
    await expect(downloadCta).toBeVisible();

    // Página de descargas
    await page.goto('/descargas');
    await expect(page.getByRole('heading', { name: /Descargas/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Descargar APK/i }).first()).toBeVisible();
  });

  test('lector: alto contraste, escalado de fuente y atajos de teclado', async ({ page }) => {
    await registerAccount(page, uniqueEmail());

    // Crear libro
    await page.getByRole('button', { name: 'Crear libro' }).first().click();
    await page.getByLabel('Título').fill('Libro Accesibilidad');
    await page.getByRole('button', { name: 'Crear', exact: true }).click();
    await page.getByRole('heading', { name: /Sumar/ }).waitFor();

    // Barra de accesibilidad presente
    const a11yToolbar = page.getByRole('region', { name: /Accesibilidad/i });
    await expect(a11yToolbar).toBeVisible();

    // Cambiar a Alto Contraste Oscuro
    const contrastBtn = a11yToolbar.getByRole('button', { name: /Contraste/i });
    await contrastBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'hc-dark');

    // Cambiar a Alto Contraste Claro
    await contrastBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'hc-light');

    // Aumentar fuente con botón A+
    const btnIncreaseFont = a11yToolbar.getByRole('button', { name: /Aumentar tamaño de letra/i });
    await btnIncreaseFont.click();
    await btnIncreaseFont.click();

    // Activar Modo Enfoque
    const focusBtn = a11yToolbar.getByRole('button', { name: /Modo Enfoque/i });
    await focusBtn.click();
    await expect(focusBtn).toHaveText(/Párrafo activo/i);
  });
});
