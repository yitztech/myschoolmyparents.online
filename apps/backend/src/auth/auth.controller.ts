import { Body, Controller, Get, GoneException, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RecoverDto } from './dto/recover.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetDto } from './dto/reset.dto';

/**
 * Cuentas locales (sin OAuth en esta versión).
 * Rutas (con prefijo global `api`):
 *   POST /api/auth/register | POST /api/auth/login
 *   POST /api/auth/password/recover | POST /api/auth/password/reset
 *   GET  /api/auth/me (Bearer JWT) | GET /api/auth/google -> 501
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('password/recover')
  @HttpCode(HttpStatus.OK)
  recover(@Body() dto: RecoverDto) {
    return this.auth.requestRecover(dto);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  reset(@Body() dto: ResetDto) {
    return this.auth.confirmReset(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: { toPublic: () => unknown } }) {
    return { user: req.user.toPublic() };
  }

  @Get('google')
  google() {
    throw new GoneException('El registro con Google no está disponible: usa tu cuenta local (correo y contraseña).');
  }
}
