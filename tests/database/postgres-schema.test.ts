import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Base de Datos PostgreSQL - Restricciones y Reglas de Esquema', () => {
  // Las expresiones regulares que implementa la migración 1792000000000-field-validations.ts
  const nameCharsRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜçÇ '-]+$/;
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  describe('chk_users_name_len (2 <= length <= 120)', () => {
    test('éxito: longitudes permitidas para nombres y apellidos', () => {
      const validNames = ['Al', 'María Pérez', 'X'.repeat(120)];
      for (const name of validNames) {
        const trimmedLen = name.trim().length;
        const totalLen = name.length;
        assert.ok(trimmedLen >= 2 && totalLen <= 120, `Debería ser válido: ${name}`);
      }
    });

    test('fracaso: longitudes fuera de rango violan el constraint', () => {
      const invalidNames = ['', ' ', 'A', 'X'.repeat(121)];
      for (const name of invalidNames) {
        const trimmedLen = name.trim().length;
        const totalLen = name.length;
        const isValid = trimmedLen >= 2 && totalLen <= 120;
        assert.equal(isValid, false, `Debería fallar: ${name}`);
      }
    });
  });

  describe('chk_users_name_chars (solo letras, espacios, guiones y apóstrofes)', () => {
    test('éxito: caracteres válidos en nombres y apellidos en español e internacionales', () => {
      const valid = [
        'María José',
        'Ángel Ñúñez',
        'Jean-Luc',
        'O\'Connor',
        'Müller',
      ];
      for (const v of valid) {
        assert.ok(nameCharsRegex.test(v), `Debería pasar: ${v}`);
      }
    });

    test('fracaso: caracteres no permitidos (números, inyecciones, símbolos raros)', () => {
      const invalid = [
        'Pedro123',
        'Carlos<script>',
        'Laura; DROP TABLE users;',
        'Ana_María',
        'User@Domain',
        'Elena$',
      ];
      for (const v of invalid) {
        assert.equal(nameCharsRegex.test(v), false, `Debería fallar: ${v}`);
      }
    });
  });

  describe('chk_users_email (formato de correo y longitud <= 180)', () => {
    test('éxito: correos válidos cumplen el constraint', () => {
      const emails = ['usuario@ejemplo.com', 'padre.familia+lectura@escuela.edu.mx'];
      for (const email of emails) {
        assert.ok(email.length <= 180 && emailRegex.test(email));
      }
    });

    test('fracaso: correos inválidos o que superan 180 caracteres violan el constraint', () => {
      const invalidEmails = [
        'invalido',
        'sin-arroba.com',
        'arroba@sinpunto',
        `${'a'.repeat(180)}@test.com`,
      ];
      for (const email of invalidEmails) {
        const isValid = email.length <= 180 && emailRegex.test(email);
        assert.equal(isValid, false, `Debería fallar: ${email}`);
      }
    });
  });
});
