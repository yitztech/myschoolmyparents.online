import { useEffect, useState, type ComponentType } from 'react';
import { LogOut } from 'lucide-react';
import { AuthNavigator } from './components/auth/AuthNavigator';
import { BookDetail } from './components/BookDetail';
import { Descargas } from './components/Descargas';
import { Cookies } from './components/legal/Cookies';
import { EliminarCuenta } from './components/legal/EliminarCuenta';
import { Privacidad } from './components/legal/Privacidad';
import { Terminos } from './components/legal/Terminos';
import { Library } from './components/Library';
import { Button } from './components/ui/button';
import { useAuth } from './lib/auth-context';
import { isMockMode } from './lib/auth';
import { recoverQueue } from './lib/db';
import { kickQueue } from './lib/queue';
import { speech } from './lib/speech';

/**
 * Páginas públicas con URL propia (se ven sin iniciar sesión). Las enlazan las
 * apps y las fichas de las tiendas, así que estas rutas no deben cambiar.
 * nginx sirve index.html para cualquier ruta, y aquí se elige qué pintar.
 */
const PUBLIC_PAGES: Record<string, ComponentType> = {
  '/descargas': Descargas,
  '/legal/privacidad': Privacidad,
  '/legal/terminos': Terminos,
  '/legal/cookies': Cookies,
  '/legal/eliminar-cuenta': EliminarCuenta,
};

const FOOTER_LINKS = [
  { href: '/descargas', label: 'Descargar la app' },
  { href: '/legal/privacidad', label: 'Privacidad' },
  { href: '/legal/terminos', label: 'Términos' },
  { href: '/legal/cookies', label: 'Cookies' },
  { href: '/legal/eliminar-cuenta', label: 'Eliminar cuenta' },
];

export default function App() {
  const { user, loading, logout } = useAuth();
  const [openBook, setOpenBook] = useState<string | null>(null);
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const PublicPage = path === '/legal' ? Privacidad : PUBLIC_PAGES[path];

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
          <a href="/" className="flex items-center gap-3 rounded-xl" aria-label="MySchoolMyParents Online, inicio">
          <div className="sticker flex h-10 w-10 -rotate-3 items-center justify-center rounded-xl bg-coral font-display text-xl font-black text-white" aria-hidden>M</div>
          <div className="leading-tight">
            <span className="font-display text-lg font-black">MySchoolMyParents <span className="marker">Online</span></span>
            <p className="hidden text-xs font-medium text-ink-soft sm:block">Del papel de la escuela a la voz de casa</p>
          </div>
          </a>
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
        {PublicPage ? (
          <PublicPage />
        ) : loading ? (
          <p role="status" className="mx-auto max-w-[1100px] px-4 py-10 font-bold text-ink-soft">Sacando los colores…</p>
        ) : !user ? (
          <AuthNavigator initial="login" />
        ) : openBook ? (
          <BookDetail bookId={openBook} onBack={() => setOpenBook(null)} />
        ) : (
          <Library onOpen={setOpenBook} />
        )}
      </main>
      <footer className="mx-auto grid max-w-[1100px] justify-items-center gap-4 px-4 py-10 text-center">
        <nav aria-label="Información legal y descargas">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-bold">
            {FOOTER_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-block min-h-[40px] rounded px-1 py-2 text-ink-soft underline decoration-sun decoration-2 underline-offset-4 hover:bg-sun/40 hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mx-auto inline-block -rotate-1 rounded-lg border-2 border-ink bg-white px-4 py-2 text-xs font-bold shadow-[3px_3px_0_#262134]">
          Hecho para leer en familia · Español en casa, voz en el idioma que se aprende
        </p>
      </footer>
    </div>
  );
}
