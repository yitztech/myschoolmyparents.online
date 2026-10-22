import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { AuthError } from '../../lib/auth';
import { validateEmail, validateName, validatePassword } from '../../lib/validators';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/input';
import { AuthLayout } from './AuthLayout';
import { GoogleButton } from './GoogleButton';
import { PasswordChecklist } from './PasswordChecklist';
import type { AuthView } from './AuthNavigator';

export function RegisterScreen({ onNavigate }: { onNavigate: (v: AuthView) => void }) {
  const { t } = useI18n();
  const { register, oauthError, clearOAuthError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    clearOAuthError();
    const nameErr = validateName(name);
    if (nameErr) {
      setError(nameErr);
      return;
    }
    const emailErr = validateEmail(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    const passErr = validatePassword(password);
    if (passErr) {
      setError(passErr);
      return;
    }
    if (confirm !== password) {
      setError('Las contraseñas no coinciden. Revisa la confirmación.');
      return;
    }
    setBusy(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={t.auth.registerTitle} subtitle={t.auth.registerSubtitle}>
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <div>
          <Label htmlFor="reg-name">{t.auth.name}</Label>
          <Input id="reg-name" autoComplete="name" placeholder={t.auth.namePlaceholder} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="reg-email">{t.auth.email}</Label>
          <Input id="reg-email" type="email" autoComplete="email" placeholder={t.auth.emailPlaceholder} maxLength={180} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="reg-password">{t.auth.password}</Label>
          <div className="relative">
            <Input
              id="reg-password" type={show ? 'text' : 'password'} autoComplete="new-password"
              placeholder={t.auth.passwordPlaceholder} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-14"
            />

            <button
              type="button" onClick={() => setShow((s) => !s)}
              className="absolute right-1 top-1/2 flex min-h-[48px] min-w-[48px] -translate-y-1/2 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-deep"
              aria-label={show ? t.auth.hidePassword : t.auth.showPassword}
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="mt-2"><PasswordChecklist password={password} /></div>
        </div>
        <div>
          <Label htmlFor="reg-confirm">{t.auth.confirmPassword}</Label>
          <Input
            id="reg-confirm" type={show ? 'text' : 'password'} autoComplete="new-password"
            placeholder={t.auth.confirmPlaceholder} value={confirm} onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={confirm.length > 0 && confirm !== password}
          />
          {confirm.length > 0 && confirm !== password && (
            <p role="alert" className="mt-1 text-sm font-bold text-coral-deep">{t.auth.passwordMismatch}</p>
          )}
        </div>
        {(error || oauthError) && <p role="alert" className="rounded-xl border-2 border-coral-deep bg-[#FFE9E0] p-3 text-sm font-bold text-coral-deep">{error || oauthError}</p>}
        <Button type="submit" variant="coral" className="w-full" disabled={busy}>{busy ? t.auth.registerSubmitting : t.auth.registerSubmit}</Button>
        <p className="text-center text-xs font-medium text-ink-soft">
          Al crear la cuenta aceptas los{' '}
          <a href="/legal/terminos" className="font-bold underline decoration-sun decoration-2 underline-offset-2">{t.footer.terms}</a> y la{' '}
          <a href="/legal/privacidad" className="font-bold underline decoration-sun decoration-2 underline-offset-2">{t.footer.privacy}</a>.
        </p>
      </form>

      <GoogleButton mode="register" />

      <p className="mt-6 text-center text-sm font-medium text-ink-soft">
        {t.auth.haveAccountPrompt}{' '}
        <button onClick={() => onNavigate('login')} className="min-h-[48px] rounded font-black text-coral-deep underline decoration-sun decoration-[3px] underline-offset-4 hover:bg-sun/40">
          {t.auth.loginLink}
        </button>
      </p>
    </AuthLayout>
  );
}
