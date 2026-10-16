import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateBookTitle,
  validateParagraphContent,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  BOOK_TITLE_MAX_LENGTH,
  PARAGRAPH_MAX_LENGTH,
} from '../src/lib/validators';

describe('Frontend Data Validators - Casos de Éxito y Fracaso', () => {
  describe('validateName', () => {
    test('éxito: nombres válidos comunes y compuestos con acentos y guiones', () => {
      assert.equal(validateName('Ana García'), null);
      assert.equal(validateName('José María O\'Connor-López'), null);
      assert.equal(validateName('François Müller'), null);
    });

    test('éxito: longitudes límite mínimas y máximas', () => {
      assert.equal(validateName('Li'), null); // 2 caracteres
      assert.equal(validateName('A'.repeat(NAME_MAX_LENGTH)), null); // 120 caracteres
    });

    test('fracaso: nombre vacío o solo espacios', () => {
      assert.ok(validateName(''));
      assert.ok(validateName('   '));
      assert.ok(validateName(null));
      assert.ok(validateName(undefined));
    });

    test('fracaso: nombre menor a 2 caracteres', () => {
      assert.equal(validateName('A'), `Escribe tu nombre (mínimo ${NAME_MIN_LENGTH} letras).`);
    });

    test('fracaso: nombre que supera el límite máximo de 120 caracteres', () => {
      const longName = 'A'.repeat(NAME_MAX_LENGTH + 1);
      assert.equal(validateName(longName), `El nombre no puede superar los ${NAME_MAX_LENGTH} caracteres.`);
    });

    test('fracaso: nombre con caracteres no permitidos o números', () => {
      assert.ok(validateName('Juan123'));
      assert.ok(validateName('Pedro<script>'));
      assert.ok(validateName('Ana_Maria'));
      assert.ok(validateName('User@Domain'));
    });
  });

  describe('validateEmail', () => {
    test('éxito: correo con formato válido', () => {
      assert.equal(validateEmail('padre@escuela.com'), null);
      assert.equal(validateEmail('usuario.prueba+1@dominio.online'), null);
    });

    test('fracaso: correo vacío o inválido', () => {
      assert.ok(validateEmail(''));
      assert.ok(validateEmail('sin-arroba.com'));
      assert.ok(validateEmail('arroba@sin-punto'));
      assert.ok(validateEmail('con espacios@ejemplo.com'));
    });

    test('fracaso: correo que supera los 180 caracteres', () => {
      const longEmail = `${'a'.repeat(180)}@test.com`;
      assert.equal(validateEmail(longEmail), `El correo no puede superar los ${EMAIL_MAX_LENGTH} caracteres.`);
    });
  });

  describe('validatePassword', () => {
    test('éxito: contraseña fuerte cumpliendo todos los criterios', () => {
      assert.equal(validatePassword('Abcdef1!'), null);
      assert.equal(validatePassword('SuperSegura2026#'), null);
    });

    test('fracaso: longitud menor a 8 caracteres', () => {
      assert.equal(validatePassword('Aa1!'), `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
    });

    test('fracaso: longitud mayor a 128 caracteres', () => {
      const longPass = 'A1!a' + 'x'.repeat(PASSWORD_MAX_LENGTH);
      assert.equal(validatePassword(longPass), `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres.`);
    });

    test('fracaso: falta mayúscula, minúscula, número o símbolo', () => {
      assert.ok(validatePassword('solominusculas1!'));
      assert.ok(validatePassword('SOLOMAYUSCULAS1!'));
      assert.ok(validatePassword('SinNumerosNiSimbolo'));
      assert.ok(validatePassword('ConNumero1SinSimbolo'));
      assert.ok(validatePassword('ConSimbolo!SinNumero'));
    });
  });

  describe('validateBookTitle (Citas y Lecturas)', () => {
    test('éxito: título válido', () => {
      assert.equal(validateBookTitle('Cuentos de Primaria'), null);
      assert.equal(validateBookTitle('A'), null);
      assert.equal(validateBookTitle('T'.repeat(BOOK_TITLE_MAX_LENGTH)), null);
    });

    test('fracaso: título vacío o excediendo 150 caracteres', () => {
      assert.ok(validateBookTitle(''));
      assert.ok(validateBookTitle('   '));
      assert.equal(
        validateBookTitle('T'.repeat(BOOK_TITLE_MAX_LENGTH + 1)),
        `El título no puede superar los ${BOOK_TITLE_MAX_LENGTH} caracteres.`,
      );
    });
  });

  describe('validateParagraphContent', () => {
    test('éxito: contenido válido de lectura', () => {
      assert.equal(validateParagraphContent('The cat sat on the mat.'), null);
      assert.equal(validateParagraphContent('P'.repeat(PARAGRAPH_MAX_LENGTH)), null);
    });

    test('fracaso: párrafo vacío o excediendo 10000 caracteres', () => {
      assert.ok(validateParagraphContent(''));
      assert.ok(validateParagraphContent('   '));
      assert.equal(
        validateParagraphContent('P'.repeat(PARAGRAPH_MAX_LENGTH + 1)),
        `El párrafo no puede superar los ${PARAGRAPH_MAX_LENGTH} caracteres.`,
      );
    });
  });
});
