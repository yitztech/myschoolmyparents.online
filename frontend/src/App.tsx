import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { AuthNavigator } from './components/auth/AuthNavigator';
import { BookDetail } from './components/BookDetail';
import { Library } from './components/Library';
import { Button } from './components/ui/button';
import { useAuth } from './lib/auth-context';
import { isMockMode } from './lib/auth';
import { recoverQueue } from './lib/db';
import { kickQueue } from './lib/queue';
import { speech } from './lib/speech';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [openBook, setOpenBook] = useState<string | null>(null);

  useEffect(() => {
    // Cola persistente y recuperable: processing -> queued al reabrir
    recoverQueue().then(() => kickQueue()).catch(console.error);
  }, []);

  function handleLogout() {
    speech.stop();
    setOpenBook(null);
    logout();
  }

  return (
    <div className="min-h-screen text-ink">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:border-2 focus:border-ink focus:bg-sun focus:p-2 focus:font-bold">
        Saltar al contenido
      </a>
      <nav className="border-b-2 border-ink bg-paper/95 backdrop-blur" aria-label="Principal">
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-3">
          <div className="sticker flex h-10 w-10 -rotate-3 items-center justify-center rounded-xl bg-coral font-display text-xl font-black text-white" aria-hidden>M</div>
          <div className="leading-tight">
            <span className="font-display text-lg font-black">MySchoolMyParents <span className="marker">Online</span></span>
            <p className="hidden text-xs font-medium text-ink-soft sm:block">Del papel de la escuela a la voz de casa</p>
          </div>
          {user ? (
            <div className="ml-auto flex items-center gap-2">
              <span className="sticker hidden max-w-[220px] truncate rounded-full bg-sun px-3 py-1 text-sm font-bold sm:inline" title={user.email}>
                {user.name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" /> Salir
              </Button>
            </div>
          ) : (
            <span className="ml-auto hidden rounded-full border-2 border-dashed border-ink/40 px-3 py-1 text-xs font-bold text-ink-soft sm:inline">
              {isMockMode ? 'Probando en este aparato' : 'Cuentas en línea'} · Libros guardados aquí
            </span>
          )}
        </div>
      </nav>
      <main id="contenido">
        {loading ? (
          <p role="status" className="mx-auto max-w-[1100px] px-4 py-10 font-bold text-ink-soft">Sacando los colores…</p>
        ) : !user ? (
          <AuthNavigator initial="login" />
        ) : openBook ? (
          <BookDetail bookId={openBook} onBack={() => setOpenBook(null)} />
        ) : (
          <Library onOpen={setOpenBook} />
        )}
      </main>
      <footer className="mx-auto max-w-[1100px] px-4 py-10 text-center">
        <p className="mx-auto inline-block -rotate-1 rounded-lg border-2 border-ink bg-white px-4 py-2 text-xs font-bold shadow-[3px_3px_0_#262134]">
          Hecho para leer en familia · Español en casa, voz en el idioma que se aprende
        </p>
      </footer>
    </div>
  );
}
