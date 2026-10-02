import * as SQLite from 'expo-sqlite';
import { AppDatabase } from './database';
import { deleteFileIfExists } from '../lib/files';

/** Abre (y migra si hace falta) la base local de la app. */
export async function openAppDatabase(name = 'images_to_book.sqlite'): Promise<AppDatabase> {
  const sqlite = await SQLite.openDatabaseAsync(name);
  await sqlite.execAsync('PRAGMA journal_mode = WAL;');
  const db = new AppDatabase(sqlite, deleteFileIfExists);
  await db.migrate();
  return db;
}
