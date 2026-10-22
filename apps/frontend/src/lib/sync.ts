import { authHeaders } from './auth-session';
import { isMockMode } from './auth';
import { db } from './db';
import type { PageStatus } from './types';

export interface SyncSummary {
  pushedCount: number;
  pulledCount: number;
}

export async function synchronizeLibraryWithCloud(): Promise<SyncSummary> {
  if (isMockMode) {
    return { pushedCount: 0, pulledCount: 0 };
  }

  const localBooks = await db.books.toArray();
  const localPages = await db.pages.toArray();
  const localParagraphs = await db.paragraphs.toArray();

  const pushBooks = localBooks.map((book) => {
    const bPages = localPages
      .filter((p) => p.bookId === book.id && p.status === 'approved')
      .sort((a, b) => a.orderKey - b.orderKey)
      .map((page) => ({
        id: page.id,
        orderKey: page.orderKey,
        status: page.status,
        createdAt: new Date(page.createdAt).toISOString(),
        paragraphs: localParagraphs
          .filter((pr) => pr.pageId === page.id)
          .sort((a, b) => a.orderKey - b.orderKey)
          .map((pr) => ({
            id: pr.id,
            orderKey: pr.orderKey,
            content: pr.content,
            localeOverride: pr.localeOverride ?? null,
            textRevision: pr.textRevision ?? 1,
          })),
      }));

    return {
      id: book.id,
      title: book.title,
      homeLocale: book.homeLocale,
      learningLocale: book.learningLocale,
      voiceId: book.voiceId ?? null,
      speechRate: book.speechRate,
      lastParagraph: 0,
      lastOffset: book.lastOffset ?? 0,
      createdAt: new Date(book.createdAt).toISOString(),
      updatedAt: new Date(book.updatedAt).toISOString(),
      contentRevision: book.contentRevision ?? 1,
      pages: bPages,
    };
  });

  let pushedCount = 0;
  if (pushBooks.length > 0) {
    const pushRes = await fetch('/api/v1/sync/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify({
        books: pushBooks,
        deletedBookIds: [],
      }),
    });
    if (!pushRes.ok) {
      throw new Error(`Error al subir cambios (${pushRes.status})`);
    }
    const pushData = (await pushRes.json()) as { acceptedBookIds?: string[] };
    pushedCount = pushData.acceptedBookIds?.length ?? pushBooks.length;
  }

  const pullRes = await fetch('/api/v1/sync/pull', {
    headers: {
      Accept: 'application/json',
      ...authHeaders(),
    },
  });
  if (!pullRes.ok) {
    throw new Error(`Error al descargar biblioteca (${pullRes.status})`);
  }

  const pullData = (await pullRes.json()) as {
    books?: Array<{
      id: string;
      title: string;
      homeLocale: string;
      learningLocale: string;
      voiceId?: string | null;
      speechRate: number;
      lastOffset?: number;
      createdAt: string;
      updatedAt: string;
      contentRevision: number;
      pages?: Array<{
        id: string;
        orderKey: number;
        status: string;
        createdAt?: string;
        paragraphs?: Array<{
          id: string;
          orderKey: number;
          content: string;
          localeOverride?: string | null;
          textRevision: number;
        }>;
      }>;
    }>;
  };

  let pulledCount = 0;
  const remoteBooks = pullData.books ?? [];

  await db.transaction('rw', [db.books, db.pages, db.paragraphs], async () => {
    for (const rb of remoteBooks) {
      const existing = await db.books.get(rb.id);
      const remoteUpdated = new Date(rb.updatedAt).getTime() || Date.now();
      if (!existing || remoteUpdated > existing.updatedAt || rb.contentRevision > existing.contentRevision) {
        await db.books.put({
          id: rb.id,
          title: rb.title,
          homeLocale: rb.homeLocale,
          learningLocale: rb.learningLocale,
          voiceId: rb.voiceId ?? undefined,
          speechRate: rb.speechRate ?? 0.45,
          fontSize: existing?.fontSize ?? 22,
          lastParagraph: existing?.lastParagraph,
          lastOffset: rb.lastOffset ?? existing?.lastOffset,
          contentRevision: rb.contentRevision ?? 1,
          createdAt: existing?.createdAt ?? (new Date(rb.createdAt).getTime() || remoteUpdated),
          updatedAt: remoteUpdated,
        });

        for (const rp of rb.pages ?? []) {
          const pageCreated = rp.createdAt ? new Date(rp.createdAt).getTime() : remoteUpdated;
          await db.pages.put({
            id: rp.id,
            bookId: rb.id,
            orderKey: rp.orderKey,
            status: (rp.status as PageStatus) || 'approved',
            createdAt: pageCreated,
            updatedAt: remoteUpdated,
          });
          await db.paragraphs.where('pageId').equals(rp.id).delete();
          for (const pr of rp.paragraphs ?? []) {
            await db.paragraphs.put({
              id: pr.id,
              bookId: rb.id,
              pageId: rp.id,
              orderKey: pr.orderKey,
              content: pr.content,
              localeOverride: pr.localeOverride ?? undefined,
              textRevision: pr.textRevision ?? 1,
            });
          }
        }
        pulledCount++;
      }
    }
  });

  return { pushedCount, pulledCount };
}
