export interface OcrLine {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
  confidence?: number;
}

export interface NativeOcrResult {
  rawText: string;
  paragraphs: string[];
  lines: OcrLine[];
  /** «mlkit-latin-16.0.1», «apple-vision» o «pdfkit-direct» (texto vectorial del PDF). */
  engine: string;
  /** Solo en páginas de PDF: imagen renderizada de la página. */
  imagePath?: string;
}
