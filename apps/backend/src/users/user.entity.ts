import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { randomUUID } from 'crypto';

/** Cuenta: correo + contraseña (bcrypt) y/o una cuenta de Google enlazada. */
@Entity('users')
export class User {
  /** UUID generado en la app (sin depender de extensiones de Postgres). */
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  assignId() {
    if (!this.id) this.id = randomUUID();
  }

  @Column({ length: 120 })
  name: string;

  @Column({ length: 180, unique: true })
  email: string;

  /** NULL en las cuentas creadas con Google que aún no tienen contraseña. */
  @Column({ name: 'password_hash', type: 'varchar', length: 100, nullable: true })
  passwordHash: string | null;

  /** Origen de la cuenta: 'local' o 'google'. Informativo. */
  @Column({ length: 10, default: 'local' })
  provider: string;

  /** Claim `sub` de Google: identifica la cuenta de Google enlazada. */
  @Column({ name: 'google_sub', type: 'varchar', length: 64, nullable: true, unique: true })
  googleSub: string | null;

  @Column({ name: 'reset_code_hash', type: 'varchar', length: 100, nullable: true })
  resetCodeHash: string | null;

  @Column({ name: 'reset_code_expires', type: 'timestamptz', nullable: true })
  resetCodeExpires: Date | null;

  /**
   * Intentos fallidos de código dentro de la ventana actual (no se reinicia
   * al pedir otro código); al llegar al tope el código se anula.
   */
  @Column({ name: 'reset_attempts', type: 'int', default: 0 })
  resetAttempts: number;

  /** Inicio de la ventana de una hora en la que cuentan `resetAttempts`. */
  @Column({ name: 'reset_window_start', type: 'timestamptz', nullable: true })
  resetWindowStart: Date | null;

  /** Antiflood: un correo de recuperación por minuto y cuenta. */
  @Column({ name: 'reset_last_sent', type: 'timestamptz', nullable: true })
  resetLastSent: Date | null;

  /**
   * Sube en cada cambio de contraseña. El JWT lleva este número, así que
   * los tokens emitidos antes del reset dejan de valer: si alguien te robó
   * la sesión, cambiar la contraseña le echa de verdad.
   */
  @Column({ name: 'token_version', type: 'int', default: 0 })
  tokenVersion: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      // 'google' solo si la cuenta no tiene contraseña: es lo que decide cómo
      // se confirma, p. ej., la eliminación de la cuenta.
      provider: (this.passwordHash ? 'email' : 'google') as 'email' | 'google',
      hasPassword: Boolean(this.passwordHash),
      googleLinked: Boolean(this.googleSub),
    };
  }
}
