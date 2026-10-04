import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleOAuthService } from './google-oauth.service';
import { expiresInSeconds } from './expires-in';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [
    UsersModule,
    MailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwtSecret') ?? 'dev-only-insecure-secret',
        signOptions: { expiresIn: expiresInSeconds(config.get<string>('jwtExpiresIn')) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleOAuthService, JwtAuthGuard],
  // Se exportan también JwtModule y UsersModule: quien importe AuthModule
  // para usar @UseGuards(JwtAuthGuard) (p. ej. OcrModule) instancia el guard
  // en SU propio contexto, así que necesita resolver ahí JwtService y
  // UsersService. Exportar solo el guard deja el arranque roto.
  exports: [JwtAuthGuard, JwtModule, UsersModule],
})
export class AuthModule {}
