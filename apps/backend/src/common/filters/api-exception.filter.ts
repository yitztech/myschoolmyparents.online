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

    this.logger.error(`Error no controlado: ${(exception as Error)?.message}`, (exception as Error)?.stack);
    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      error: 'internal',
      message: 'Error interno del servidor.',
    });
  }
}
