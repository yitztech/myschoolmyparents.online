import { Download } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './ui/card';
import { A, H2, P, UL } from './legal/LegalLayout';
import { APP_NAME, RELEASES_URL } from '../legal/site';
import { useI18n } from '../i18n/I18nContext';
import { useLatestRelease } from '../lib/latest-release';

/**
 * Página pública de descargas de las apps (no hace falta cuenta).
 *
 * Los botones apuntan a /descargas/android y /descargas/ios, o a las URLs
 * directas del último release detectado por useLatestRelease().
 */
export function Descargas() {
  const { t } = useI18n();
  const release = useLatestRelease();
  const version = release.tag;
  const etiqueta = `${release.version}+${release.build}`;

  return (
    <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-10">
      <header>
        <p className="sticker inline-block -rotate-1 rounded-md bg-ink px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-paper">
          {t.downloads.badge}
        </p>
        <h1 className="mt-2 break-words font-display text-[2rem] font-black leading-none sm:text-5xl">
          {t.downloads.title} <span className="marker">{APP_NAME}</span>
        </h1>
        <p className="mt-3 max-w-[60ch] font-medium text-ink-soft">
          {t.downloads.subtitle} {t.downloads.guestNotice}
          {version && (
            <>
              {' '}
              {t.downloads.currentVersion} <strong className="text-ink">{version}</strong> (
              {t.downloads.build} {release.build}).
            </>
          )}
        </p>
        <p className="mt-3 max-w-[60ch] rounded-xl border-2 border-dashed border-ink/40 bg-white/70 p-3 text-sm font-bold">
          {t.downloads.storeNotice}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Plataforma
          titulo={t.downloads.androidTitle}
          detalle={t.downloads.androidDesc}
          href={release.androidUrl}
          plataforma="android"
          etiqueta={etiqueta}
          boton={t.downloads.androidBtn}
        >
          <UL>
            <li>
              Abre el archivo descargado. Android te pedirá permiso para instalar apps de esa fuente: concédelo solo para esta instalación.
            </li>
            <li>Las versiones nuevas se instalan encima de la anterior y conservan tus libros.</li>
          </UL>
        </Plataforma>

        <Plataforma
          titulo={t.downloads.iosTitle}
          detalle={t.downloads.iosDesc}
          href={release.iosUrl}
          plataforma="ios"
          etiqueta={etiqueta}
          boton={t.downloads.iosBtn}
        >
          <UL>
            <li>
              Apple solo permite instalar apps firmadas. Fírmala e instálala con tu Apple ID usando AltStore o Sideloadly.
            </li>
            <li>Con un Apple ID gratuito la firma caduca a los 7 días: la herramienta la renueva si la dejas configurada.</li>
          </UL>
        </Plataforma>
      </div>

      <Card className="p-6 sm:p-8 [&>h2:first-child]:mt-0">
        <H2>{t.downloads.verifyTitle}</H2>
        <P>
          {t.downloads.verifyDesc}{' '}
          <A href={RELEASES_URL}>{t.downloads.releaseNotesLink}</A>.
        </P>
        <P>
          Al descargar e instalar la app aceptas los <A href="/legal/terminos">Términos y condiciones</A>. Lo que hace con
          tus datos está en la <A href="/legal/privacidad">Política de privacidad</A>.
        </P>
      </Card>
    </div>
  );
}

function Plataforma(props: {
  titulo: string;
  detalle: string;
  href: string;
  plataforma: 'android' | 'ios';
  etiqueta: string;
  boton: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col p-6 sm:p-8">
      <h2 className="font-display text-3xl font-black">{props.titulo}</h2>
      <p className="mt-1 text-sm font-bold text-ink-soft">{props.detalle}</p>
      <a
        href={props.href}
        data-umami-event="descarga"
        data-umami-event-plataforma={props.plataforma}
        data-umami-event-version={props.etiqueta}
        className="sticker mt-5 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-ink bg-coral px-5 py-3 font-black text-white shadow-[4px_4px_0_#262134] hover:-translate-y-0.5"
      >
        <Download className="h-5 w-5" aria-hidden /> {props.boton}
      </a>
      <div className="mt-2">{props.children}</div>
    </Card>
  );
}
