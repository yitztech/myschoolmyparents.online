import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FastifyReply } from 'fastify';

/**
 * Da forma estable a los errores para el frontend:
 *   { error: <codigo>, message: <texto en español> }
 * Los errores de validación (array) se unen en un solo texto.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as { message?: string | string[]; error?: string };
      const rawMessage = Array.isArray(body?.message) ? body.message.join(' ') : (body?.message ?? exception.message);
      const error =
        status === HttpStatus.UNAUTHORIZED
          ? 'auth_failed'
          : status === HttpStatus.CONFLICT
            ? 'conflict'
            : status === HttpStatus.TOO_MANY_REQUESTS
              ? 'rate_limited'
              : status === HttpStatus.BAD_REQUEST && Array.isArray(body?.message)
                ? 'validation'
                : (body?.error ?? 'request_failed')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '_');
      reply.status(status).send({ error, message: rawMessage });
      return;
    }

    // Errores propios de Fastify (multipart, parseo del cuerpo...). No son
    // HttpException, así que sin esto una imagen de más de 15 MB devolvía un
    // 500 con traza en los logs en lugar de un 413 con explicación.
    const fst = exception as { statusCode?: number; code?: string };

    // @fastify/rate-limit lanza un objeto plano con statusCode 429 (ni
    // HttpException ni código FST_): sin esto, superar el límite devolvía un
    // 500 y el cliente lo trataba como una avería en vez de esperar.
    if (fst?.statusCode === HttpStatus.TOO_MANY_REQUESTS) {
      reply.status(HttpStatus.TOO_MANY_REQUESTS).send({
        error: 'rate_limited',
        message: 'Demasiadas peticiones. Espera un minuto e inténtalo de nuevo.',
      });
      return;
    }

    if (typeof fst?.code === 'string' && fst.code.startsWith('FST_') && typeof fst.statusCode === 'number') {
      const messages: Record<string, string> = {
        FST_REQ_FILE_TOO_LARGE: 'La imagen es demasiado grande (máximo 15 MB).',
        FST_FILES_LIMIT: 'Envía una sola imagen por petición.',
        FST_INVALID_MULTIPART_CONTENT_TYPE: 'El formulario debe enviarse como multipart/form-data.',
      };
      reply.status(fst.statusCode).send({
        error: fst.statusCode === HttpStatus.PAYLOAD_TOO_LARGE ? 'payload_too_large' : 'bad_request',
        message: messages[fst.code] ?? 'No se pudo procesar la petición.',
      });
      return;
    }

    this.logger.error(`Error no controlado: ${(exception as Error)?.message}`, (exception as Error)?.stack);
    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      error: 'internal',
      message: 'Error interno del servidor.',
    });
  }
}
