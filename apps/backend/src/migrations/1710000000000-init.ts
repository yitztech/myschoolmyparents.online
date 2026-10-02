import { MigrationInterface, QueryRunner } from 'typeorm';

/** Esquema inicial: cuentas locales + registro de OCR. Idempotente (IF NOT EXISTS). */
export class Init1710000000000 implements MigrationInterface {
  name = 'Init1710000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(180) NOT NULL UNIQUE,
        password_hash VARCHAR(100) NOT NULL,
        provider VARCHAR(10) NOT NULL DEFAULT 'local',
        reset_code_hash VARCHAR(100),
        reset_code_expires TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ocr_requests (
        id SERIAL PRIMARY KEY,
        lang VARCHAR(20) NOT NULL DEFAULT 'eng',
        chars INT NOT NULL DEFAULT 0,
        paragraphs INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS ocr_requests;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}
