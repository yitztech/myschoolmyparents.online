import { expect, test } from '@playwright/test';
import { uniqueEmail, VALID_PASSWORD } from './helpers';

/**
 * Comprobaciones a nivel de API, sin navegador. Cubren las defensas que se
 * añadieron antes del despliegue y que desde la interfaz no se ven.
 */
test.describe('API', () => {
  test('el OCR exige sesión iniciada', async ({ request }) => {
    const res = await request.post('/api/ocr', {
      multipart: {
        image: { name: 'x.png', mimeType: 'image/png', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
      },
    });
    expect(res.status()).toBe(401);
  });

  test('el OCR rechaza lo que no es una imagen', async ({ request }) => {
    const email = uniqueEmail();
    await request.post('/api/auth/register', {
      data: { name: 'Prueba API', email, password: VALID_PASSWORD },
    });
    const login = await request.post('/api/auth/login', { data: { email, password: VALID_PASSWORD } });
    const { token } = await login.json();

    const res = await request.post('/api/ocr', {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        image: { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('no soy una imagen') },
      },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toMatch(/imagen/i);
  });

  test('cambiar la contraseña invalida las sesiones abiertas', async ({ request }) => {
    const email = uniqueEmail();
    const reg = await request.post('/api/auth/register', {
      data: { name: 'Prueba API', email, password: VALID_PASSWORD },
    });
    const { token } = await reg.json();

    // El token vale antes del cambio.
    const before = await request.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    expect(before.status()).toBe(200);

    // Reset con un código inventado: no cambia nada, pero el endpoint responde
    // siempre lo mismo para no revelar si la cuenta existe.
    const bad = await request.post('/api/auth/password/reset', {
      data: { email, code: '000000', newPassword: 'Nuevo2026#' },
    });
    expect(bad.status()).toBe(401);

    // Y el token sigue valiendo, porque la contraseña no llegó a cambiar.
    const after = await request.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    expect(after.status()).toBe(200);
  });

  test('la recuperación responde igual exista o no la cuenta', async ({ request }) => {
    const existente = uniqueEmail();
    await request.post('/api/auth/register', {
      data: { name: 'Prueba API', email: existente, password: VALID_PASSWORD },
    });

    const conCuenta = await request.post('/api/auth/password/recover', { data: { email: existente } });
    const sinCuenta = await request.post('/api/auth/password/recover', {
      data: { email: 'no-existe-nunca@example.com' },
    });

    expect(conCuenta.status()).toBe(sinCuenta.status());
    expect(await conCuenta.json()).toEqual(await sinCuenta.json());
  });

  test('el registro rechaza una contraseña débil', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { name: 'Prueba API', email: uniqueEmail(), password: 'corta' },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe('validation');
  });

  test('rechaza campos que no están en el contrato', async ({ request }) => {
    // El ValidationPipe va con forbidNonWhitelisted: un campo de más es un 400,
    // no algo que se ignore en silencio.
    const res = await request.post('/api/auth/register', {
      data: { name: 'Prueba API', email: uniqueEmail(), password: VALID_PASSWORD, isAdmin: true },
    });
    expect(res.status()).toBe(400);
  });
});
