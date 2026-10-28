/**
 * Web en el móvil (§38 de la plataforma): los mismos flujos que la web con
 * perfil Android emulado (Chromium) en cada PR. Pixel 7: biblioteca sin
 * desborde horizontal y con objetivos táctiles de al menos 44×44.
 *
 * Lo ejecuta el proyecto `movil-android` de playwright.config.ts, que fija
 * el dispositivo.
 */
import { expect, test, type Page } from '@playwright/test';
import { registerAccount, uniqueEmail } from './helpers';

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

test.describe('Web en el móvil · Pixel 7: biblioteca', () => {
  test('biblioteca a 412px: sin desborde y con dedo', async ({ page }) => {
    await registerAccount(page, uniqueEmail());
    await sinDesbordeHorizontal(page);
    await sinBotonesPequenos(page);
  });
});
