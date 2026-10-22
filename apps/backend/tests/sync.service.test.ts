import 'reflect-metadata';
import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SyncService } from '../src/sync/sync.service';

describe('SyncService - Casos de Éxito, Conflictos y Borrado', () => {
  let mockStore: Map<string, any>;
  let mockRepo: any;
  let service: SyncService;

  beforeEach(() => {
    mockStore = new Map();
    mockRepo = {
      create: (entity: any) => ({ ...entity }),
      findOne: async ({ where }: any) => {
        const item = mockStore.get(`${where.userId}_${where.id}`);
        return item ? { ...item } : null;
      },
      find: async ({ where }: any) => {
        return Array.from(mockStore.values()).filter((item) => item.userId === where.userId);
      },
      save: async (entity: any) => {
        const saved = { ...entity, updatedAt: entity.updatedAt ?? new Date(), createdAt: entity.createdAt ?? new Date() };
        mockStore.set(`${entity.userId}_${entity.id}`, saved);
        return saved;
      },
      delete: async (where: any) => {
        for (const [key, item] of mockStore.entries()) {
          if (item.userId === where.userId) {
            mockStore.delete(key);
          }
        }
        return { affected: 1 };
      },
    };

    const mockLogger: any = { setContext: () => {}, info: () => {}, warn: () => {} };
    service = new SyncService(mockRepo, mockLogger);
  });

  test('pushSync guarda libros nuevos', async () => {
    const res = await service.push('user-1', {
      books: [
        {
          id: 'book-1',
          title: 'Cuentos de prueba',
          homeLocale: 'es-MX',
          learningLocale: 'en-US',
          speechRate: 0.45,
          lastParagraph: 0,
          lastOffset: 0,
          contentRevision: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pages: [],
        },
      ],
      deletedBookIds: [],
    });

    assert.equal(res.success, true);
    assert.deepEqual(res.syncedBookIds, ['book-1']);
    assert.equal(res.conflicts.length, 0);
  });

  test('pullSync descarga libros del usuario', async () => {
    await service.push('user-1', {
      books: [
        {
          id: 'book-1',
          title: 'Libro 1',
          homeLocale: 'es-MX',
          learningLocale: 'en-US',
          speechRate: 0.45,
          lastParagraph: 0,
          lastOffset: 0,
          contentRevision: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pages: [],
        },
      ],
      deletedBookIds: [],
    });

    const pull = await service.pull('user-1');
    assert.equal(pull.books.length, 1);
    assert.equal(pull.books[0].id, 'book-1');
  });

  test('deleteAllUserData elimina los libros sincronizados del usuario', async () => {
    await service.push('user-1', {
      books: [
        {
          id: 'book-1',
          title: 'Libro a borrar',
          homeLocale: 'es-MX',
          learningLocale: 'en-US',
          speechRate: 0.45,
          lastParagraph: 0,
          lastOffset: 0,
          contentRevision: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pages: [],
        },
      ],
      deletedBookIds: [],
    });

    await service.deleteAllUserData('user-1');
    const pull = await service.pull('user-1');
    assert.equal(pull.books.length, 0);
  });
});
