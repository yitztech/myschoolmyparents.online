import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { User } from '../users/user.entity';
import { OcrService } from './ocr.service';

/** Tipos que Tesseract sabe leer; cualquier otra cosa se rechaza antes de gastar CPU. */
const ALLOWED_MIME = /^image\/(jpeg|png|webp|bmp|tiff)$/;

/**
 * POST /api/ocr (multipart: image + lang) -> { rawText, paragraphs }.
 *
 * Exige sesión: el OCR es la operación más cara del backend (Tesseract
 * sobre hasta 15 MB de imagen), así que su coste queda ligado a una cuenta
 * en vez de estar abierto a internet.
 */
@Controller('ocr')
@UseGuards(JwtAuthGuard)
export class OcrController {
  constructor(private readonly ocr: OcrService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async recognize(@Req() req: FastifyRequest & { user: User }) {
    // Se iteran las partes a mano (compatible con cualquier opción del
    // plugin multipart): el fichero va en `image` y el idioma en `lang`.
    let image: Buffer | null = null;
    let lang = 'eng';
    for await (const part of req.parts()) {
      if (part.type === 'file' && part.fieldname === 'image') {
        if (!ALLOWED_MIME.test(part.mimetype)) {
          throw new BadRequestException('El fichero debe ser una imagen (JPEG, PNG, WebP, BMP o TIFF).');
        }
        image = await part.toBuffer();
      } else if (part.type === 'field' && part.fieldname === 'lang') {
        lang = String(part.value ?? 'eng');
      }
    }
    if (!image) throw new BadRequestException('Falta la imagen (campo "image").');
    return this.ocr.recognize(image, lang, req.user.id);
  }
}
