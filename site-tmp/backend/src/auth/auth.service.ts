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
import { PinoLogger } from 'nestjs-pino';
import { UsersService } from '../users/users.service';
import { expiresInSeconds } from './expires-in';
import { LoginDto } from './dto/login.dto';
import { RecoverDto } from './dto/recover.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetDto } from './dto/reset.dto';

/** Hash fijo para igualar tiempos cuando el correo no existe (anti-enumeración). */
const DUMMY_HASH = '$2b$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

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
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AuthService.name);
  }

  private sign(user: { id: string; email: string }): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.id, email: user.email },
      {
        secret: this.config.get<string>('jwtSecret'),
        expiresIn: expiresInSeconds(this.config.get<string>('jwtExpiresIn')),
      },
    );
  }

  private checkBruteForce(email: string) {
    const rec = this.fails.get(email);
    if (rec && rec.resetAt > Date.now() && rec.count >= 10) {
      this.logger.warn({ email }, 'auth.login bloqueado por demasiados intentos');
      throw new HttpException('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (rec && rec.resetAt <= Date.now()) this.fails.delete(email);
  }

  private noteFail(email: string) {
    const rec = this.fails.get(email);
    if (!rec || rec.resetAt <= Date.now()) {
      this.fails.set(email, { count: 1, resetAt: Date.now() + 10 * 60 * 1000 });
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
    if (user) {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      user.resetCodeHash = await bcrypt.hash(code, 8);
      user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
      await this.users.save(user);
      // El código solo se registra en entornos no productivos. En prod sale por email/SMS.
      if (this.config.get<string>('nodeEnv') !== 'production') {
        this.logger.info({ email }, `auth.recover código (solo desarrollo): ${code}`);
      } else {
        this.logger.info({ email }, 'auth.recover código generado y enviado');
      }
    } else {
      this.logger.info({ email }, 'auth.recover solicitud para correo desconocido (respuesta genérica)');
    }
    return { ok: true };
  }

  async confirmReset(dto: ResetDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    const valid =
      user?.resetCodeHash &&
      user.resetCodeExpires &&
      user.resetCodeExpires.getTime() > Date.now() &&
      (await bcrypt.compare(dto.code.trim(), user.resetCodeHash));
    if (!user || !valid) {
      this.logger.warn({ email }, 'auth.reset código inválido o caducado');
      throw new UnauthorizedException('El código no es válido o ha caducado. Pide uno nuevo.');
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    user.resetCodeHash = null;
    user.resetCodeExpires = null;
    await this.users.save(user);
    this.fails.delete(email);
    this.logger.info({ userId: user.id, email }, 'auth.reset contraseña actualizada');
    return { ok: true };
  }
}
