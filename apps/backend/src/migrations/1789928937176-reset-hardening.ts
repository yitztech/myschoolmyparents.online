import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Endurece la recuperación de contraseña y permite invalidar sesiones:
 *   reset_attempts   intentos fallidos del código en curso (5 -> se anula)
 *   reset_last_sent  antiflood de reenvíos (1 correo por minuto)
 *   token_version    sube en cada reset y caduca los JWT anteriores
 * Idempotente, como la migración inicial.
 */
export class ResetHardening1789928937176 implements MigrationInterface {
  name = 'ResetHardening1789928937176';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS reset_attempts INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS reset_last_sent TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 0;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS reset_attempts,
        DROP COLUMN IF EXISTS reset_last_sent,
        DROP COLUMN IF EXISTS token_version;
    `);
  }
}
