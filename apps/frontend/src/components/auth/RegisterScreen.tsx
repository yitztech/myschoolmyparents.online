import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { AuthError } from '../../lib/auth';
import { isEmailValid, isPasswordValid } from '../../lib/password';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/input';
import { AuthLayout } from './AuthLayout';
import { GoogleButton } from './GoogleButton';
import { PasswordChecklist } from './PasswordChecklist';
import type { AuthView } from './AuthNavigator';

export function RegisterScreen({ onNavigate }: { onNavigate: (v: AuthView) => void }) {
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
    if (name.trim().length < 2) {
      setError('Escribe tu nombre (mínimo 2 letras).');
      return;
    }
    if (!isEmailValid(email)) {
      setError('Escribe un correo electrónico válido.');
      return;
    }
    if (!isPasswordValid(password)) {
      setError('La contraseña debe tener mayúsculas, minúsculas, un número y un símbolo (mínimo 8 caracteres).');
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
    <AuthLayout title="Crear cuenta" subtitle="Solo necesitas tu nombre, tu correo y una contraseña segura.">
      <form onSubmit={submit} className="grid gap-4" noValidate>
        <div>
          <Label htmlFor="reg-name">Nombre</Label>
          <Input id="reg-name" autoComplete="name" placeholder="Ej. María García" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="reg-email">Correo electrónico</Label>
          <Input id="reg-email" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="reg-password">Contraseña</Label>
          <div className="relative">
            <Input
              id="reg-password" type={show ? 'text' : 'password'} autoComplete="new-password"
              placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-14"
            />
            <button
              type="button" onClick={() => setShow((s) => !s)}
              className="absolute right-1 top-1/2 flex min-h-[48px] min-w-[48px] -translate-y-1/2 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-deep"
              aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="mt-2"><PasswordChecklist password={password} /></div>
        </div>
        <div>
          <Label htmlFor="reg-confirm">Confirmar contraseña</Label>
          <Input
            id="reg-confirm" type={show ? 'text' : 'password'} autoComplete="new-password"
            placeholder="Repite la contraseña" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={confirm.length > 0 && confirm !== password}
          />
          {confirm.length > 0 && confirm !== password && (
            <p role="alert" className="mt-1 text-sm font-bold text-coral-deep">Las contraseñas no coinciden.</p>
          )}
        </div>
        {(error || oauthError) && <p role="alert" className="rounded-xl border-2 border-coral-deep bg-[#FFE9E0] p-3 text-sm font-bold text-coral-deep">{error || oauthError}</p>}
        <Button type="submit" variant="coral" className="w-full" disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear cuenta'}</Button>
        <p className="text-center text-xs font-medium text-ink-soft">
          Al crear la cuenta aceptas los{' '}
          <a href="/legal/terminos" className="font-bold underline decoration-sun decoration-2 underline-offset-2">Términos</a> y la{' '}
          <a href="/legal/privacidad" className="font-bold underline decoration-sun decoration-2 underline-offset-2">Política de privacidad</a>.
        </p>
      </form>

      <GoogleButton mode="register" />

      <p className="mt-6 text-center text-sm font-medium text-ink-soft">
        ¿Ya tienes cuenta?{' '}
        <button onClick={() => onNavigate('login')} className="min-h-[48px] rounded font-black text-coral-deep underline decoration-sun decoration-[3px] underline-offset-4 hover:bg-sun/40">
          Inicia sesión
        </button>
      </p>
    </AuthLayout>
  );
}
