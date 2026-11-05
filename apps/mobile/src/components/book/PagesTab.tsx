import React from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { ActionMenu, AppText, Banner, Button, Card, Icon } from '../ui';
import type { ImportJob, Page, PageDraft, Paragraph } from '../../db/schema';
import { useT } from '../../context/AppContext';
import { colors } from '../../theme';

export const pageStatusLabel = (t: (key: string) => string, status: string) =>
  ({
    approved: t('capture.status.approved'),
    review: t('capture.status.review'),
    reprocessing: t('capture.status.reprocessing'),
    error: t('capture.status.error'),
  })[status] ?? t('capture.status.pending');

/** Controles de captura: cámara, galería, PDF y página de ejemplo. */
export function CaptureControls({
  busy,
  progress,
  onCamera,
  onGallery,
  onPdf,
  onSample,
}: {
  busy: boolean;
  progress: string;
  onCamera: () => void;
  onGallery: () => void;
  onPdf: () => void;
  onSample: () => void;
}) {
  const { t } = useT();
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Button icon="photo-camera" label={t('capture.takePhoto')} disabled={busy} onPress={onCamera} />
        <Button icon="photo-library" label={t('capture.choosePhotos')} variant="outlined" disabled={busy} onPress={onGallery} />
        <Button icon="picture-as-pdf" label={t('capture.importPdf')} variant="outlined" disabled={busy} onPress={onPdf} />
        <Button icon="auto-stories" label={t('capture.useSample')} variant="text" disabled={busy} onPress={onSample} />
        {busy ? <ActivityIndicator accessibilityLabel={t('capture.processingPages')} /> : null}
      </View>
      {progress ? (
        <AppText accessibilityLiveRegion="polite" style={{ color: colors.textSoft }}>
          {progress}
        </AppText>
      ) : null}
    </Card>
  );
}

export function DraftCard({
  draft,
  imagePath,
  busy,
  onZoom,
  onApprove,
  onEdit,
  onRetry,
}: {
  draft: PageDraft;
  imagePath: string | null;
  busy: boolean;
  onZoom: (uri: string) => void;
  onApprove: () => void;
  onEdit: () => void;
  onRetry: () => void;
}) {
  const { t, p } = useT();
  return (
    <Card tint={colors.tertiaryContainer} style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="rate-review" size={22} color={colors.onTertiaryContainer} />
        <AppText style={{ fontWeight: '800', fontSize: 16 }}>{t('capture.pendingReviewTitle')}</AppText>
      </View>
      <AppText>{t('capture.draftHelp')}</AppText>
      {imagePath ? (
        <Pressable accessibilityRole="imagebutton" accessibilityLabel={t('capture.zoomPhoto')} onPress={() => onZoom(imagePath)}>
          <Image source={{ uri: imagePath }} style={{ height: 180, width: '100%', borderRadius: 12 }} resizeMode="contain" />
          <View style={{ position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Icon name="zoom-in" size={16} color="#fff" />
            <AppText style={{ color: '#fff', fontSize: 12 }}>{t('capture.tapToZoom')}</AppText>
          </View>
        </Pressable>
      ) : null}
      <AppText style={{ fontWeight: '700' }}>{p('capture.detectedText', draft.rawText.length)}</AppText>
      <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 10, maxHeight: 180 }}>
        <AppText selectable>{draft.rawText.length === 0 ? t('capture.noTextDetected') : draft.rawText}</AppText>
      </View>
      <AppText style={{ fontSize: 12, color: colors.muted }}>{t('capture.onlyWhenAdded', { action: t('capture.addToBook') })}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button icon="check" label={t('capture.addToBook')} disabled={busy} onPress={onApprove} />
        <Button icon="edit" label={t('capture.editText')} variant="outlined" onPress={onEdit} />
        <Button icon="refresh" label={t('capture.reprocess')} variant="outlined" onPress={onRetry} />
      </View>
    </Card>
  );
}

export function PagesList({
  pages,
  jobs,
  paragraphs,
  onMove,
  onEdit,
  onReprocess,
  onDelete,
}: {
  pages: Page[];
  jobs: ImportJob[];
  paragraphs: Paragraph[];
  onMove: (from: number, to: number) => void;
  onEdit: (page: Page) => void;
  onReprocess: (page: Page) => void;
  onDelete: (page: Page) => void;
}) {
  const { t, p } = useT();
  return (
    <Card style={{ padding: 8 }}>
      <AppText accessibilityRole="header" style={{ fontWeight: '800', fontSize: 17, padding: 8 }}>
        {t('capture.pagesHeader')}
      </AppText>
      {pages.map((page, index) => {
        const job = jobs.find((j) => j.pageId === page.id);
        const status = job?.state === 'failed' ? t('capture.statusError', { code: job.errorCode ?? 'OCR' }) : pageStatusLabel(t, page.status);
        const count = paragraphs.filter((para) => para.pageId === page.id).length;
        return (
          <View
            key={page.id}
            accessible
            accessibilityLabel={t('capture.pageAccessibility', { number: index + 1, status })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 8 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
              <AppText style={{ fontWeight: '800', color: colors.onPrimaryContainer }}>{index + 1}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontWeight: '700' }}>{t('capture.pageTitle', { number: index + 1 })}</AppText>
              <AppText style={{ fontSize: 12, color: colors.muted }}>{p('capture.pageSummary', count, { status })}</AppText>
              {count === 0 && page.status === 'approved' ? <AppText style={{ fontSize: 12, color: colors.secondary }}>{t('capture.noApprovedText')}</AppText> : null}
            </View>
            <ActionMenu
              label={t('capture.pageOptions')}
              actions={[
                { key: 'edit', label: t('capture.editPageText'), icon: 'edit', onPress: () => onEdit(page) },
                { key: 'up', label: t('capture.movePageUp'), icon: 'arrow-upward', disabled: index === 0, onPress: () => onMove(index, index - 1) },
                { key: 'down', label: t('capture.movePageDown'), icon: 'arrow-downward', disabled: index === pages.length - 1, onPress: () => onMove(index, index + 1) },
                { key: 'reprocess', label: t('capture.reprocessPhoto'), icon: 'refresh', disabled: !page.originalPath, onPress: () => onReprocess(page) },
                { key: 'delete', label: t('capture.deletePage'), icon: 'delete-outline', danger: true, onPress: () => onDelete(page) },
              ]}
            />
          </View>
        );
      })}
    </Card>
  );
}

export function PendingBanner({ count, busy, onApproveAll, onMergeAll }: { count: number; busy: boolean; onApproveAll: () => void; onMergeAll: () => void }) {
  const { t, p } = useT();
  if (count < 2) return null;
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="auto-awesome" size={22} color={colors.secondary} />
        <AppText style={{ flex: 1, fontWeight: '800' }}>{p('capture.pendingPages', count)}</AppText>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button icon="done-all" label={t('capture.addAll')} disabled={busy} onPress={onApproveAll} />
        <Button icon="join-inner" label={t('capture.mergeIntoOne')} variant="outlined" disabled={busy} onPress={onMergeAll} />
      </View>
    </Card>
  );
}

export { Banner };
