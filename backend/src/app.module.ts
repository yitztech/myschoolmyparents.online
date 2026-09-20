import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { AuthModule } from './auth/auth.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { OcrModule } from './ocr/ocr.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<string>('nodeEnv') === 'production';
        return {
          pinoHttp: {
            level: config.get<string>('logLevel'),
            // Trazabilidad: respeta X-Request-Id del proxy o genera uno.
            genReqId: (req) => (req.headers['x-request-id'] as string) ?? randomUUID(),
            // Nunca registrar secretos.
            redact: {
              paths: [
                'req.body.password',
                'req.body.newPassword',
                'req.body.code',
                'req.headers.authorization',
              ],
              censor: '[oculto]',
            },
            // En desarrollo, logs legibles; en prod, JSON para el agregador.
            transport: isProd ? undefined : { target: 'pino-pretty', options: { singleLine: true } },
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('databaseUrl'),
        autoLoadEntities: true,
        // Sin synchronize ni en desarrollo: el esquema lo gobiernan las
        // migraciones (src/migrations), que corren al arrancar.
        synchronize: false,
        migrationsRun: true,
        migrations: [__dirname + '/migrations/*{.js,.ts}'],
        retryAttempts: 10,
        retryDelay: 3000,
      }),
    }),
    UsersModule,
    AuthModule,
    OcrModule,
    HealthModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
})
export class AppModule {}
