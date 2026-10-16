import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validateBookTitle, validateParagraphContent } from '../../apps/frontend/src/lib/validators';

describe('Base de Datos IndexedDB (Frontend Dexie) - Validaciones y Restricciones a Nivel de Base de Datos', () => {
  // Simulación fiel de los hooks de Dexie definidos en apps/frontend/src/lib/db.ts
  function simulateDexieBooksCreatingHook(obj: { title: string }) {
    const err = validateBookTitle(obj.title);
    if (err) throw new Error(`Restricción de base de datos fallida en libro: ${err}`);
  }

  function simulateDexieParagraphsCreatingHook(obj: { content: string }) {
    const err = validateParagraphContent(obj.content);
    if (err) throw new Error(`Restricción de base de datos fallida en párrafo: ${err}`);
  }

  describe('Hook de validación en tabla books (Citas/Lecturas)', () => {
    test('éxito: permite almacenar libro con título válido (1 a 150 caracteres)', () => {
      assert.doesNotThrow(() => {
        simulateDexieBooksCreatingHook({ title: 'Mi Primer Libro Escolar' });
        simulateDexieBooksCreatingHook({ title: 'A' });
        simulateDexieBooksCreatingHook({ title: 'T'.repeat(150) });
      });
    });

    test('fracaso: rechaza almacenar libro con título vacío', () => {
      assert.throws(
        () => simulateDexieBooksCreatingHook({ title: '' }),
        /Restricción de base de datos fallida en libro: El título no puede estar vacío\./,
      );
      assert.throws(
        () => simulateDexieBooksCreatingHook({ title: '   ' }),
        /Restricción de base de datos fallida en libro: El título no puede estar vacío\./,
      );
    });

    test('fracaso: rechaza almacenar libro con título que excede 150 caracteres', () => {
      assert.throws(
        () => simulateDexieBooksCreatingHook({ title: 'T'.repeat(151) }),
        /Restricción de base de datos fallida en libro: El título no puede superar los 150 caracteres\./,
      );
    });
  });

  describe('Hook de validación en tabla paragraphs', () => {
    test('éxito: permite almacenar párrafos con longitud de 1 a 10000 caracteres', () => {
      assert.doesNotThrow(() => {
        simulateDexieParagraphsCreatingHook({ content: 'Once upon a time in a school reading.' });
        simulateDexieParagraphsCreatingHook({ content: 'P'.repeat(10000) });
      });
    });

    test('fracaso: rechaza párrafos vacíos o que exceden 10000 caracteres', () => {
      assert.throws(
        () => simulateDexieParagraphsCreatingHook({ content: '' }),
        /Restricción de base de datos fallida en párrafo: El contenido de la lectura no puede estar vacío\./,
      );
      assert.throws(
        () => simulateDexieParagraphsCreatingHook({ content: 'P'.repeat(10001) }),
        /Restricción de base de datos fallida en párrafo: El párrafo no puede superar los 10000 caracteres\./,
      );
    });
  });
});
