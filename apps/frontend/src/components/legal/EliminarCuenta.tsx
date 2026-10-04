import { useState, type FormEvent } from 'react';
import { A, Dato, H2, LegalLayout, P, UL } from './LegalLayout';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/input';
import { useAuth } from '../../lib/auth-context';
import { AuthError } from '../../lib/auth';
import { db } from '../../lib/db';
import { speech } from '../../lib/speech';
import { APP_NAME, LEGAL } from '../../legal/site';

/**
 * Eliminación de la cuenta. Es la URL que piden Google Play y App Store para
 * apps con cuentas: explica qué se borra y, con la sesión iniciada, permite
 * hacerlo aquí mismo (las apps abren esta página).
 */
export function EliminarCuenta() {
  const { user, deleteAccount } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [borrarLocal, setBorrarLocal] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);

  const isGoogleOnly = user?.hasPassword === false;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!window.confirm('¿Eliminar tu cuenta para siempre? No se puede deshacer.')) return;
    setBusy(true);
    try {
      await deleteAccount(isGoogleOnly ? { confirmEmail } : { password });
      if (borrarLocal) {
        speech.stop();
        await Promise.all(db.tables.map((t) => t.clear()));
      }
      setHecho(true);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'No se pudo eliminar la cuenta. Inténtalo de nuevo en unos minutos.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <LegalLayout slug="eliminar-cuenta" title="Eliminar tu cuenta">
      <P>
        Puedes eliminar tu cuenta de {APP_NAME} (web y apps de Android e iOS) en cualquier momento. Es inmediato y no se
        puede deshacer.
      </P>

      <H2>Qué se borra</H2>
      <UL>
        <li>De nuestro servidor: tu nombre, tu correo, el hash de tu contraseña (si creaste una) o el identificador de Google enlazado, y cualquier código de recuperación pendiente.</li>
        <li>Las sesiones abiertas dejan de funcionar en todos los dispositivos.</li>
        <li>
          Tus libros nunca llegan a nuestro servidor: viven en tu dispositivo. En este navegador puedes borrarlos a la vez
          (opción de abajo); en las apps, desinstálalas o borra los libros desde la biblioteca.
        </li>
        <li>
          Los registros técnicos del servidor que puedan contener tu correo se eliminan solos al cumplir su plazo (
          <Dato value={LEGAL.plazoRegistros} label="plazo de los registros" />).
        </li>
      </UL>

      <H2>Eliminarla ahora</H2>
      {hecho ? (
        <p role="status" className="mt-4 rounded-xl border-2 border-leaf bg-[#E3F6EA] p-4 font-bold">
          Tu cuenta se ha eliminado. Gracias por haber leído con nosotros.
        </p>
      ) : user ? (
        <form onSubmit={onSubmit} className="mt-4 grid max-w-md gap-4">
          {isGoogleOnly ? (
            <>
              <P>
                Has iniciado sesión con Google como <strong>{user.email}</strong>. Por seguridad, escribe tu
                correo electrónico para confirmar la eliminación.
              </P>
              <div>
                <Label htmlFor="del-email">Correo electrónico de la cuenta</Label>
                <Input
                  id="del-email" type="email" autoComplete="email" required
                  value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={user.email}
                />
              </div>
            </>
          ) : (
            <>
              <P>
                Has iniciado sesión como <strong>{user.email}</strong>. Escribe tu contraseña para confirmar.
              </P>
              <div>
                <Label htmlFor="del-password">Contraseña</Label>
                <Input
                  id="del-password" type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}
          <label className="flex items-start gap-2 text-sm font-medium">
            <input type="checkbox" className="mt-1 h-4 w-4" checked={borrarLocal} onChange={(e) => setBorrarLocal(e.target.checked)} />
            Borrar también los libros guardados en este navegador
          </label>
          {error && <p role="alert" className="rounded-xl border-2 border-coral-deep bg-[#FFE9E0] p-3 text-sm font-bold text-coral-deep">{error}</p>}
          <Button type="submit" variant="coral" disabled={busy || (isGoogleOnly ? !confirmEmail : !password)}>{busy ? 'Eliminando…' : 'Eliminar mi cuenta'}</Button>
        </form>
      ) : (
        <P>
          <A href="/">Inicia sesión</A> y vuelve a esta página para eliminarla aquí. Si ya no puedes entrar, escribe a{' '}
          <Dato value={LEGAL.correoPrivacidad} label="correo de privacidad" /> desde el correo de la cuenta con el asunto
          «Eliminar mi cuenta»; la eliminamos en un plazo de{' '}
          <Dato value={LEGAL.plazoEliminacion} label="plazo para atender la solicitud" /> y te lo confirmamos.
        </P>
      )}

      <H2>Desde las apps</H2>
      <P>
        En la app, abre <strong>Acerca de la app → Eliminar cuenta</strong>: te trae a esta página. Si usas el modo
        invitado no hay cuenta que borrar; basta con desinstalar la app.
      </P>
    </LegalLayout>
  );
}
