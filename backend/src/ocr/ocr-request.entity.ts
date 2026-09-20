import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ocr_requests')
export class OcrRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, default: 'eng' })
  lang: string;

  @Column({ default: 0 })
  chars: number;

  @Column({ default: 0 })
  paragraphs: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
