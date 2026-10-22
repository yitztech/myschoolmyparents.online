import { MigrationInterface, QueryRunner } from 'typeorm';

export class SyncBooks1793000000000 implements MigrationInterface {
  name = 'SyncBooks1793000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sync_books (
        id VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        home_locale VARCHAR(20) NOT NULL DEFAULT 'es-MX',
        learning_locale VARCHAR(20) NOT NULL DEFAULT 'en-US',
        voice_id VARCHAR(128),
        speech_rate REAL NOT NULL DEFAULT 0.45,
        last_paragraph INT NOT NULL DEFAULT 0,
        last_offset INT NOT NULL DEFAULT 0,
        content_revision INT NOT NULL DEFAULT 1,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        pages JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_sync_books_user_updated
        ON sync_books (user_id, updated_at);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS sync_books;
    `);
  }
}
