import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { randomUUID } from 'crypto';

/** Cuenta local: solo email + contraseña (bcrypt). Sin OAuth en esta versión. */
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

  @Column({ name: 'password_hash', length: 100 })
  passwordHash: string;

  @Column({ length: 10, default: 'local' })
  provider: string;

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
    return { id: this.id, name: this.name, email: this.email, provider: 'email' as const };
  }
}
