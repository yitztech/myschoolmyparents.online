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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  toPublic() {
    return { id: this.id, name: this.name, email: this.email, provider: 'email' as const };
  }
}
