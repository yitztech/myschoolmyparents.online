import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

/** Exige `Authorization: Bearer <JWT>` y expone el usuario en `req.user`. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers?.authorization;
    const [type, token] = header?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Sesión no válida. Vuelve a iniciar sesión.');
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; tv?: number; iat?: number }>(token, {
        secret: this.config.get<string>('jwtSecret'),
      });
      const user = await this.users.findById(payload.sub);
      if (!user) throw new UnauthorizedException('Sesión no válida. Vuelve a iniciar sesión.');
      // El token queda invalidado si la contraseña cambió después de
      // emitirlo (confirmReset sube tokenVersion). Los tokens antiguos, sin
      // `tv`, cuentan como versión 0, que es el valor de alta.
      if ((payload.tv ?? 0) !== user.tokenVersion) {
        throw new UnauthorizedException('Tu contraseña cambió. Vuelve a iniciar sesión.');
      }
      req.user = user;
      // Momento de emisión (segundos): algunas operaciones piden una sesión
      // reciente (p. ej. borrar una cuenta sin contraseña).
      req.tokenIssuedAt = payload.iat;
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Sesión caducada o no válida. Vuelve a iniciar sesión.');
    }
  }
}
