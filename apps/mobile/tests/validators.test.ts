import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateConfirmPassword, validateEmail, validateName, validatePassword } from '../src/lib/validators.ts';

test('nombre', () => {
  assert.equal(validateName(''), 'Escribe tu nombre.');
  assert.equal(validateName('A'), 'El nombre debe tener al menos 2 letras.');
  assert.equal(validateName('Ana'), null);
});
test('correo', () => {
  assert.equal(validateEmail(null), 'Escribe tu correo electrónico.');
  assert.equal(validateEmail('ana@'), 'Ese correo no parece válido. Revísalo.');
  assert.equal(validateEmail(' ana@correo.com '), null);
});
test('contraseña exige longitud, mayúscula, minúscula, número y símbolo', () => {
  assert.equal(validatePassword('Ab1!'), 'Mínimo 8 caracteres.');
  assert.equal(validatePassword('abcdefg1!'), 'Añade al menos una mayúscula (A-Z).');
  assert.equal(validatePassword('ABCDEFG1!'), 'Añade al menos una minúscula (a-z).');
  assert.equal(validatePassword('Abcdefgh!'), 'Añade al menos un número (0-9).');
  assert.equal(validatePassword('Abcdefg12'), 'Añade al menos un símbolo (ej. !, @, #).');
  assert.equal(validatePassword('Abcdefg1!'), null);
});
test('confirmación', () => {
  assert.equal(validateConfirmPassword('', 'x'), 'Repite la contraseña.');
  assert.equal(validateConfirmPassword('y', 'x'), 'Las contraseñas no coinciden.');
  assert.equal(validateConfirmPassword('x', 'x'), null);
});
