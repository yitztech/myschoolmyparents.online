import { Body, Controller, Get, GoneException, HttpCode, HttpStatus, Ip, Post, Req, UseGuards } from '@nestjs/common';
import { RouteConfig } from '@nestjs/platform-fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { LoginDto } from './dto/login.dto';
import { RecoverDto } from './dto/recover.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetDto } from './dto/reset.dto';

/**
 * Tope por IP y ruta para las operaciones de cuenta, muy por debajo del
 * global (200/min): cada una gasta un bcrypt y, sin esto, una sola IP podía
 * probar contraseñas contra 200 cuentas por minuto. Sustituye al global en
 * estas rutas (no se suma).
 */
const AUTH_RATE_LIMIT = { rateLimit: { max: 20, timeWindow: '1 minute' } };

/**
 * Cuentas locales (sin OAuth en esta versión).
 * Rutas (con prefijo global `api`):
 *   POST /api/auth/register | POST /api/auth/login
 *   POST /api/auth/password/recover | POST /api/auth/password/reset
 *   GET  /api/auth/me (Bearer JWT) | GET /api/auth/google -> 410
 *   POST /api/auth/account/delete (Bearer JWT + contraseña)
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @RouteConfig(AUTH_RATE_LIMIT)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RouteConfig(AUTH_RATE_LIMIT)
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.auth.login(dto, ip);
  }

  @Post('password/recover')
  @HttpCode(HttpStatus.OK)
  @RouteConfig(AUTH_RATE_LIMIT)
  recover(@Body() dto: RecoverDto) {
    return this.auth.requestRecover(dto);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @RouteConfig(AUTH_RATE_LIMIT)
  reset(@Body() dto: ResetDto) {
    return this.auth.confirmReset(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: { toPublic: () => unknown } }) {
    return { user: req.user.toPublic() };
  }

  /**
   * Elimina la cuenta de quien tiene la sesión. Pide la contraseña: un token
   * robado no basta para borrar la cuenta de nadie. Lo exigen Google Play y
   * App Store para apps con cuentas (ver /legal/eliminar-cuenta en la web).
   */
  @Post('account/delete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @RouteConfig(AUTH_RATE_LIMIT)
  deleteAccount(@Req() req: { user: User }, @Body() dto: DeleteAccountDto, @Ip() ip: string) {
    return this.auth.deleteAccount(req.user, dto, ip);
  }

  @Get('google')
  google() {
    throw new GoneException('El registro con Google no está disponible: usa tu cuenta local (correo y contraseña).');
  }
}
