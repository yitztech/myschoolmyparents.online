import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Ventana del tope de intentos de recuperación:
 *   reset_window_start  inicio de la ventana de una hora en la que cuentan
 *                       los intentos fallidos (reset_attempts)
 * Antes, pedir un código nuevo ponía el contador a cero, así que bastaba con
 * pedir uno por minuto para tener 5 intentos por minuto sin fin. Ahora el
 * contador solo vuelve a cero cuando caduca la ventana.
 * Idempotente, como las migraciones anteriores.
 */
export class ResetWindow1790900000000 implements MigrationInterface {
  name = 'ResetWindow1790900000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS reset_window_start TIMESTAMPTZ;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS reset_window_start;
    `);
  }
}
