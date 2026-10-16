import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { CREATE_STATEMENTS } from '../../apps/mobile/src/db/schema';

describe('Base de Datos SQLite (Móvil) - Restricciones y Validaciones (CHECK Constraints)', () => {
  let db: DatabaseSync;

  test('configuración: aplica CREATE_STATEMENTS con restricciones CHECK', () => {
    db = new DatabaseSync(':memory:');
    for (const sql of CREATE_STATEMENTS) {
      db.exec(sql);
    }
    assert.ok(db);
  });

  describe('Tabla books', () => {
    test('éxito: inserta libro con título válido dentro de 1 a 150 caracteres', () => {
      const now = Date.now();
      const insert = db.prepare(`
        INSERT INTO books (id, title, learning_locale, home_locale, created_at, updated_at)
        VALUES (?, ?, 'en-US', 'es-MX', ?, ?)
      `);
      insert.run('book-ok-1', 'Cuentos de la Selva', now, now);
      insert.run('book-ok-2', 'A', now, now); // longitud mínima: 1
      insert.run('book-ok-3', 'T'.repeat(150), now, now); // longitud máxima: 150

      const row = db.prepare('SELECT COUNT(*) as c FROM books').get() as { c: number };
      assert.equal(row.c, 3);
    });

    test('fracaso: rechaza libro con título vacío (viola CHECK length(trim(title)) >= 1)', () => {
      const now = Date.now();
      const insert = db.prepare(`
        INSERT INTO books (id, title, learning_locale, home_locale, created_at, updated_at)
        VALUES (?, ?, 'en-US', 'es-MX', ?, ?)
      `);

      assert.throws(
        () => {
          insert.run('book-fail-empty', '', now, now);
        },
        /CHECK constraint failed/,
      );

      assert.throws(
        () => {
          insert.run('book-fail-spaces', '    ', now, now);
        },
        /CHECK constraint failed/,
      );
    });

    test('fracaso: rechaza libro con título que supera los 150 caracteres', () => {
      const now = Date.now();
      const insert = db.prepare(`
        INSERT INTO books (id, title, learning_locale, home_locale, created_at, updated_at)
        VALUES (?, ?, 'en-US', 'es-MX', ?, ?)
      `);

      assert.throws(
        () => {
          insert.run('book-fail-long', 'T'.repeat(151), now, now);
        },
        /CHECK constraint failed/,
      );
    });
  });

  describe('Tabla paragraphs (Citas y párrafos de lectura)', () => {
    test('éxito: inserta párrafo con longitud válida', () => {
      const insert = db.prepare(`
        INSERT INTO paragraphs (id, book_id, page_id, order_key, content)
        VALUES (?, 'book-ok-1', 'page-1', 1, ?)
      `);
      insert.run('para-1', 'The cat is on the table.');
      insert.run('para-2', 'P'.repeat(10000)); // límite máximo

      const row = db.prepare('SELECT COUNT(*) as c FROM paragraphs').get() as { c: number };
      assert.equal(row.c, 2);
    });

    test('fracaso: rechaza párrafo que supera los 10000 caracteres', () => {
      const insert = db.prepare(`
        INSERT INTO paragraphs (id, book_id, page_id, order_key, content)
        VALUES (?, 'book-ok-1', 'page-1', 99, ?)
      `);

      assert.throws(
        () => {
          insert.run('para-fail-long', 'P'.repeat(10001));
        },
        /CHECK constraint failed/,
      );
    });
  });
});
