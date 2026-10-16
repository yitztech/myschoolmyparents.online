import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { splitParagraphs, rateLabel, uid } from '../src/lib/types';

describe('Frontend Types y Utilidades de Lectura', () => {
  describe('splitParagraphs (Citas y División de Texto)', () => {
    test('éxito: divide texto por saltos de línea dobles', () => {
      const raw = 'Primer párrafo con texto.\n\nSegundo párrafo de la cita escolar.';
      const res = splitParagraphs(raw);
      assert.deepEqual(res, [
        'Primer párrafo con texto.',
        'Segundo párrafo de la cita escolar.',
      ]);
    });

    test('éxito: agrupa líneas cortas o divide por saltos si no hay dobles', () => {
      const raw = 'Línea uno.\nLínea dos.';
      const res = splitParagraphs(raw);
      assert.deepEqual(res, ['Línea uno. Línea dos.']);
    });

    test('fracaso/borde: texto vacío retorna lista vacía', () => {
      assert.deepEqual(splitParagraphs(''), []);
      assert.deepEqual(splitParagraphs('   \n\r  '), []);
    });
  });

  describe('rateLabel', () => {
    test('etiqueta correcta según velocidad de habla', () => {
      assert.equal(rateLabel(0.2), 'Lenta');
      assert.equal(rateLabel(0.45), 'Normal');
      assert.equal(rateLabel(0.8), 'Rápida');
    });
  });

  describe('uid', () => {
    test('genera identificadores únicos con prefijo especificado', () => {
      const id1 = uid('book');
      const id2 = uid('book');
      assert.ok(id1.startsWith('book_'));
      assert.notEqual(id1, id2);
    });
  });
});
