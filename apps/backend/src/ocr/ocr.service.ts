import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { copyFileSync, existsSync } from 'fs';
import { imageSize } from 'image-size';
import { tmpdir } from 'os';
import { join } from 'path';
import * as Tesseract from 'tesseract.js';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { OcrRequest } from './ocr-request.entity';

/** Modelos horneados en la imagen (ver backend/Dockerfile). */
const BAKED_TESSDATA = '/app/tessdata';
const LANGS = ['eng', 'spa'];

/**
 * Tope de tamaño en píxeles, comprobado leyendo solo la cabecera. Los 15 MB
 * de subida no bastan: un PNG de 15 MB puede descomprimirse en varios GB y
 * el contenedor tiene 1 GB. La web ya reduce a 2000 px por lado antes de
 * enviar, así que esto deja mucho margen.
 */
const MAX_SIDE_PX = 10_000;
const MAX_PIXELS = 40_000_000;
/** Lo que image-size dice haber leído, contra los MIME que admite el controlador. */
const ALLOWED_TYPES = new Set(['jpg', 'png', 'webp', 'bmp', 'tiff']);

/**
 * Cada OCR arranca un worker de Tesseract con su propia memoria. Sin tope,
 * unas cuantas peticiones a la vez agotaban el 1 GB del contenedor y lo
 * tumbaban entero, login incluido.
 */
const MAX_CONCURRENT = 2;
/** Peticiones en espera; por encima se responde 503 en vez de acumular imágenes en memoria. */
const MAX_QUEUED = 8;

@Injectable()
export class OcrService implements OnModuleInit {
  private readonly cachePath = tmpdir();
  private running = 0;
  private readonly waiting: Array<() => void> = [];
  /** Usuarios con un OCR en curso o en cola: uno por cuenta a la vez. */
  private readonly busyUsers = new Set<string>();

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

  /** Rechaza lo que no sea una imagen de verdad o sea demasiado grande, sin decodificarla. */
  assertImageSize(image: Buffer) {
    let info: { type?: string; width?: number; height?: number };
    try {
      info = imageSize(image);
    } catch {
      throw new BadRequestException('No se pudo leer la imagen. Envía un JPEG, PNG, WebP, BMP o TIFF válido.');
    }
    if (!info.type || !ALLOWED_TYPES.has(info.type)) {
      throw new BadRequestException('El fichero debe ser una imagen (JPEG, PNG, WebP, BMP o TIFF).');
    }
    const width = info.width ?? 0;
    const height = info.height ?? 0;
    if (!width || !height || width > MAX_SIDE_PX || height > MAX_SIDE_PX || width * height > MAX_PIXELS) {
      throw new BadRequestException(
        `La imagen es demasiado grande (${width}×${height} px). Redúcela a menos de ${MAX_SIDE_PX} px por lado.`,
      );
    }
  }

  private acquire(): Promise<void> {
    if (this.running < MAX_CONCURRENT) {
      this.running += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.waiting.push(resolve));
  }

  /** Cede el hueco al siguiente en cola (sin bajar `running`) o lo libera. */
  private release() {
    const next = this.waiting.shift();
    if (next) next();
    else this.running -= 1;
  }

  async recognize(image: Buffer, langReq: string, userId: string) {
    this.assertImageSize(image);
    if (this.busyUsers.has(userId)) {
      throw new HttpException('Ya tienes una imagen en proceso. Espera a que termine.', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (this.running >= MAX_CONCURRENT && this.waiting.length >= MAX_QUEUED) {
      this.logger.warn({ running: this.running, queued: this.waiting.length }, 'ocr cola llena');
      throw new ServiceUnavailableException('El reconocimiento de texto está ocupado. Inténtalo en unos segundos.');
    }
    this.busyUsers.add(userId);
    try {
      await this.acquire();
      try {
        return await this.run(image, langReq);
      } finally {
        this.release();
      }
    } finally {
      this.busyUsers.delete(userId);
    }
  }

  private async run(image: Buffer, langReq: string) {
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
