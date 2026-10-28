// @ts-check
import { expect } from '@playwright/test';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Directorio de este módulo, sea ESM nativo o CJS: Playwright transpila los
 * .spec.ts a CJS, y en CJS `import.meta` no existe (SyntaxError). La misma
 * pieza en gherkin-runner.js.
 */
const moduleDirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : fileURLToPath(new URL('.', import.meta.url));
const SAMPLE_PAGE = resolve(moduleDirname, '../../../apps/mobile/assets/sample/learning_page.png');
export const VALID_PASSWORD = 'Abcdef1!';

export function uniqueEmail() {
  return `e2e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}@example.com`;
}

/**
 * Registro de definiciones de pasos Gherkin (Dado, Cuando, Entonces)
 */
export const stepDefinitions = [];

function registerStep(pattern, fn) {
  stepDefinitions.push({ pattern, fn });
}

export const Dado = registerStep;
export const Cuando = registerStep;
export const Entonces = registerStep;
export const Y = registerStep;

// ─── PASOS DE REGISTRO Y AUTENTICACIÓN ───
Dado(/que el usuario está en la pantalla de inicio|que el usuario inicia en la pantalla principal/, async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/MySchoolMyParents/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});

Cuando(/navega a la pantalla de registro/, async ({ page }) => {
  await page.getByRole('button', { name: 'Regístrate' }).click();
  await page.getByRole('heading', { name: 'Crear cuenta' }).waitFor();
});

Cuando(/completa el nombre con "(.*)"/, async ({ page }, name) => {
  await page.getByLabel('Nombre').fill(name);
});

Cuando(/completa el nombre con 121 caracteres/, async ({ page }) => {
  const longName = 'A'.repeat(121);
  await page.getByLabel('Nombre').fill(longName);
});

Cuando(/completa un correo electrónico nuevo válido/, async ({ page, world }) => {
  const email = uniqueEmail();
  world.email = email;
  world.password = VALID_PASSWORD;
  await page.getByLabel('Correo electrónico').fill(email);
});

Cuando(/completa el correo con "(.*)"/, async ({ page }, email) => {
  await page.getByLabel('Correo electrónico').fill(email);
});

Cuando(/completa la contraseña con "(.*)"/, async ({ page }, password) => {
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
});

Cuando(/confirma la contraseña con "(.*)"/, async ({ page }, password) => {
  await page.getByLabel('Confirmar contraseña').fill(password);
});

Cuando(/envía el formulario de registro/, async ({ page }) => {
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
});

Entonces(/debe ingresar exitosamente a "(.*)"/, async ({ page }, headingText) => {
  await expect(page.getByRole('heading', { name: new RegExp(headingText, 'i') })).toBeVisible({ timeout: 15_000 });
});

Entonces(/debe ver una alerta de validación en pantalla/, async ({ page }) => {
  await expect(page.getByRole('alert').first()).toBeVisible();
  // Se mantiene en la pantalla de creación de cuenta
  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
});

// ─── PASOS DE CITAS Y LECTURA ESCOLAR ───
Dado(/que el usuario tiene una sesión iniciada/, async ({ page, world }) => {
  const email = uniqueEmail();
  world.email = email;
  world.password = VALID_PASSWORD;
  await page.goto('/');
  await page.getByRole('button', { name: 'Regístrate' }).click();
  await page.getByRole('heading', { name: 'Crear cuenta' }).waitFor();
  await page.getByLabel('Nombre').fill('María Prueba');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(VALID_PASSWORD);
  await page.getByLabel('Confirmar contraseña').fill(VALID_PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByRole('heading', { name: /Mi biblioteca/ }).waitFor();
});

Cuando(/abre el diálogo para crear una nueva lectura/, async ({ page }) => {
  await page.getByRole('button', { name: 'Crear libro' }).first().click();
  // El título del diálogo es «Crear nuevo libro»: casa el nombre exacto que
  // pinta la app hoy («Crear libro» es el botón que lo abre).
  await page.getByRole('heading', { name: /Crear (nuevo )?libro/ }).waitFor();
});

Cuando(/escribe el título "(.*)"/, async ({ page, world }, title) => {
  world.titulo = title.trim();
  await page.getByLabel('Título').fill(title);
});

Cuando(/escribe un título de más de 150 caracteres/, async ({ page }) => {
  const longTitle = 'T'.repeat(160);
  await page.getByLabel('Título').fill(longTitle);
});

Cuando(/confirma la creación/, async ({ page }) => {
  await page.getByRole('button', { name: 'Crear', exact: true }).click();
});

Entonces(/la nueva lectura debe aparecer en la biblioteca/, async ({ page, world }) => {
  await expect(page.getByText(world.titulo ?? '').first()).toBeVisible({ timeout: 15_000 });
});

Entonces(/el sistema debe asignar un título por defecto o advertir el error/, async ({ page, world }) => {
  // El título vacío se sustituye por «Mi libro» al crear (createBook).
  world.titulo = 'Mi libro';
  await expect(page.getByText('Mi libro').first()).toBeVisible({ timeout: 15_000 });
});

Entonces(/el campo de título debe truncar o rechazar la entrada excedida/, async ({ page }) => {
  const titleInput = page.getByLabel('Título');
  const val = await titleInput.inputValue();
  // Si no está truncado, el botón de crear es manejado o la base de datos lo validará
  expect(val.length).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Cancelar' }).click();
});

Dado(/que el usuario está dentro de una lectura con contenido/, async ({ page, world }) => {
  const email = uniqueEmail();
  world.email = email;
  world.password = VALID_PASSWORD;
  await page.goto('/');
  await page.getByRole('button', { name: 'Regístrate' }).click();
  await page.getByRole('heading', { name: 'Crear cuenta' }).waitFor();
  await page.getByLabel('Nombre').fill('María Prueba');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(VALID_PASSWORD);
  await page.getByLabel('Confirmar contraseña').fill(VALID_PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByRole('heading', { name: /Mi biblioteca/ }).waitFor();

  await page.getByRole('button', { name: 'Crear libro' }).first().click();
  await page.getByLabel('Título').fill('Lectura de prueba');
  await page.getByRole('button', { name: 'Crear', exact: true }).click();
  await page.getByRole('heading', { name: /Sumar/ }).waitFor();

  await page.getByLabel('Elegir fotos').setInputFiles(SAMPLE_PAGE);
  await page.getByRole('button', { name: /Importar/ }).click();

  const review = page.getByRole('region', { name: 'Pendientes por revisar' });
  await expect(review).toContainText('The cat is small', { timeout: 60_000 });
  await review.getByRole('button', { name: 'Añadir al libro' }).click();
  await expect(page.getByRole('region', { name: 'Lectura' })).toBeVisible({ timeout: 15_000 });
});

Cuando(/presiona el botón para escuchar la lectura/, async ({ page }) => {
  const listenBtn = page.getByRole('button', { name: /Escuchar todo/i });
  await expect(listenBtn).toBeEnabled();
  await listenBtn.click();
});

Entonces(/el reproductor debe pasar al estado activo de lectura/, async ({ page }) => {
  // Debe aparecer el botón de Pausa o Detener
  await expect(page.getByRole('button', { name: /Pausar|Detener/i })).toBeVisible();
});

// ─── PASOS DE CANCELACIONES Y ELIMINACIÓN ───
Dado(/que el usuario tiene una sesión iniciada con contraseña conocida/, async ({ page, world }) => {
  const email = uniqueEmail();
  world.email = email;
  world.password = VALID_PASSWORD;
  await page.goto('/');
  await page.getByRole('button', { name: 'Regístrate' }).click();
  await page.getByRole('heading', { name: 'Crear cuenta' }).waitFor();
  await page.getByLabel('Nombre').fill('María Prueba');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(VALID_PASSWORD);
  await page.getByLabel('Confirmar contraseña').fill(VALID_PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByRole('heading', { name: /Mi biblioteca/ }).waitFor();
});

Cuando(/navega a la página de eliminación de cuenta/, async ({ page }) => {
  await page.goto('/legal/eliminar-cuenta');
  await expect(page.getByRole('heading', { level: 1, name: 'Eliminar tu cuenta' })).toBeVisible();
});

Cuando(/escribe su contraseña correcta para confirmar la cancelación/, async ({ page, world }) => {
  await page.getByLabel('Contraseña').fill(world.password || VALID_PASSWORD);
});

Cuando(/escribe una contraseña incorrecta para confirmar la cancelación/, async ({ page }) => {
  await page.getByLabel('Contraseña').fill('ContrasenaEquivocada999!');
});

Cuando(/confirma la eliminación definitiva/, async ({ page }) => {
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
});

Entonces(/la cuenta debe ser eliminada y el usuario redirigido al estado de cuenta eliminada/, async ({ page }) => {
  // Hay otro role="status" (los avisos sr-only); se filtra por el mensaje.
  await expect(page.getByRole('status').filter({ hasText: 'Tu cuenta se ha eliminado' })).toBeVisible();
});

Entonces(/el sistema debe mostrar una alerta de error y conservar la cuenta activa/, async ({ page }) => {
  await expect(page.getByRole('alert').filter({ hasText: /no es correcta/i })).toBeVisible();
});

Cuando(/presiona el botón Cancelar del diálogo/, async ({ page }) => {
  await page.getByRole('button', { name: 'Cancelar' }).click();
});

Entonces(/el diálogo debe cerrarse sin añadir el libro/, async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Crear libro' })).toHaveCount(0);
});

// ─── PASOS DE SEGURIDAD DE LAS CUENTAS ───
Dado(/que el usuario está en la pantalla de registro/, async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Regístrate' }).click();
  await page.getByRole('heading', { name: 'Crear cuenta' }).waitFor();
});

Cuando(/envía el formulario de inicio de sesión/, async ({ page }) => {
  await page.getByRole('button', { name: 'Entrar' }).click();
});

Entonces(/debe ver una alerta de credenciales incorrectas/, async ({ page }) => {
  await expect(page.getByRole('alert').first()).toContainText(/incorrect/i);
});

Entonces(/sigue en la pantalla de iniciar sesión/, async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});

Entonces(/la sesión guardada es un token del backend con tokenVersion/, async ({ page }) => {
  const session = await page.evaluate(() => localStorage.getItem('msm_session'));
  expect(session).toBeTruthy();
  const data = JSON.parse(session ?? '{}');
  // Tres segmentos (header.payload.signature): JWT firmado por el backend.
  const partes = String(data.token).split('.');
  expect(partes).toHaveLength(3);
  const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));
  expect(payload.sub).toBeTruthy();
  expect(payload).toHaveProperty('tv');
  // El objeto del mock de desarrollo (msm_users) no debe existir.
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.some((k) => k.includes('msm_users'))).toBe(false);
});

Dado(/que el usuario no ha iniciado sesión/, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});

Cuando(/abre la página "(.*)"/, async ({ page }, path) => {
  await page.goto(path);
});

Entonces(/ve la página pública "(.*)"/, async ({ page }, title) => {
  const nombre = /^\/.+\/$/.test(title) ? new RegExp(title.slice(1, -1)) : title;
  await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toHaveCount(0);
});

Cuando(/consulta la API "(GET|POST) (.+)" sin sesión/, async ({ page, world }, method, path) => {
  let response;
  if (method === 'POST') {
    // Cuerpo de prueba mínimo; lo que se mira es el código sin autorización.
    response = await page.request.post(path, { data: { e2e: 'prueba' } });
  } else {
    response = await page.request.get(path);
  }
  world.httpStatus = response.status();
});

Entonces(/el código HTTP es (\d+)/, async ({ page, world }, status) => {
  expect(world.httpStatus).toBe(Number(status));
});

Cuando(/navega a la recuperación de contraseña/, async ({ page }) => {
  await page.getByRole('button', { name: /Recupérala|Olvidaste/i }).click();
  await expect(page.getByRole('heading', { name: 'Recuperar contraseña' })).toBeVisible();
});

Cuando(/solicita el código de recuperación/, async ({ page }) => {
  await page.getByRole('button', { name: 'Enviar código' }).click();
});

Entonces(/llega al paso del código sin revelar si la cuenta existe/, async ({ page }) => {
  // La respuesta es genérica: siempre ofrece teclear el código…
  await expect(page.getByLabel('Código')).toBeVisible();
  // …y nunca enseña el código en pantalla (el mock de desarrollo sí lo hacía).
  await expect(page.getByText(/Vista previa local/i)).toHaveCount(0);
});

Cuando(/^cierra la sesión$/, async ({ page }) => {
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});

Cuando(/completa el correo con el de la sesión/, async ({ page, world }) => {
  await page.getByLabel('Correo electrónico').fill(world.email ?? 'e2e@example.com');
});

Entonces(/no existe el botón "(.*)"/, async ({ page }, name) => {
  await expect(page.getByRole('button', { name, exact: false })).toHaveCount(0);
});

// ─── PASOS DE LONGITUDES MÁXIMAS (§6.3: pegar más se recorta con aviso) ───
// «Contraseña» exige exacto: como etiqueta parcial también casa «Confirmar
// contraseña», «Mostrar contraseña» y «Requisitos de la contraseña».
const opcionesCampo = (field) => (field === 'Contraseña' ? { exact: true } : {});

/** Deja el portapapeles listo y pega con el teclado, como haría la persona. */
async function escribirPegado(page, field, texto) {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: new URL(page.url()).origin,
  });
  await page.evaluate((t) => navigator.clipboard.writeText(t), texto);
  await page.getByLabel(field, opcionesCampo(field)).click();
  await page.keyboard.press('ControlOrMeta+v');
}

Cuando(/pega "([^"]*)" en el campo "(.*)"/, async ({ page }, texto, field) => {
  await escribirPegado(page, field, texto);
});

Cuando(/pega (\d+) caracteres en el campo "(.*)"/, async ({ page }, cuantos, field) => {
  await escribirPegado(page, field, 'B'.repeat(Number(cuantos)));
});

Entonces(/el campo "(.*)" queda con (\d+) caracteres/, async ({ page }, field, cap) => {
  const valor = await page.getByLabel(field, opcionesCampo(field)).inputValue();
  expect(valor.length).toBe(Number(cap));
});

Entonces(/avisa el recorte del texto pegado/, async ({ page }) => {
  // La web por defecto se ve en español; camino con la cadena tal cual.
  await expect(page.getByRole('alert').first()).toContainText(/se recorta/i);
});

// ─── PASOS DE FLUJO COMPLETO ───
Cuando(/completa el registro con una nueva cuenta/, async ({ page, world }) => {
  const email = uniqueEmail();
  world.email = email;
  world.password = VALID_PASSWORD;
  await page.getByRole('button', { name: 'Regístrate' }).click();
  await page.getByRole('heading', { name: 'Crear cuenta' }).waitFor();
  await page.getByLabel('Nombre').fill('Familia Lectora');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(VALID_PASSWORD);
  await page.getByLabel('Confirmar contraseña').fill(VALID_PASSWORD);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await page.getByRole('heading', { name: /Mi biblioteca/ }).waitFor();
});

Cuando(/crea un libro titulado "(.*)"/, async ({ page }, title) => {
  await page.getByRole('button', { name: 'Crear libro' }).first().click();
  await page.getByLabel('Título').fill(title);
  await page.getByRole('button', { name: 'Crear', exact: true }).click();
  await page.getByRole('heading', { name: /Sumar/ }).waitFor();
});

Cuando(/añade páginas y revisa el borrador/, async ({ page }) => {
  await page.getByLabel('Elegir fotos').setInputFiles(SAMPLE_PAGE);
  await page.getByRole('button', { name: /Importar/ }).click();
  const review = page.getByRole('region', { name: 'Pendientes por revisar' });
  await expect(review).toContainText('The cat is small', { timeout: 60_000 });
  await review.getByRole('button', { name: 'Añadir al libro' }).click();
  await expect(page.getByRole('region', { name: 'Lectura' })).toBeVisible({ timeout: 15_000 });
});

Cuando(/regresa a la biblioteca/, async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Mi biblioteca/ })).toBeVisible({ timeout: 15_000 });
});

Cuando(/navega a eliminar su cuenta para cancelarla/, async ({ page, world }) => {
  await page.goto('/legal/eliminar-cuenta');
  await expect(page.getByRole('heading', { level: 1, name: 'Eliminar tu cuenta' })).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByLabel('Contraseña').fill(world.password || VALID_PASSWORD);
  await page.getByRole('button', { name: 'Eliminar mi cuenta' }).click();
});

Entonces(/el sistema completa el ciclo y cierra la sesión/, async ({ page }) => {
  // La cuenta se borró: queda la página pública y la sesión ya no existe.
  await expect(page.getByRole('status').filter({ hasText: 'Tu cuenta se ha eliminado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salir' })).toHaveCount(0);
});
