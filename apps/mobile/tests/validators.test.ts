import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBookTitle, validateConfirmPassword, validateEmail, validateName, validatePassword } from '../src/lib/validators.ts';
import { translate } from '../src/i18n/index.ts';

const es = (key: string) => translate('es', key);

test('nombre', () => {
  assert.equal(validateName(''), es('validation.nameRequired'));
  assert.equal(validateName('A'), es('validation.nameMin'));
  assert.equal(validateName('Ana'), null);
});
test('correo', () => {
  assert.equal(validateEmail(null), es('validation.emailRequired'));
  assert.equal(validateEmail('ana@'), es('validation.emailInvalid'));
  assert.equal(validateEmail(' ana@correo.com '), null);
});
test('contraseña exige longitud, mayúscula, minúscula, número y símbolo', () => {
  assert.equal(validatePassword('Ab1!'), es('validation.passwordMin'));
  assert.equal(validatePassword('abcdefg1!'), es('validation.passwordUpper'));
  assert.equal(validatePassword('ABCDEFG1!'), es('validation.passwordLower'));
  assert.equal(validatePassword('Abcdefgh!'), es('validation.passwordDigit'));
  assert.equal(validatePassword('Abcdefg12'), es('validation.passwordSymbol'));
  assert.equal(validatePassword('Abcdefg1!'), null);
});
test('confirmación', () => {
  assert.equal(validateConfirmPassword('', 'x'), es('validation.confirmRequired'));
  assert.equal(validateConfirmPassword('y', 'x'), es('validation.confirmMismatch'));
  assert.equal(validateConfirmPassword('x', 'x'), null);
});
test('título del libro: obligatorio y hasta 150 caracteres', () => {
  assert.equal(validateBookTitle('   '), es('validation.titleRequired'));
  assert.equal(validateBookTitle('a'.repeat(150)), null);
  assert.equal(validateBookTitle('a'.repeat(151)), es('validation.titleMax'));
});
