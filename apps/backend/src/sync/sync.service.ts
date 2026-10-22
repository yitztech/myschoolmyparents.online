import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { MoreThan, Repository } from 'typeorm';
import { SyncBook } from './sync-book.entity';
import type { SyncBookDto, SyncPushRequestDto } from './sync.dto';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(SyncBook)
    private readonly repo: Repository<SyncBook>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SyncService.name);
  }

  async push(userId: string, dto: SyncPushRequestDto) {
    const serverTime = new Date().toISOString();
    const syncedBookIds: string[] = [];
    const conflicts: SyncBookDto[] = [];

    // 1. Procesar eliminaciones
    for (const delId of dto.deletedBookIds || []) {
      const existing = await this.repo.findOne({ where: { id: delId, userId } });
      if (existing) {
        existing.isDeleted = true;
        existing.updatedAt = new Date();
        await this.repo.save(existing);
        syncedBookIds.push(delId);
      }
    }

    // 2. Procesar libros entrantes
    for (const b of dto.books || []) {
      const existing = await this.repo.findOne({ where: { id: b.id, userId } });
      const clientUpdate = new Date(b.updatedAt);

      if (existing && existing.updatedAt.getTime() > clientUpdate.getTime() + 1000) {
        // Conflicto: el servidor tiene una versión más reciente
        conflicts.push(this.toDto(existing));
      } else {
        const entity = existing ?? this.repo.create({ id: b.id, userId });
        entity.title = b.title;
        entity.homeLocale = b.homeLocale;
        entity.learningLocale = b.learningLocale;
        entity.voiceId = b.voiceId ?? null;
        entity.speechRate = b.speechRate;
        entity.lastParagraph = b.lastParagraph;
        entity.lastOffset = b.lastOffset;
        entity.contentRevision = b.contentRevision;
        entity.isDeleted = Boolean(b.isDeleted);
        entity.pages = b.pages || [];
        entity.createdAt = new Date(b.createdAt);
        entity.updatedAt = clientUpdate;

        await this.repo.save(entity);
        syncedBookIds.push(b.id);
      }
    }

    this.logger.info({ userId, syncedCount: syncedBookIds.length, conflictsCount: conflicts.length }, 'sync push completado');

    return {
      success: true,
      syncedBookIds,
      conflicts,
      serverTime,
    };
  }

  async pull(userId: string, sinceStr?: string) {
    const serverTime = new Date().toISOString();
    let books: SyncBook[];

    if (sinceStr && !isNaN(Date.parse(sinceStr))) {
      const since = new Date(sinceStr);
      books = await this.repo.find({
        where: { userId, updatedAt: MoreThan(since) },
        order: { updatedAt: 'ASC' },
      });
    } else {
      books = await this.repo.find({
        where: { userId },
        order: { updatedAt: 'ASC' },
      });
    }

    const activeBooks: SyncBookDto[] = [];
    const deletedBookIds: string[] = [];

    for (const b of books) {
      if (b.isDeleted) {
        deletedBookIds.push(b.id);
      } else {
        activeBooks.push(this.toDto(b));
      }
    }

    return {
      books: activeBooks,
      deletedBookIds,
      serverTime,
    };
  }

  async deleteAllUserData(userId: string) {
    await this.repo.delete({ userId });
    this.logger.info({ userId }, 'datos de sincronización eliminados para el usuario');
    return { success: true };
  }

  private toDto(entity: SyncBook): SyncBookDto {
    return {
      id: entity.id,
      title: entity.title,
      homeLocale: entity.homeLocale,
      learningLocale: entity.learningLocale,
      voiceId: entity.voiceId ?? null,
      speechRate: entity.speechRate,
      lastParagraph: entity.lastParagraph,
      lastOffset: entity.lastOffset,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      contentRevision: entity.contentRevision,
      pages: entity.pages || [],
      isDeleted: entity.isDeleted,
    };
  }
}
