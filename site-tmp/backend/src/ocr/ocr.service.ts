import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Tesseract from 'tesseract.js';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { OcrRequest } from './ocr-request.entity';

@Injectable()
export class OcrService {
  constructor(
    @InjectRepository(OcrRequest) private readonly repo: Repository<OcrRequest>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OcrService.name);
  }

  splitParagraphs(raw: string): string[] {
    const cleaned = (raw || '').replace(/\r/g, '').trim();
    if (!cleaned) return [];
    const byBlank = cleaned.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    if (byBlank.length > 1) return byBlank;
    const lines = cleaned.split(/\n/).map((s) => s.trim()).filter(Boolean);
    if (lines.length <= 2) return [lines.join(' ')];
    return lines;
  }

  normalizeLang(langReq: string): string {
    if (/spa/.test(langReq) && /eng/.test(langReq)) return 'eng+spa';
    if (/spa/.test(langReq)) return 'spa';
    return 'eng';
  }

  async recognize(image: Buffer, langReq: string) {
    const lang = this.normalizeLang(langReq);
    const { data } = await Tesseract.recognize(image, lang);
    const rawText = (data.text || '').trim();
    const paragraphs = this.splitParagraphs(rawText);
    // Registro best-effort: un fallo de BD nunca rompe el OCR.
    this.repo
      .save(this.repo.create({ lang, chars: rawText.length, paragraphs: paragraphs.length }))
      .then((row) => this.logger.info({ ocrId: row.id, lang, chars: rawText.length }, 'ocr procesado'))
      .catch((e: Error) => this.logger.warn({ err: e.message }, 'ocr sin persistencia en PostgreSQL'));
    return { rawText, paragraphs };
  }
}
