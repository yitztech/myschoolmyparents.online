import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { createTransport, type Transporter } from 'nodemailer';

/** El nombre lo elige el usuario al registrarse: no puede entrar crudo en el HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

/**
 * Correo transaccional (en producción, el Stalwart del servidor).
 *
 * Solo transaccional: las campañas van por Listmonk con otra identidad de
 * envío, para que un problema de reputación con un boletín no se lleve por
 * delante los códigos de recuperación.
 *
 * Con SMTP_HOST vacío el servicio queda desactivado y no envía nada: es el
 * modo de desarrollo, donde AuthService escribe el código en los logs. En
 * producción el arranque ya falla antes si falta la configuración (main.ts).
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly transporter: Transporter | null = null;
  private readonly smtp: SmtpConfig;
  private readonly appUrl: string;

  constructor(
    config: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MailService.name);
    this.smtp = config.get<SmtpConfig>('smtp') ?? {
      host: '',
      port: 587,
      secure: false,
      user: '',
      password: '',
      from: '',
    };
    this.appUrl = config.get<string>('appPublicUrl') ?? '';

    if (this.smtp.host) {
      this.transporter = createTransport({
        host: this.smtp.host,
        port: this.smtp.port,
        secure: this.smtp.secure,
        // En el 587 el cifrado llega por STARTTLS. `requireTLS` aborta si el
        // servidor no lo ofrece, en vez de mandar las credenciales en claro.
        requireTLS: !this.smtp.secure,
        tls: { minVersion: 'TLSv1.2' },
        auth: this.smtp.user ? { user: this.smtp.user, pass: this.smtp.password } : undefined,
      });
    }
  }

  get enabled(): boolean {
    return this.transporter !== null;
  }

  async onModuleInit() {
    if (!this.transporter) {
      this.logger.warn('mail sin SMTP configurado: no se enviarán correos (modo desarrollo)');
      return;
    }
    // Comprobación de alcance, no de configuración: si Stalwart está caído
    // se registra y se sigue. Tirar el arranque dejaría también sin login a
    // quien no necesita correo, y el contenedor entraría en bucle de
    // reinicios por una avería ajena. La configuración ausente sí es fatal,
    // pero eso se verifica en main.ts antes de llegar aquí.
    try {
      await this.transporter.verify();
      this.logger.info({ host: this.smtp.host, port: this.smtp.port }, 'mail SMTP verificado');
    } catch (e) {
      this.logger.error(
        { host: this.smtp.host, port: this.smtp.port, err: (e as Error).message },
        'mail SMTP inalcanzable: la recuperación de contraseña no podrá enviar códigos',
      );
    }
  }

  /**
   * Envía el código de recuperación. Lanza si falla: quien llama decide qué
   * hacer (AuthService lo registra y responde igual, para no revelar si la
   * cuenta existe).
   */
  async sendPasswordResetCode(to: string, name: string, code: string): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP no configurado');
    }
    const saludo = name.trim() ? `Hola ${name.trim()},` : 'Hola,';
    await this.transporter.sendMail({
      from: this.smtp.from,
      to,
      subject: 'Tu código para recuperar la contraseña',
      text: [
        saludo,
        '',
        `Tu código para crear una nueva contraseña es: ${code}`,
        '',
        'Caduca en 15 minutos y solo se puede usar una vez.',
        '',
        `Escríbelo en ${this.appUrl} para terminar.`,
        '',
        'Si no has pedido cambiar la contraseña, puedes ignorar este mensaje:',
        'tu cuenta sigue como estaba.',
        '',
        'MySchoolMyParents',
      ].join('\n'),
      html: `
        <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#262134;line-height:1.6">
          <p>${escapeHtml(saludo)}</p>
          <p>Tu código para crear una nueva contraseña es:</p>
          <p style="font-size:32px;font-weight:800;letter-spacing:.2em;margin:24px 0">${code}</p>
          <p>Caduca en <strong>15 minutos</strong> y solo se puede usar una vez.</p>
          <p>Escríbelo en <a href="${this.appUrl}" style="color:#B9320A">${this.appUrl}</a> para terminar.</p>
          <p style="color:#5C5570;font-size:14px">
            Si no has pedido cambiar la contraseña, puedes ignorar este mensaje: tu cuenta sigue como estaba.
          </p>
          <p style="color:#5C5570;font-size:14px">MySchoolMyParents</p>
        </div>
      `,
    });
  }
}
