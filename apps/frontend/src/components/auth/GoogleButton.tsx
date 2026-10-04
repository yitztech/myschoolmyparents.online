import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { getGoogleOAuthUrl, isMockMode, AuthError } from '../../lib/auth';
import { isEmailValid } from '../../lib/password';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input, Label } from '../ui/input';

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.5 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.4 7.4 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.5-2.7-.1.1C.5 8.9 0 10.4 0 12s.5 3.1 1.5 4.5l3.7-2.1z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.5 2.6 1.5 6.4l3.7 2.9c1-2.9 3.6-4.6 6.8-4.6z" />
    </svg>
  );
}

/**
 * Alta/login con Google.
 *
 * Se oculta por completo si no hay OAuth configurado: hoy el backend
 * responde 410 a /api/auth/google, así que mostrarlo solo llevaría a un
 * error. Incluye su propio separador para no dejar un "o" huérfano cuando
 * no se pinta.
 */
export function GoogleButton({ mode }: { mode: 'register' | 'login' }) {
  const { loginGoogle, googleEnabled } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function start() {
    if (!isMockMode) {
      // Flujo real: el backend en internet inicia OAuth2 con Google.
      window.location.href = getGoogleOAuthUrl();
      return;
    }
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Escribe el nombre de tu cuenta de Google.');
      return;
    }
    if (!isEmailValid(email)) {
      setError('Escribe un correo válido.');
      return;
    }
    setBusy(true);
    try {
      await loginGoogle(name.trim(), email);
      setOpen(false);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'No se pudo continuar con Google.');
    } finally {
      setBusy(false);
    }
  }

  if (!googleEnabled) return null;

  return (
    <>
      <div className="my-4 flex items-center gap-3 text-xs font-bold text-ink-soft" aria-hidden>
        <span className="h-0.5 flex-1 rounded bg-ink/15" /><span>o</span><span className="h-0.5 flex-1 rounded bg-ink/15" />
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={start} aria-label={mode === 'register' ? 'Registrarse con Google' : 'Continuar con Google'}>
        <GoogleIcon />
        {mode === 'register' ? 'Registrarse con Google' : 'Continuar con Google'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continuar con Google (vista previa local)</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-medium text-ink-soft">
            Aún no hay backend conectado, así que simulamos la cuenta de Google. Cuando conectes{' '}
            <code className="rounded-md border border-ink bg-sun/50 px-1 font-bold">VITE_AUTH_API_URL</code>, este botón redirigirá al OAuth2 real del backend.
          </p>
          <form onSubmit={submit} className="grid gap-3">
            <div>
              <Label htmlFor="google-name">Nombre de la cuenta</Label>
              <Input id="google-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. María García" autoComplete="name" />
            </div>
            <div>
              <Label htmlFor="google-email">Correo de Google</Label>
              <Input id="google-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@gmail.com" autoComplete="email" />
            </div>
            {error && <p role="alert" className="rounded-xl border-2 border-coral-deep bg-[#FFE9E0] p-3 text-sm font-bold text-coral-deep">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={busy}>{busy ? 'Conectando…' : 'Continuar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
