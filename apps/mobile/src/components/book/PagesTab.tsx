import React from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { ActionMenu, AppText, Banner, Button, Card, Icon } from '../ui';
import type { ImportJob, Page, PageDraft, Paragraph } from '../../db/schema';
import { colors } from '../../theme';

export const pageStatusLabel = (status: string) =>
  ({ approved: 'Añadida al libro', review: 'Lista para revisar', reprocessing: 'Reprocesando', error: 'Error de lectura' })[status] ?? 'Pendiente';

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
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Button icon="photo-camera" label="Tomar foto" disabled={busy} onPress={onCamera} />
        <Button icon="photo-library" label="Elegir fotos" variant="outlined" disabled={busy} onPress={onGallery} />
        <Button icon="picture-as-pdf" label="Importar PDF" variant="outlined" disabled={busy} onPress={onPdf} />
        <Button icon="auto-stories" label="Usar ejemplo" variant="text" disabled={busy} onPress={onSample} />
        {busy ? <ActivityIndicator accessibilityLabel="Procesando páginas" /> : null}
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
  return (
    <Card tint={colors.tertiaryContainer} style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="rate-review" size={22} color={colors.onTertiaryContainer} />
        <AppText style={{ fontWeight: '800', fontSize: 16 }}>Pendiente por revisar</AppText>
      </View>
      <AppText>Compara con la foto. Corrige, separa párrafos con línea en blanco o quita encabezados antes de añadirla.</AppText>
      {imagePath ? (
        <Pressable accessibilityRole="imagebutton" accessibilityLabel="Ampliar foto" onPress={() => onZoom(imagePath)}>
          <Image source={{ uri: imagePath }} style={{ height: 180, width: '100%', borderRadius: 12 }} resizeMode="contain" />
          <View style={{ position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Icon name="zoom-in" size={16} color="#fff" />
            <AppText style={{ color: '#fff', fontSize: 12 }}>Toca para ampliar</AppText>
          </View>
        </Pressable>
      ) : null}
      <AppText style={{ fontWeight: '700' }}>Texto detectado ({draft.rawText.length} caracteres):</AppText>
      <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 10, maxHeight: 180 }}>
        <AppText selectable>{draft.rawText.length === 0 ? 'No se detectó texto.' : draft.rawText}</AppText>
      </View>
      <AppText style={{ fontSize: 12, color: colors.muted }}>Solo entra al libro y a la lectura al pulsar «Añadir al libro».</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button icon="check" label="Añadir al libro" disabled={busy} onPress={onApprove} />
        <Button icon="edit" label="Corregir texto" variant="outlined" onPress={onEdit} />
        <Button icon="refresh" label="Reprocesar" variant="outlined" onPress={onRetry} />
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
  return (
    <Card style={{ padding: 8 }}>
      <AppText accessibilityRole="header" style={{ fontWeight: '800', fontSize: 17, padding: 8 }}>
        Páginas
      </AppText>
      {pages.map((page, index) => {
        const job = jobs.find((j) => j.pageId === page.id);
        const status = job?.state === 'failed' ? `Error: ${job.errorCode ?? 'OCR'}` : pageStatusLabel(page.status);
        const count = paragraphs.filter((p) => p.pageId === page.id).length;
        return (
          <View
            key={page.id}
            accessible
            accessibilityLabel={`Página ${index + 1}. Estado: ${status}.`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 8 }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
              <AppText style={{ fontWeight: '800', color: colors.onPrimaryContainer }}>{index + 1}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontWeight: '700' }}>Página {index + 1}</AppText>
              <AppText style={{ fontSize: 12, color: colors.muted }}>
                {status} · {count} párrafo(s)
              </AppText>
              {count === 0 && page.status === 'approved' ? <AppText style={{ fontSize: 12, color: colors.secondary }}>Esta página aún no tiene texto aprobado.</AppText> : null}
            </View>
            <ActionMenu
              label="Opciones de página"
              actions={[
                { key: 'edit', label: 'Editar texto', icon: 'edit', onPress: () => onEdit(page) },
                { key: 'up', label: 'Subir página', icon: 'arrow-upward', disabled: index === 0, onPress: () => onMove(index, index - 1) },
                { key: 'down', label: 'Bajar página', icon: 'arrow-downward', disabled: index === pages.length - 1, onPress: () => onMove(index, index + 1) },
                { key: 'reprocess', label: 'Reprocesar foto', icon: 'refresh', disabled: !page.originalPath, onPress: () => onReprocess(page) },
                { key: 'delete', label: 'Eliminar página', icon: 'delete-outline', danger: true, onPress: () => onDelete(page) },
              ]}
            />
          </View>
        );
      })}
    </Card>
  );
}

export function PendingBanner({ count, busy, onApproveAll, onMergeAll }: { count: number; busy: boolean; onApproveAll: () => void; onMergeAll: () => void }) {
  if (count < 2) return null;
  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="auto-awesome" size={22} color={colors.secondary} />
        <AppText style={{ flex: 1, fontWeight: '800' }}>{count} páginas pendientes por revisar</AppText>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button icon="done-all" label="Añadir todas" disabled={busy} onPress={onApproveAll} />
        <Button icon="join-inner" label="Juntar en una" variant="outlined" disabled={busy} onPress={onMergeAll} />
      </View>
    </Card>
  );
}

export { Banner };
