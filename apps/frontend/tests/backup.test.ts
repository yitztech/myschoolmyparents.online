import test from 'node:test';
import assert from 'node:assert/strict';
import { type LibraryBackupData } from '../src/lib/backup';

test('backup: valida estructura de LibraryBackupData', () => {
  const sampleBackup: LibraryBackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    books: [
      {
        id: 'b-1',
        title: 'Mi libro de prueba',
        homeLocale: 'es-MX',
        learningLocale: 'en-US',
        speechRate: 0.45,
        fontSize: 22,
        contentRevision: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
    pages: [],
    paragraphs: [],
  };

  assert.equal(sampleBackup.version, 1);
  assert.equal(sampleBackup.books.length, 1);
  assert.equal(sampleBackup.books[0].title, 'Mi libro de prueba');
});
