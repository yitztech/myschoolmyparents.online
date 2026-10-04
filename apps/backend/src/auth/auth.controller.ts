import {
  Body,
  ConflictException,
  Controller,
  Get,
  GoneException,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RouteConfig } from '@nestjs/platform-fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { PinoLogger } from 'nestjs-pino';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { User } from '../users/user.entity';
import { AuthService } from './auth.service';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { LoginDto } from './dto/login.dto';
import { RecoverDto } from './dto/recover.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetDto } from './dto/reset.dto';
import { GoogleOAuthError, GoogleOAuthService, type OAuthTicket } from './google-oauth.service';

/**
 * Tope por IP y ruta para las operaciones de cuenta, muy por debajo del
 * global (200/min): cada una gasta un bcrypt y, sin esto, una sola IP podía
 * probar contraseñas contra 200 cuentas por minuto. Sustituye al global en
 * estas rutas (no se suma).
 */
const AUTH_RATE_LIMIT = { rateLimit: { max: 20, timeWindow: '1 minute' } };

/** Cookie que acompaña al navegador en la ida y vuelta a Google. */
const OAUTH_COOKIE = 'msm_oauth';
/** Cubre /api/auth/google y /api/auth/google/callback, nada más. */
const OAUTH_COOKIE_PATH = '/api/auth/google';
/** Tiempo para elegir cuenta en Google y volver. */
const OAUTH_COOKIE_MAX_AGE = 10 * 60;

/**
 * Cuentas: correo + contraseña, o Google.
 * Rutas (con prefijo global `api`):
 *   POST /api/auth/register | POST /api/auth/login
 *   POST /api/auth/password/recover | POST /api/auth/password/reset
 *   GET  /api/auth/me (Bearer JWT)
 *   POST /api/auth/account/delete (Bearer JWT + contraseña, o correo si la cuenta es solo de Google)
 *   GET  /api/auth/providers                 -> { google: boolean }
 *   GET  /api/auth/google?returnTo=<url>     -> 302 a Google (410 si no está configurado)
 *   GET  /api/auth/google/callback           -> 302 al frontend con #auth=google&token=… o #auth_error=…
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleOAuthService,
    private readonly config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }

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
   * Elimina la cuenta de quien tiene la sesión. Pide la contraseña (o el
   * correo y una sesión reciente si la cuenta es solo de Google): un token
   * robado no basta para borrar la cuenta de nadie. Lo exigen Google Play y
   * App Store para apps con cuentas (ver /legal/eliminar-cuenta en la web).
   */
  @Post('account/delete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @RouteConfig(AUTH_RATE_LIMIT)
  deleteAccount(@Req() req: { user: User; tokenIssuedAt?: number }, @Body() dto: DeleteAccountDto, @Ip() ip: string) {
    return this.auth.deleteAccount(req.user, dto, ip, req.tokenIssuedAt);
  }

  /** Qué métodos de acceso hay: el frontend decide con esto si pinta el botón de Google. */
  @Get('providers')
  providers() {
    return { google: this.google.enabled };
  }

  /** Paso 1: guarda state/nonce/PKCE en una cookie HttpOnly y manda a Google. */
  @Get('google')
  @RouteConfig(AUTH_RATE_LIMIT)
  googleStart(@Query('returnTo') returnTo: string | undefined, @Res() reply: FastifyReply) {
    if (!this.google.enabled) {
      throw new GoneException('El acceso con Google no está disponible: usa tu correo y contraseña.');
    }
    const ticket = this.google.newTicket(this.safeReturnTo(returnTo));
    const value = Buffer.from(JSON.stringify(ticket)).toString('base64url');
    reply
      .code(302)
      .header('Set-Cookie', this.cookie(value, OAUTH_COOKIE_MAX_AGE))
      .header('Cache-Control', 'no-store')
      .header('Location', this.google.authorizationUrl(ticket))
      .send();
  }

  /**
   * Paso 2: Google vuelve aquí con `code` y `state`. Nunca responde JSON:
   * siempre redirige al frontend, con el token en el fragmento (#), que el
   * navegador no envía a ningún servidor ni deja en los logs de nginx.
   */
  @Get('google/callback')
  @RouteConfig(AUTH_RATE_LIMIT)
  async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: FastifyRequest,
    @Res() reply: FastifyReply,
  ) {
    const ticket = this.readTicket(req.headers.cookie);
    const back = ticket?.r ?? this.safeReturnTo(undefined);
    // La cookie es de un solo uso, salga bien o mal.
    reply.header('Set-Cookie', this.cookie('', 0)).header('Cache-Control', 'no-store');
    const go = (fragment: string) => reply.code(302).header('Location', `${back}#${fragment}`).send();

    if (!this.google.enabled) return go('auth_error=disabled');
    if (error) {
      // access_denied = el usuario canceló en la pantalla de Google.
      this.logger.info({ error }, 'auth.google cancelado o rechazado por Google');
      return go(`auth_error=${error === 'access_denied' ? 'cancelled' : 'failed'}`);
    }
    if (!ticket || !state || !code || state !== ticket.s) {
      this.logger.warn({ hasTicket: Boolean(ticket) }, 'auth.google state ausente o distinto');
      return go('auth_error=state');
    }
    try {
      const profile = await this.google.exchange(code, ticket);
      const { token } = await this.auth.googleSignIn(profile);
      return go(`auth=google&token=${encodeURIComponent(token)}`);
    } catch (e) {
      const reason =
        e instanceof GoogleOAuthError ? e.code : e instanceof ConflictException ? 'conflict' : 'failed';
      this.logger.warn({ reason, err: (e as Error).message }, 'auth.google fallo en la vuelta');
      return go(`auth_error=${reason}`);
    }
  }

  /**
   * Solo se vuelve a orígenes propios (APP_PUBLIC_URL y CORS_ORIGIN): sin
   * esta lista, /api/auth/google?returnTo=https://malo.example sería una
   * máquina de entregar tokens a terceros. Se conserva la ruta, no la query.
   */
  private safeReturnTo(raw: string | undefined): string {
    const publicUrl = this.config.get<string>('appPublicUrl') ?? 'http://localhost:6060';
    const allowed = new Set(
      [publicUrl, ...(this.config.get<string[]>('corsOrigin') ?? [])].map((o) => {
        try {
          return new URL(o).origin;
        } catch {
          return '';
        }
      }),
    );
    try {
      const url = new URL(raw ?? '');
      if (allowed.has(url.origin)) return `${url.origin}${url.pathname}`;
    } catch {
      /* no es una URL: valor por defecto */
    }
    return `${new URL(publicUrl).origin}/`;
  }

  private cookie(value: string, maxAge: number): string {
    const secure = this.config.get<string>('nodeEnv') === 'production' ? '; Secure' : '';
    // SameSite=Lax: la vuelta desde Google es una navegación GET de nivel
    // superior, así que la cookie viaja; un POST o un iframe ajeno, no.
    return `${OAUTH_COOKIE}=${value}; Path=${OAUTH_COOKIE_PATH}; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
  }

  private readTicket(header: string | undefined): OAuthTicket | null {
    const raw = header
      ?.split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${OAUTH_COOKIE}=`))
      ?.slice(OAUTH_COOKIE.length + 1);
    if (!raw) return null;
    try {
      const t = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Partial<OAuthTicket>;
      if (typeof t.s !== 'string' || typeof t.n !== 'string' || typeof t.v !== 'string' || typeof t.r !== 'string') {
        return null;
      }
      // La cookie la controla el navegador: el destino se vuelve a validar.
      return { s: t.s, n: t.n, v: t.v, r: this.safeReturnTo(t.r) };
    } catch {
      return null;
    }
  }
}
