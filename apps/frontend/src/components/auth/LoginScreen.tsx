import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { AuthError } from '../../lib/auth';
import { isEmailValid } from '../../lib/password';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/input';
import { AuthLayout } from './AuthLayout';
import { GoogleButton } from './GoogleButton';
import { AvisoRecorte, pasteLimit } from '../PasteLimit';
import { interp } from '../../i18n/I18nContext';
import type { AuthView } from './AuthNavigator';

export function LoginScreen({ onNavigate }: { onNavigate: (v: AuthView) => void }) {
  const { t } = useI18n();
  const { login, oauthError, clearOAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [recortado, setRecortado] = useState<'correo' | 'password' | ''>('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    clearOAuthError();
    if (!isEmailValid(email)) {
      setError('Escribe un correo electrónico válido.');
      return;
    }
    if (!password) {
      setError('Escribe tu contraseña.');
      return;
    }
    setBusy(true);
    try {
      await login(email, password);
      // Al guardar sesión, App muestra la biblioteca automáticamente.
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  const errorMessage = error || oauthError;

  return (
    <AuthLayout title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle}>
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <div>
          <Label htmlFor="login-email">{t.auth.email}</Label>
          <Input
            id="login-email" type="email" autoComplete="email" placeholder={t.auth.emailPlaceholder} maxLength={180}
            value={email} onChange={(e) => setEmail(e.target.value)}
            onPaste={pasteLimit(180, () => setRecortado('correo'))}
          />
          <AvisoRecorte activo={recortado === 'correo'} texto={interp(t.auth.pasteTruncated, { n: 180 })} />
        </div>
        <div>
          <Label htmlFor="login-password">{t.auth.password}</Label>
          <div className="relative">
            <Input
              id="login-password" type={show ? 'text' : 'password'} autoComplete="current-password" maxLength={128}
              placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              className="pr-14"
              onPaste={pasteLimit(128, () => setRecortado('password'))}
            />
            <AvisoRecorte activo={recortado === 'password'} texto={interp(t.auth.pasteTruncated, { n: 128 })} />
            <button
              type="button" onClick={() => setShow((s) => !s)}
              className="absolute right-1 top-1/2 flex min-h-[48px] min-w-[48px] -translate-y-1/2 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-deep"
              aria-label={show ? t.auth.hidePassword : t.auth.showPassword}
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {errorMessage && <p role="alert" className="rounded-xl border-2 border-coral-deep bg-[#FFE9E0] p-3 text-sm font-bold text-coral-deep">{errorMessage}</p>}
        <Button type="submit" variant="coral" className="w-full" disabled={busy}>{busy ? t.auth.loginSubmitting : t.auth.loginSubmit}</Button>
      </form>

      <GoogleButton mode="login" />

      <nav className="mt-6 grid gap-2 text-center text-sm" aria-label="Opciones de cuenta">
        <p className="font-medium text-ink-soft">
          {t.auth.noAccountPrompt}{' '}
          <button onClick={() => onNavigate('register')} className="min-h-[48px] rounded font-black text-coral-deep underline decoration-sun decoration-[3px] underline-offset-4 hover:bg-sun/40">
            {t.auth.registerLink}
          </button>
        </p>
        <p className="font-medium text-ink-soft">
          {t.auth.forgotPassword}{' '}
          <button onClick={() => onNavigate('recover')} className="min-h-[48px] rounded font-black text-coral-deep underline decoration-sun decoration-[3px] underline-offset-4 hover:bg-sun/40">
            {t.auth.recoverLink}
          </button>
        </p>
      </nav>
    </AuthLayout>
  );
}
