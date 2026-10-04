import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);

/** Lo que el navegador guarda (cookie HttpOnly) entre la ida a Google y la vuelta. */
export interface OAuthTicket {
  /** `state`: liga la vuelta a ESTE navegador (anti-CSRF de login). */
  s: string;
  /** `nonce`: liga el id_token a esta petición (anti-repetición). */
  n: string;
  /** PKCE code_verifier: sin él, un `code` interceptado no sirve. */
  v: string;
  /** Adónde volver en el frontend (ya validado). */
  r: string;
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
}

export class GoogleOAuthError extends Error {
  constructor(
    /** Código corto que acaba en la URL del frontend (#auth_error=…). */
    readonly code: 'state' | 'unverified' | 'failed',
    detail: string,
  ) {
    super(detail);
  }
}

const b64url = (buf: Buffer) => buf.toString('base64url');

/**
 * Flujo «authorization code» de OAuth 2.0 / OpenID Connect con PKCE, hecho a
 * mano con fetch: son dos peticiones y no compensa una dependencia más.
 *
 * El id_token NO se verifica por firma a propósito: llega directamente de
 * Google por TLS, en la respuesta al intercambio del code autenticada con el
 * client_secret, que es exactamente el caso en que OpenID Connect Core
 * (§3.1.3.7) permite usar el canal TLS en lugar de la firma. Sí se
 * comprueban emisor, audiencia, caducidad y nonce.
 */
@Injectable()
export class GoogleOAuthService {
  constructor(private readonly config: ConfigService) {}

  private get cfg() {
    return this.config.get<{ clientId: string; clientSecret: string; redirectUri: string }>('google')!;
  }

  get enabled(): boolean {
    return Boolean(this.cfg?.clientId && this.cfg?.clientSecret);
  }

  newTicket(returnTo: string): OAuthTicket {
    return { s: b64url(randomBytes(24)), n: b64url(randomBytes(24)), v: b64url(randomBytes(48)), r: returnTo };
  }

  authorizationUrl(t: OAuthTicket): string {
    const params = new URLSearchParams({
      client_id: this.cfg.clientId,
      redirect_uri: this.cfg.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: t.s,
      nonce: t.n,
      code_challenge: b64url(createHash('sha256').update(t.v).digest()),
      code_challenge_method: 'S256',
      // Deja elegir cuenta aunque solo haya una abierta: en un ordenador
      // familiar, entrar sin preguntar con la cuenta de otro es lo peor.
      prompt: 'select_account',
    });
    return `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  /** Cambia el `code` por el id_token y devuelve el perfil ya comprobado. */
  async exchange(code: string, t: OAuthTicket): Promise<GoogleProfile> {
    let res: Response;
    try {
      res = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: this.cfg.clientId,
          client_secret: this.cfg.clientSecret,
          redirect_uri: this.cfg.redirectUri,
          grant_type: 'authorization_code',
          code_verifier: t.v,
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (e) {
      throw new GoogleOAuthError('failed', `token endpoint inalcanzable: ${(e as Error).message}`);
    }
    const data = (await res.json().catch(() => ({}))) as { id_token?: string; error?: string };
    if (!res.ok || !data.id_token) {
      // `error` es un código corto de Google (invalid_grant…), sin secretos.
      throw new GoogleOAuthError('failed', `token endpoint ${res.status}: ${data.error ?? 'sin id_token'}`);
    }

    const claims = this.decode(data.id_token);
    const now = Math.floor(Date.now() / 1000);
    if (!ISSUERS.has(String(claims.iss))) throw new GoogleOAuthError('failed', 'iss no es Google');
    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.includes(this.cfg.clientId)) throw new GoogleOAuthError('failed', 'aud no coincide');
    if (typeof claims.exp !== 'number' || claims.exp < now - 60) throw new GoogleOAuthError('failed', 'id_token caducado');
    if (claims.nonce !== t.n) throw new GoogleOAuthError('state', 'nonce no coincide');
    if (typeof claims.sub !== 'string' || !claims.sub) throw new GoogleOAuthError('failed', 'sin sub');
    // Sin correo verificado no se enlaza ni se crea nada: el correo es la
    // llave de la cuenta (y de la recuperación de contraseña).
    if (typeof claims.email !== 'string' || claims.email_verified !== true) {
      throw new GoogleOAuthError('unverified', 'correo de Google sin verificar');
    }
    const email = claims.email.trim().toLowerCase();
    const name = (typeof claims.name === 'string' && claims.name.trim()) || email.split('@')[0];
    return { sub: claims.sub, email, name };
  }

  private decode(jwt: string): Record<string, unknown> {
    const part = jwt.split('.')[1];
    try {
      return JSON.parse(Buffer.from(part ?? '', 'base64url').toString('utf8')) as Record<string, unknown>;
    } catch {
      throw new GoogleOAuthError('failed', 'id_token ilegible');
    }
  }
}
