import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, MailCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { AuthError, isMockMode } from '../../lib/auth';
import { isEmailValid, isPasswordValid } from '../../lib/password';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/input';
import { AuthLayout } from './AuthLayout';
import { PasswordChecklist } from './PasswordChecklist';
import type { AuthView } from './AuthNavigator';

type Step = 'email' | 'code' | 'done';

export function RecoverScreen({ onNavigate }: { onNavigate: (v: AuthView) => void }) {
  const { t } = useI18n();
  const { requestReset, confirmReset } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!isEmailValid(email)) {
      setError('Escribe el correo con el que te registraste.');
      return;
    }
    setBusy(true);
    try {
      const r = await requestReset(email);
      setDevCode(r.devCode);
      setStep('code');
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'No se pudo enviar el correo.');
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (code.trim().length < 4) {
      setError('Escribe el código de 6 dígitos que te enviamos.');
      return;
    }
    if (!isPasswordValid(password)) {
      setError('La nueva contraseña debe tener mayúsculas, minúsculas, un número y un símbolo (mínimo 8 caracteres).');
      return;
    }
    if (confirm !== password) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      await confirmReset(email, code, password);
      setStep('done');
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={t.auth.recoverTitle} subtitle={t.auth.recoverSubtitle}>
      {step === 'email' && (
        <form onSubmit={sendCode} className="grid gap-4" noValidate>
          <div>
            <Label htmlFor="rec-email">{t.auth.email}</Label>
            <Input id="rec-email" type="email" autoComplete="email" placeholder={t.auth.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {error && <p role="alert" className="rounded-xl border-2 border-coral-deep bg-[#FFE9E0] p-3 text-sm font-bold text-coral-deep">{error}</p>}
          <Button type="submit" variant="coral" className="w-full" disabled={busy}>{busy ? t.auth.sendingCode : t.auth.sendCode}</Button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={resetPassword} className="grid gap-4" noValidate>
          <p className="flex items-start gap-2 rounded-xl border-2 border-ink bg-sun/60 p-3 text-sm font-bold" role="status">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
            Enviamos un código de 6 dígitos a <strong>{email}</strong>. Escríbelo abajo junto con tu nueva contraseña.
          </p>
          {isMockMode && devCode && (
            <p className="rounded-xl border-2 border-dashed border-ink bg-white p-3 text-sm font-medium" role="note">
              Vista previa local: tu código es <strong className="text-lg tracking-widest">{devCode}</strong> (con backend real llegaría por correo).
            </p>
          )}
          <div>
            <Label htmlFor="rec-code">{t.auth.codeLabel}</Label>
            <Input id="rec-code" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="rec-password">{t.auth.newPasswordLabel}</Label>
            <div className="relative">
              <Input id="rec-password" type={show ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-14" />
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
            <Label htmlFor="rec-confirm">{t.auth.confirmNewPasswordLabel}</Label>
            <Input id="rec-confirm" type={show ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          {error && <p role="alert" className="rounded-xl border-2 border-coral-deep bg-[#FFE9E0] p-3 text-sm font-bold text-coral-deep">{error}</p>}
          <Button type="submit" variant="coral" className="w-full" disabled={busy}>{busy ? 'Guardando…' : t.auth.resetPassword}</Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('email')}>Reenviar a otro correo</Button>
        </form>
      )}

      {step === 'done' && (
        <div className="grid gap-4 text-center" role="status">
          <span className="sticker mx-auto flex h-14 w-14 rotate-3 items-center justify-center rounded-full bg-leaf"><MailCheck className="h-7 w-7 text-white" /></span>
          <p className="font-display text-2xl font-black">¡Contraseña actualizada!</p>
          <p className="text-sm font-medium text-ink-soft">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <Button variant="sunny" className="w-full" onClick={() => onNavigate('login')}>Ir a iniciar sesión</Button>
        </div>
      )}

      <button
        onClick={() => onNavigate('login')}
        className="mt-6 flex min-h-[48px] items-center justify-center gap-2 rounded text-sm font-black text-coral-deep underline decoration-sun decoration-[3px] underline-offset-4"
      >
        <ArrowLeft className="h-4 w-4" /> {t.auth.backToLogin}
      </button>
    </AuthLayout>
  );
}
