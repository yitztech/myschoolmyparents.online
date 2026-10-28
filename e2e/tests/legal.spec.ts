import { expect, test } from '@playwright/test';
import { registerAccount, uniqueEmail, VALID_PASSWORD } from './helpers';

/**
 * Páginas públicas que enlazan las apps y las fichas de las tiendas: sus URL
 * no deben cambiar, y tienen que verse sin iniciar sesión.
 */
const LEGAL = [
  ['/legal/privacidad', 'Política de privacidad'],
  ['/legal/terminos', 'Términos y condiciones de uso'],
  ['/legal/cookies', 'Cookies y almacenamiento local'],
  ['/legal/eliminar-cuenta', 'Eliminar tu cuenta'],
] as const;

test.describe('Legal y descargas', () => {
  for (const [path, title] of LEGAL) {
    test(`${path} se ve sin sesión`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      // Nunca muestra el login en su lugar.
      await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toHaveCount(0);
    });
  }

  test('el pie enlaza los documentos legales y las descargas', async ({ page }) => {
    await page.goto('/');
    const pie = page.getByRole('navigation', { name: 'Información legal y descargas' });
    for (const [path] of LEGAL) await expect(pie.locator(`a[href="${path}"]`)).toHaveCount(1);
    await expect(pie.locator('a[href="/descargas"]')).toHaveCount(1);
  });

  test('/descargas ofrece Android e iOS y cuenta cada clic en Umami', async ({ page }) => {
    await page.goto('/descargas');
    await expect(page.getByRole('heading', { level: 1, name: /Descarga/ })).toBeVisible();
    for (const plataforma of ['android', 'ios']) {
      // El enlace lleva a la ruta interna /descargas/<plataforma> (el servidor elige
      // el instalador) o, si ya se detectó el release, a su URL directa. Ambas son
      // válidas: lo que se mide aquí es que cada clic se cuente con su atributo.
      const enlace = page.locator(`a[data-umami-event-plataforma="${plataforma}"]`);
      await expect(enlace).toHaveCount(1);
      await expect(enlace).toHaveAttribute('data-umami-event', 'descarga');
      await expect(enlace).toHaveAttribute('data-umami-event-version', /^\d+\.\d+\.\d+\+\d+$/);
      const href = await enlace.getAttribute('href');
      const github = 'https://github.com/yitztech/myschoolmyparents.online/releases/download/';
      expect(
        href === `/descargas/${plataforma}` || (href?.startsWith(github) ?? false),
      ).toBe(true);
    }
  });

  test('/descargas/<plataforma> redirige al instalador del último release', async ({ request }) => {
    for (const [plataforma, archivo] of [
      ['android', 'MySchoolMyParents-Online-android.apk'],
      ['ios', 'MySchoolMyParents-Online-ios-sin-firmar.ipa'],
    ]) {
      const res = await request.get(`/descargas/${plataforma}`, { maxRedirects: 0 });
      expect(res.status()).toBe(302);
      expect(res.headers()['location']).toBe(
        `https://github.com/yitztech/myschoolmyparents.online/releases/latest/download/${archivo}`,
      );
    }
  });

  test('eliminar la cuenta desde /legal/eliminar-cuenta', async ({ page, request }) => {
    const email = uniqueEmail();
    await registerAccount(page, email);
    await page.goto('/legal/eliminar-cuenta');

    // Contraseña equivocada: no borra nada.
    page.once('dialog', (d) => d.accept());
    await page.getByLabel('Contraseña').fill('Equivocada1!');
    await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
    await expect(page.getByRole('alert')).toContainText('no es correcta');

    page.once('dialog', (d) => d.accept());
    await page.getByLabel('Contraseña').fill(VALID_PASSWORD);
    await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
    // Hay otro role="status" en la página: la región sr-only global de avisos
    // (a11y-announcements). Se filtra por el mensaje, como en los pasos Gherkin.
    await expect(
      page.getByRole('status').filter({ hasText: 'Tu cuenta se ha eliminado' }),
    ).toBeVisible();

    const login = await request.post('/api/auth/login', { data: { email, password: VALID_PASSWORD } });
    expect(login.status()).toBe(401);
  });
});
