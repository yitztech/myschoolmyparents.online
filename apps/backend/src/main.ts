import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

/** Arranque con Fastify como motor HTTP (más rápido y con menor huella que Express). */
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );
  const config = app.get(ConfigService);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');

  // Cabeceras seguras (CSP, HSTS, X-Frame-Options…).
  // Los casts son seguros en runtime: los plugins tipan contra su propia
  // copia de los tipos de fastify, pero el objeto es el mismo.
  type RegisterPlugin = Parameters<NestFastifyApplication['register']>[0];
  await app.register(helmet as unknown as RegisterPlugin);
  // Subida de una imagen (OCR) de hasta 15 MB.
  await app.register(multipart as unknown as RegisterPlugin, {
    limits: { files: 1, fileSize: 15 * 1024 * 1024 },
  });
  // Límite global anti-abuso: 200 peticiones/min por IP.
  await app.register(rateLimit as unknown as RegisterPlugin, { max: 200, timeWindow: '1 minute' });

  const origins = config.get<string[]>('corsOrigin') ?? [];
  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  // Validación estricta de DTOs: rechaza campos extra y tipos inválidos.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const secret = config.get<string>('jwtSecret') ?? '';
  if (config.get<string>('nodeEnv') === 'production' && secret.includes('dev-only')) {
    app.get(Logger).warn('JWT_SECRET usa el valor de desarrollo: configúralo antes de exponer el servicio.');
  }

  const port = config.get<number>('port') ?? 3001;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
