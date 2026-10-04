import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inicio de sesión con Google:
 *   google_sub     identificador estable de la cuenta de Google (claim `sub`).
 *                  Se enlaza por él y no por el correo, que puede cambiar.
 *   password_hash  pasa a admitir NULL: una cuenta creada con Google no tiene
 *                  contraseña hasta que el usuario pida una por correo.
 * Idempotente, como las migraciones anteriores.
 */
export class GoogleSignIn1791000000000 implements MigrationInterface {
  name = 'GoogleSignIn1791000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS google_sub VARCHAR(64);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users (google_sub);
      ALTER TABLE users
        ALTER COLUMN password_hash DROP NOT NULL;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Las cuentas solo-Google no tienen contraseña: sin un valor no se puede
    // volver a NOT NULL. Se les pone un hash imposible (no es bcrypt válido),
    // así que esas cuentas solo podrán entrar recuperando la contraseña.
    await queryRunner.query(`
      UPDATE users SET password_hash = '!' WHERE password_hash IS NULL;
      ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
      DROP INDEX IF EXISTS idx_users_google_sub;
      ALTER TABLE users DROP COLUMN IF EXISTS google_sub;
    `);
  }
}
