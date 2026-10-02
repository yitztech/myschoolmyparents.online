import { File } from 'expo-file-system';
import * as MsmOcr from '../../modules/msm-ocr/src';
import type { OcrOutput } from './ocrQueue';
import type { PdfPageResult } from './pdfImport';

export type OcrEngineResult = OcrOutput & { engine: string };

/** OCR local de una imagen (ML Kit en Android, Apple Vision en iOS). */
export async function recognize(uri: string): Promise<OcrEngineResult> {
  const file = new File(uri);
  if (!file.exists || file.size === 0) {
    throw Object.assign(new Error(`El archivo para OCR no existe o está vacío: ${uri}`), { code: 'file_not_found' });
  }
  const r = await MsmOcr.recognize(uri);
  return { rawText: r.rawText, paragraphs: r.paragraphs, engine: r.engine };
}

export const getPdfPageCount = (uri: string) => MsmOcr.getPdfPageCount(uri);

export async function processPdfPage(pdfUri: string, page: number, targetUri: string): Promise<PdfPageResult> {
  const r = await MsmOcr.processPdfPage(pdfUri, page, targetUri);
  return { rawText: r.rawText, paragraphs: r.paragraphs, imagePath: r.imagePath ?? targetUri };
}

export const openTtsSettings = () => MsmOcr.openTtsSettings().catch(() => false);
