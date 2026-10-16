import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Validaciones estrictas de tamaño y tipo de caracteres a nivel de base de datos:
 *   - users.name: longitud mínima 2 y máxima 120 caracteres, únicamente letras, espacios, guiones y apóstrofes.
 *   - users.email: longitud máxima 180 caracteres y patrón de formato de correo.
 *   - ocr_requests.lang: longitud máxima 20 caracteres.
 */
export class FieldValidations1792000000000 implements MigrationInterface {
  name = 'FieldValidations1792000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD CONSTRAINT chk_users_name_len
          CHECK (char_length(trim(name)) >= 2 AND char_length(name) <= 120),
        ADD CONSTRAINT chk_users_name_chars
          CHECK (name ~ '^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜàèìòùÀÈÌÒÙâêîôûÂÊÎÔÛäëïöüÄËÏÖÜçÇ ''-]+$'),
        ADD CONSTRAINT chk_users_email
          CHECK (char_length(email) <= 180 AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');
    `);

    await queryRunner.query(`
      ALTER TABLE ocr_requests
        ADD CONSTRAINT chk_ocr_lang
          CHECK (char_length(lang) <= 20);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP CONSTRAINT IF EXISTS chk_users_name_len,
        DROP CONSTRAINT IF EXISTS chk_users_name_chars,
        DROP CONSTRAINT IF EXISTS chk_users_email;
    `);

    await queryRunner.query(`
      ALTER TABLE ocr_requests
        DROP CONSTRAINT IF EXISTS chk_ocr_lang;
    `);
  }
}
