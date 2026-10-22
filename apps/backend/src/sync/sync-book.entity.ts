import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('sync_books')
export class SyncBook {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  id: string;

  @Column({ type: 'varchar', length: 64, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 20, default: 'es-MX', name: 'home_locale' })
  homeLocale: string;

  @Column({ type: 'varchar', length: 20, default: 'en-US', name: 'learning_locale' })
  learningLocale: string;

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'voice_id' })
  voiceId?: string | null;

  @Column({ type: 'float', default: 0.45, name: 'speech_rate' })
  speechRate: number;

  @Column({ type: 'int', default: 0, name: 'last_paragraph' })
  lastParagraph: number;

  @Column({ type: 'int', default: 0, name: 'last_offset' })
  lastOffset: number;

  @Column({ type: 'int', default: 1, name: 'content_revision' })
  contentRevision: number;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  pages: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
