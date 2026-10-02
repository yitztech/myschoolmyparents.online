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
/**
 * Intentos fallidos de código por cuenta y ventana, sumando todos los
 * códigos que se pidan en ella: pedir otro código no da intentos nuevos.
 * Con 6 dígitos son 10 entre un millón por hora, como mucho.
 */
const RESET_MAX_ATTEMPTS = 10;
const RESET_WINDOW_MS = 60 * 60 * 1000;
/** Un correo de recuperación por cuenta y minuto. */
const RESET_RESEND_MS = 60 * 1000;

/**
 * Anti-fuerza-bruta en login, en dos niveles y con la misma ventana:
 * - por correo + IP: frena a un atacante concreto sin que pueda bloquear
 *   la cuenta a su dueño desde otra dirección;
 * - por correo, con un tope mucho más alto: frena el ataque repartido entre
 *   muchas IP, que el primer nivel no ve.
 */
const LOGIN_MAX_FAILS_PER_IP = 10;
const LOGIN_MAX_FAILS_PER_EMAIL = 50;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
/** Tope del mapa en memoria: por encima, se barren las entradas caducadas. */
const FAILS_SWEEP_AT = 5000;

interface FailRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class AuthService {
  /**
   * Anti-fuerza-bruta en memoria. Claves: `<correo>` (tope por cuenta) y
   * `<correo>|<ip>` (tope por cuenta y dirección).
   */
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

  /** true si la clave ya agotó sus intentos dentro de la ventana vigente. */
  private overLimit(key: string, max: number): boolean {
    const rec = this.fails.get(key);
    if (!rec) return false;
    if (rec.resetAt <= Date.now()) {
      this.fails.delete(key);
      return false;
    }
    return rec.count >= max;
  }

  private checkBruteForce(email: string, ip: string) {
    const perIp = this.overLimit(`${email}|${ip}`, LOGIN_MAX_FAILS_PER_IP);
    const perEmail = this.overLimit(email, LOGIN_MAX_FAILS_PER_EMAIL);
    if (perIp || perEmail) {
      this.logger.warn({ email, ip, scope: perIp ? 'ip' : 'email' }, 'auth.login bloqueado por demasiados intentos');
      throw new HttpException('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  /** Olvida los fallos de un correo, en todas las IP. */
  private clearFails(email: string) {
    this.fails.delete(email);
    const prefix = `${email}|`;
    for (const key of this.fails.keys()) {
      if (key.startsWith(prefix)) this.fails.delete(key);
    }
  }

  /**
   * Borra las entradas ya caducadas. Sin esto el mapa solo se limpiaba
   * cuando el mismo correo reintentaba, así que bastaban correos aleatorios
   * para hacerlo crecer sin tope.
   */
  private sweepFails() {
    const now = Date.now();
    for (const [key, rec] of this.fails) {
      if (rec.resetAt <= now) this.fails.delete(key);
    }
  }

  private noteFailKey(key: string) {
    const rec = this.fails.get(key);
    if (!rec || rec.resetAt <= Date.now()) {
      if (this.fails.size >= FAILS_SWEEP_AT) this.sweepFails();
      this.fails.set(key, { count: 1, resetAt: Date.now() + LOGIN_WINDOW_MS });
    } else {
      rec.count += 1;
    }
  }

  private noteFail(email: string, ip: string) {
    this.noteFailKey(email);
    this.noteFailKey(`${email}|${ip}`);
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

  async login(dto: LoginDto, ip: string) {
    const email = dto.email.trim().toLowerCase();
    this.checkBruteForce(email, ip);
    const user = await this.users.findByEmail(email);
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      this.noteFail(email, ip);
      this.logger.warn({ email, ip }, 'auth.login credenciales inválidas');
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }
    // Solo se olvidan los fallos de esta IP: el contador por correo sigue
    // contando, o un ataque repartido se reiniciaría cada vez que el dueño
    // de la cuenta entra.
    this.fails.delete(`${email}|${ip}`);
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
    const now = Date.now();
    const throttled = user ? now - (user.resetLastSent?.getTime() ?? 0) < RESET_RESEND_MS : false;
    // La ventana de intentos solo se renueva cuando caduca. Si se renovara
    // con cada código, pedir uno por minuto daría intentos sin fin.
    const windowExpired = !user?.resetWindowStart || now - user.resetWindowStart.getTime() >= RESET_WINDOW_MS;
    // Con la ventana agotada, un código nuevo no se podría usar: no se envía.
    const exhausted = user ? !windowExpired && user.resetAttempts >= RESET_MAX_ATTEMPTS : false;

    if (!user || throttled || exhausted) {
      // Se gasta el mismo bcrypt que la rama real: si no, responder sin
      // hashear sería más rápido y el tiempo de respuesta delataría qué
      // cuentas existen. Mismo truco que DUMMY_HASH en login.
      await bcrypt.hash(String(randomInt(100000, 1000000)), 8);
      this.logger.info(
        { email },
        !user
          ? 'auth.recover solicitud para correo desconocido (respuesta genérica)'
          : throttled
            ? 'auth.recover reenvío demasiado seguido: no se envía'
            : 'auth.recover intentos agotados en la ventana: no se envía',
      );
      return { ok: true };
    }

    // randomInt (CSPRNG), no Math.random: un código de 6 dígitos sacado de
    // un PRNG normal es predecible desde el estado del motor.
    const code = String(randomInt(100000, 1000000));
    // `update` y no `save`: así no se pisa `reset_attempts` con el valor
    // leído arriba si entretanto otra petición ha gastado intentos.
    await this.users.update(user.id, {
      resetCodeHash: await bcrypt.hash(code, 8),
      resetCodeExpires: new Date(now + RESET_TTL_MS),
      resetLastSent: new Date(now),
      ...(windowExpired ? { resetAttempts: 0, resetWindowStart: new Date(now) } : {}),
    });

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
    // límite la ventana de 15 minutos da para probar muchísimas. El intento
    // se reserva en la BD ANTES de comparar y de forma atómica: con
    // leer-comparar-guardar, cien peticiones simultáneas leían todas el
    // mismo contador y se saltaban el tope.
    if (!(await this.users.reserveResetAttempt(user.id, RESET_MAX_ATTEMPTS))) {
      await this.users.update(user.id, { resetCodeHash: null, resetCodeExpires: null });
      this.logger.warn({ email }, 'auth.reset código anulado por demasiados intentos');
      throw generic;
    }

    if (!(await bcrypt.compare(dto.code.trim(), user.resetCodeHash))) {
      this.logger.warn({ email }, 'auth.reset código incorrecto');
      throw generic;
    }

    await this.users.update(user.id, {
      passwordHash: await bcrypt.hash(dto.newPassword, 12),
      resetCodeHash: null,
      resetCodeExpires: null,
      resetAttempts: 0,
      resetWindowStart: null,
      // Caduca las sesiones abiertas: cambiar la contraseña tiene que echar
      // a quien tuviera un token robado.
      tokenVersion: () => 'token_version + 1',
    });
    this.clearFails(email);
    this.logger.info({ userId: user.id, email }, 'auth.reset contraseña actualizada');
    return { ok: true };
  }
}
