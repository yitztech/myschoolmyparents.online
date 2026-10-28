import { useEffect, useState, type ComponentType } from 'react';
import { LogOut } from 'lucide-react';
import { AuthNavigator } from './components/auth/AuthNavigator';
import { BookDetail } from './components/BookDetail';
import { Descargas } from './components/Descargas';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { LandingPage } from './components/LandingPage';
import { Cookies } from './components/legal/Cookies';
import { EliminarCuenta } from './components/legal/EliminarCuenta';
import { Privacidad } from './components/legal/Privacidad';
import { Terminos } from './components/legal/Terminos';
import { Library } from './components/Library';
import { Button } from './components/ui/button';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { A11yProvider } from './lib/a11y-context';
import { useAuth } from './lib/auth-context';
import { isMockMode } from './lib/auth';
import { recoverQueue } from './lib/db';
import { kickQueue } from './lib/queue';
import { speech } from './lib/speech';

function LandingPageWrapper() {
  return (
    <LandingPage
      onLoginClick={() => {
        window.location.href = '/';
      }}
      onTryWebClick={() => {
        window.location.href = '/';
      }}
    />
  );
}

/**
 * Páginas públicas con URL propia (se ven sin iniciar sesión). Las enlazan las
 * apps y las fichas de las tiendas, así que estas rutas no deben cambiar.
 * nginx sirve index.html para cualquier ruta, y aquí se elige qué pintar.
 */
const PUBLIC_PAGES: Record<string, ComponentType> = {
  '/landing': LandingPageWrapper,
  '/descargas': Descargas,
  '/legal/privacidad': Privacidad,
  '/legal/terminos': Terminos,
  '/legal/cookies': Cookies,
  '/legal/eliminar-cuenta': EliminarCuenta,
};

function AppContent() {
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();
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

  const footerLinks = [
    { href: '/descargas', label: t.footer.downloads },
    { href: '/legal/privacidad', label: t.footer.privacy },
    { href: '/legal/terminos', label: t.footer.terms },
    { href: '/legal/cookies', label: t.footer.cookies },
    { href: '/legal/eliminar-cuenta', label: t.footer.deleteAccount },
  ];

  return (
    <div className="min-h-screen text-ink">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:border-2 focus:border-ink focus:bg-sun focus:p-2 focus:font-bold"
      >
        {t.nav.skipToContent}
      </a>
      <nav className="relative z-50 border-b-2 border-ink bg-paper/95 backdrop-blur" aria-label="Principal">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <a href="/" className="flex items-center gap-3 rounded-xl" aria-label="MySchoolMyParents Online, inicio">
            <div className="sticker flex h-10 w-10 -rotate-3 items-center justify-center rounded-xl bg-coral font-display text-xl font-black text-white" aria-hidden>
              M
            </div>
            <div className="leading-tight">
              <span className="font-display text-base font-black sm:text-lg">
                MySchoolMyParents <span className="marker">Online</span>
              </span>
              <p className="hidden text-xs font-medium text-ink-soft sm:block">{t.nav.tagline}</p>
            </div>
          </a>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center gap-2">
                <span className="sticker hidden max-w-[200px] truncate rounded-full bg-sun px-3 py-1 text-sm font-bold md:inline" title={user.email}>
                  {user.name}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout} aria-label={t.nav.logout}>
                  <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">{t.nav.logout}</span>
                </Button>
              </div>
            ) : (
              <span className="hidden rounded-full border-2 border-dashed border-ink/40 px-3 py-1 text-xs font-bold text-ink-soft md:inline">
                {isMockMode ? t.nav.guestMode : t.nav.onlineAccounts} · {t.nav.booksSavedHere}
              </span>
            )}
          </div>
        </div>
      </nav>

      <main id="contenido">
        {PublicPage ? (
          <PublicPage />
        ) : loading ? (
          <p role="status" className="mx-auto max-w-[1100px] px-4 py-10 font-bold text-ink-soft">
            {t.nav.loading}
          </p>
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
            {footerLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="inline-block min-h-[40px] rounded px-1 py-2 text-ink-soft underline decoration-sun decoration-2 underline-offset-4 hover:bg-sun/40 hover:text-ink"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mx-auto inline-block -rotate-1 rounded-lg border-2 border-ink bg-white px-4 py-2 text-xs font-bold shadow-[3px_3px_0_#262134]">
          {t.footer.madeForFamily}
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <A11yProvider>
        <AppContent />
      </A11yProvider>
    </I18nProvider>
  );
}
