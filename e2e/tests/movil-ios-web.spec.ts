/**
 * Web en el móvil (§38 de la plataforma): los mismos flujos que la web con
 * perfil iPhone emulado (WebKit) en cada PR.
 *
 *  - iPhone 14: flujo completo con OCR. Es el perfil donde se encontró que
 *    IndexedDB de WebKit no almacena ningún `Blob` (solo bytes en crudo),
 *    así que este escenario es la regresión de eso.
 *  - iPhone SE: la pantalla más estrecha habitual (320px): nada se sale de
 *    la ventana ni queda objetivo táctil menor de 44px.
 *
 * Lo ejecuta el proyecto `movil-ios` de playwright.config.ts; el dispositivo
 * base lo pone la configuración del proyecto. Requiere WebKit instalado
 * (`npx playwright install webkit`); el CI lo instala.
 */
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { devices, expect, test, type Page } from '@playwright/test';
import { registerAccount, uniqueEmail } from './helpers';

const SAMPLE_PAGE = resolve(fileURLToPath(import.meta.url), '..', '..', '..', 'apps', 'mobile', 'assets', 'sample', 'learning_page.png');

test.setTimeout(120_000);

/** El documento no debe hacer scroll horizontal: nada sobresale de la ventana. */
async function sinDesbordeHorizontal(page: Page) {
  const m = await page.evaluate(() => ({
    scroll: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0),
    ventana: window.innerWidth,
  }));
  expect(
    m.scroll,
    `scroll ${m.scroll}px > ventana ${m.ventana}px: hay scroll horizontal`
  ).toBeLessThanOrEqual(m.ventana);
}

/**
 * Todo lo interactivo mide al menos 44×44 (mínimo de dedo de iOS).
 * Solo sobre biblioteca: en el lector las palabras del texto son botones
 * inline, exentos por WCAG 2.5.8 (Target Size · Inline).
 */
async function sinBotonesPequenos(page: Page) {
  const chicos = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll('button, [role="button"], input, select, a[role="button"]')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && Math.min(r.width, r.height) < 44) {
        const texto = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30);
        out.push(`${el.tagName.toLowerCase()} «${texto}» ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
    }
    return out;
  });
  expect(chicos, `objetivos táctiles <44px: ${chicos.join(' · ')}`).toEqual([]);
}

test.describe('Web en el móvil · iPhone 14: flujo completo con OCR', () => {
  test('registro, libro, OCR y lector sin desborde', async ({ page }) => {
    await registerAccount(page, uniqueEmail());
    await sinDesbordeHorizontal(page);

    await page.getByRole('button', { name: 'Crear libro' }).first().click();
    await page.getByLabel('Título').fill('Libro en el móvil');
    await page.getByRole('button', { name: 'Crear', exact: true }).click();
    await page.getByRole('heading', { name: /Sumar/ }).waitFor();

    await page.getByLabel('Elegir fotos').setInputFiles(SAMPLE_PAGE);
    await page.getByRole('button', { name: /Importar/ }).click();

    // La imagen se guarda como bytes y el OCR llega: regresión del Blob de WebKit.
    const revision = page.getByRole('region', { name: 'Pendientes por revisar' });
    await expect(revision).toContainText('The cat is small', { timeout: 60_000 });

    await revision.getByRole('button', { name: 'Añadir al libro' }).click();
    const lector = page.getByRole('region', { name: 'Lectura' });
    await expect(lector).toContainText('Learning is an adventure', { timeout: 15_000 });
    await sinDesbordeHorizontal(page);
  });
});

test.describe('Web en el móvil · iPhone SE: pantalla estrecha', () => {
  // Solo viewport/UA del SE: `defaultBrowserType` no puede ir en test.use
  // (forzaría un worker nuevo); el motor lo fija el proyecto `movil-ios`.
  const { defaultBrowserType: _motor, ...perfil } = devices['iPhone SE'];
  test.use({ ...perfil, locale: 'es-ES' });

  test('biblioteca a 320px: sin desborde y con dedo', async ({ page }) => {
    await registerAccount(page, uniqueEmail());
    await sinDesbordeHorizontal(page);
    await sinBotonesPequenos(page);
  });
});
