import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { copyFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as Tesseract from 'tesseract.js';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { OcrRequest } from './ocr-request.entity';

/** Modelos horneados en la imagen (ver backend/Dockerfile). */
const BAKED_TESSDATA = '/app/tessdata';
const LANGS = ['eng', 'spa'];

@Injectable()
export class OcrService implements OnModuleInit {
  private readonly cachePath = tmpdir();

  constructor(
    @InjectRepository(OcrRequest) private readonly repo: Repository<OcrRequest>,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OcrService.name);
  }

  /**
   * Siembra el cache de tesseract.js con los modelos horneados en la imagen.
   *
   * tesseract.js escribe `<lang>.traineddata` en el cachePath la primera vez
   * que lo necesita, descargándolo de un CDN externo. En producción ese
   * cachePath es un tmpfs, así que cada reinicio repetía la descarga y ataba
   * el OCR a que hubiera salida a internet. Copiándolos aquí, no hace falta.
   * Si la imagen no los trae, no se hace nada y sigue el comportamiento de
   * antes.
   */
  onModuleInit() {
    if (!existsSync(BAKED_TESSDATA)) return;
    for (const lang of LANGS) {
      const src = join(BAKED_TESSDATA, `${lang}.traineddata`);
      const dst = join(this.cachePath, `${lang}.traineddata`);
      try {
        if (existsSync(src) && !existsSync(dst)) {
          copyFileSync(src, dst);
          this.logger.info({ lang, dst }, 'ocr modelo sembrado desde la imagen');
        }
      } catch (e) {
        this.logger.warn({ lang, err: (e as Error).message }, 'ocr no se pudo sembrar el modelo');
      }
    }
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
    // El .traineddata se cachea en el tmp del sistema, nunca en /app:
    // así el contenedor de prod puede correr con filesystem de solo lectura.
    const { data } = await Tesseract.recognize(image, lang, { cachePath: this.cachePath });
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
