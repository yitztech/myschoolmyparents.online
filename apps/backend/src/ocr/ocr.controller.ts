import { BadRequestException, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { OcrService } from './ocr.service';

/** POST /api/ocr (multipart: image + lang) -> { rawText, paragraphs }. */
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocr: OcrService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async recognize(@Req() req: FastifyRequest) {
    // Se iteran las partes a mano (compatible con cualquier opción del
    // plugin multipart): el fichero va en `image` y el idioma en `lang`.
    let image: Buffer | null = null;
    let lang = 'eng';
    for await (const part of req.parts()) {
      if (part.type === 'file' && part.fieldname === 'image') {
        image = await part.toBuffer();
      } else if (part.type === 'field' && part.fieldname === 'lang') {
        lang = String(part.value ?? 'eng');
      }
    }
    if (!image) throw new BadRequestException('Falta la imagen (campo "image").');
    return this.ocr.recognize(image, lang);
  }
}
