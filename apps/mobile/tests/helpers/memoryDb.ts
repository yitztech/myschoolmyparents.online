import { DatabaseSync } from 'node:sqlite';
import { AppDatabase } from '../../src/db/database.ts';

/** Adaptador mínimo de `node:sqlite` con la forma de expo-sqlite, solo para pruebas. */
function adapt(raw: DatabaseSync) {
  const bind = (params: any[]) => params.map((p) => (p === undefined ? null : p));
  return {
    execAsync: async (sql: string) => void raw.exec(sql),
    runAsync: async (sql: string, params: any[] = []) => void raw.prepare(sql).run(...bind(params)),
    getAllAsync: async (sql: string, params: any[] = []) => raw.prepare(sql).all(...bind(params)),
    getFirstAsync: async (sql: string, params: any[] = []) => raw.prepare(sql).get(...bind(params)) ?? null,
    withTransactionAsync: async (fn: () => Promise<void>) => {
      raw.exec('BEGIN');
      try {
        await fn();
        raw.exec('COMMIT');
      } catch (e) {
        raw.exec('ROLLBACK');
        throw e;
      }
    },
  };
}

export async function memoryDb(deleted: string[] = []) {
  const raw = new DatabaseSync(':memory:');
  const db = new AppDatabase(adapt(raw) as any, (p) => {
    if (p) deleted.push(p);
  });
  await db.migrate();
  return db;
}
