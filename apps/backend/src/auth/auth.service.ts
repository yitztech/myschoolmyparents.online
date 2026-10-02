import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { expiresInSeconds } from './expires-in';
import { LoginDto } from './dto/login.dto';
import { RecoverDto } from './dto/recover.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetDto } from './dto/reset.dto';
import { User } from '../users/user.entity';

/** Hash fijo para igualar tiempos cuando el correo no existe (anti-enumeración). */
const DUMMY_HASH = '$2b$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

/** Vida del código de recuperación. */
const RESET_TTL_MS = 15 * 60 * 1000;
/** Intentos fallidos del código antes de anularlo. */
const RESET_MAX_ATTEMPTS = 5;
/** Un correo de recuperación por cuenta y minuto. */
const RESET_RESEND_MS = 60 * 1000;

/** Anti-fuerza-bruta en login: intentos y ventana. */
const LOGIN_MAX_FAILS = 10;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
/** Tope del mapa en memoria: por encima, se barren las entradas caducadas. */
const FAILS_SWEEP_AT = 5000;

interface FailRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class AuthService {
  /** Anti-fuerza-bruta en memoria: 10 intentos fallidos por correo cada 10 min. */
  private readonly fails = new Map<string, FailRecord>();

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  private sign(user: Pick<User, 'id' | 'email' | 'tokenVersion'>): Promise<string> {
    return this.jwt.signAsync(
      // `tv` caduca el token si la contraseña cambia después de emitirlo.
      { sub: user.id, email: user.email, tv: user.tokenVersion ?? 0 },
      {
        secret: this.config.get<string>('jwtSecret'),
        expiresIn: expiresInSeconds(this.config.get<string>('jwtExpiresIn')),
      },
    );
  }

  private checkBruteForce(email: string) {
    const rec = this.fails.get(email);
    if (rec && rec.resetAt > Date.now() && rec.count >= LOGIN_MAX_FAILS) {
      this.logger.warn({ email }, 'auth.login bloqueado por demasiados intentos');
      throw new HttpException('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (rec && rec.resetAt <= Date.now()) this.fails.delete(email);
  }

  /**
   * Borra las entradas ya caducadas. Sin esto el mapa solo se limpiaba
   * cuando el mismo correo reintentaba, así que bastaban correos aleatorios
   * para hacerlo crecer sin tope.
   */
  private sweepFails() {
    const now = Date.now();
    for (const [email, rec] of this.fails) {
      if (rec.resetAt <= now) this.fails.delete(email);
    }
  }

  private noteFail(email: string) {
    const rec = this.fails.get(email);
    if (!rec || rec.resetAt <= Date.now()) {
      if (this.fails.size >= FAILS_SWEEP_AT) this.sweepFails();
      this.fails.set(email, { count: 1, resetAt: Date.now() + LOGIN_WINDOW_MS });
    } else {
      rec.count += 1;
    }
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      this.logger.warn({ email }, 'auth.register correo ya registrado');
      throw new ConflictException('Ese correo ya está registrado. Prueba a iniciar sesión.');
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({ name: dto.name, email, passwordHash });
    this.logger.info({ userId: user.id, email }, 'auth.register alta de cuenta local');
    const token = await this.sign(user);
    return { user: user.toPublic(), token };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    this.checkBruteForce(email);
    const user = await this.users.findByEmail(email);
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      this.noteFail(email);
      this.logger.warn({ email }, 'auth.login credenciales inválidas');
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }
    this.fails.delete(email);
    this.logger.info({ userId: user.id, email }, 'auth.login inicio de sesión');
    const token = await this.sign(user);
    return { user: user.toPublic(), token };
  }

  /** Siempre 200 aunque el correo no exista (no revela qué cuentas existen). */
  async requestRecover(dto: RecoverDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    // Antiflood: sin esto el endpoint es un cañón de correo saliente contra
    // terceros, firmado con nuestro dominio, y eso quema la reputación de
    // envío del servidor (y con ella, los propios códigos).
    const throttled = user ? Date.now() - (user.resetLastSent?.getTime() ?? 0) < RESET_RESEND_MS : false;

    if (!user || throttled) {
      // Se gasta el mismo bcrypt que la rama real: si no, responder sin
      // hashear sería más rápido y el tiempo de respuesta delataría qué
      // cuentas existen. Mismo truco que DUMMY_HASH en login.
      await bcrypt.hash(String(randomInt(100000, 1000000)), 8);
      this.logger.info(
        { email },
        throttled
          ? 'auth.recover reenvío demasiado seguido: no se envía'
          : 'auth.recover solicitud para correo desconocido (respuesta genérica)',
      );
      return { ok: true };
    }

    // randomInt (CSPRNG), no Math.random: un código de 6 dígitos sacado de
    // un PRNG normal es predecible desde el estado del motor.
    const code = String(randomInt(100000, 1000000));
    user.resetCodeHash = await bcrypt.hash(code, 8);
    user.resetCodeExpires = new Date(Date.now() + RESET_TTL_MS);
    user.resetAttempts = 0;
    user.resetLastSent = new Date();
    await this.users.save(user);

    if (this.mail.enabled) {
      // Sin await a propósito: que la respuesta no tarde más cuando la
      // cuenta existe (sería un canal de enumeración) ni se quede colgada
      // de la latencia del SMTP.
      void this.mail
        .sendPasswordResetCode(email, user.name, code)
        .then(() => this.logger.info({ email }, 'auth.recover código enviado por correo'))
        .catch((e: Error) =>
          this.logger.error({ email, err: e.message }, 'auth.recover fallo al enviar el correo'),
        );
    } else {
      // Solo en desarrollo: en producción main.ts no deja arrancar sin SMTP.
      this.logger.info({ email }, `auth.recover código (solo desarrollo, sin SMTP): ${code}`);
    }
    return { ok: true };
  }

  async confirmReset(dto: ResetDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    const generic = new UnauthorizedException('El código no es válido o ha caducado. Pide uno nuevo.');

    if (!user?.resetCodeHash || !user.resetCodeExpires || user.resetCodeExpires.getTime() <= Date.now()) {
      this.logger.warn({ email }, 'auth.reset sin código vigente');
      throw generic;
    }

    // Tope de intentos: 6 dígitos son un millón de combinaciones, pero sin
    // límite la ventana de 15 minutos da para probar muchísimas.
    if (user.resetAttempts >= RESET_MAX_ATTEMPTS) {
      user.resetCodeHash = null;
      user.resetCodeExpires = null;
      await this.users.save(user);
      this.logger.warn({ email }, 'auth.reset código anulado por demasiados intentos');
      throw generic;
    }

    if (!(await bcrypt.compare(dto.code.trim(), user.resetCodeHash))) {
      user.resetAttempts += 1;
      await this.users.save(user);
      this.logger.warn({ email, attempts: user.resetAttempts }, 'auth.reset código incorrecto');
      throw generic;
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    user.resetCodeHash = null;
    user.resetCodeExpires = null;
    user.resetAttempts = 0;
    // Caduca las sesiones abiertas: cambiar la contraseña tiene que echar a
    // quien tuviera un token robado.
    user.tokenVersion += 1;
    await this.users.save(user);
    this.fails.delete(email);
    this.logger.info({ userId: user.id, email }, 'auth.reset contraseña actualizada');
    return { ok: true };
  }
}
