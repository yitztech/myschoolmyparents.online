import { Download } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './ui/card';
import { A, H2, P, UL } from './legal/LegalLayout';
import { APP_NAME, MOBILE_VERSION, RELEASES_URL } from '../legal/site';

/**
 * Página pública de descargas de las apps (no hace falta cuenta).
 *
 * Los botones apuntan a /descargas/android y /descargas/ios, que nginx
 * redirige al instalador del último release de GitHub. Cada clic se cuenta
 * en Umami como evento «descarga» con la plataforma y la versión
 * (data-umami-event-*); GitHub cuenta además las descargas de cada archivo.
 */
export function Descargas() {
  const version = MOBILE_VERSION ? `v${MOBILE_VERSION.version}` : null;
  const etiqueta = MOBILE_VERSION ? `${MOBILE_VERSION.version}+${MOBILE_VERSION.build}` : 'ultima';

  return (
    <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-10">
      <header>
        <p className="sticker inline-block -rotate-1 rounded-md bg-ink px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-paper">
          Apps para el móvil
        </p>
        <h1 className="mt-2 break-words font-display text-[2rem] font-black leading-none sm:text-5xl">
          Descarga <span className="marker">{APP_NAME}</span>
        </h1>
        <p className="mt-3 max-w-[60ch] font-medium text-ink-soft">
          Fotografía las páginas y la app reconoce el texto en el propio teléfono, sin enviar las fotos a ningún sitio.
          No hace falta crear una cuenta: puedes usarla en modo invitado.
          {version && <> Versión actual: <strong className="text-ink">{version}</strong> (compilación {MOBILE_VERSION?.build}).</>}
        </p>
        <p className="mt-3 max-w-[60ch] rounded-xl border-2 border-dashed border-ink/40 bg-white/70 p-3 text-sm font-bold">
          Todavía no estamos en Google Play ni en App Store. Estos instaladores son para personas que ya saben instalar
          apps por su cuenta.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Plataforma
          titulo="Android"
          detalle="APK firmado · Android 7.0 o posterior"
          href="/descargas/android"
          plataforma="android"
          etiqueta={etiqueta}
          boton="Descargar para Android"
        >
          <UL>
            <li>Abre el archivo descargado. Android te pedirá permiso para instalar apps de esa fuente: concédelo solo para esta instalación.</li>
            <li>Las versiones nuevas se instalan encima de la anterior y conservan tus libros.</li>
          </UL>
        </Plataforma>

        <Plataforma
          titulo="iPhone y iPad"
          detalle="IPA sin firmar · iOS 16.4 o posterior"
          href="/descargas/ios"
          plataforma="ios"
          etiqueta={etiqueta}
          boton="Descargar para iOS (sin firmar)"
        >
          <UL>
            <li>Apple solo permite instalar apps firmadas. Fírmala e instálala con tu Apple ID usando AltStore o Sideloadly.</li>
            <li>Con un Apple ID gratuito la firma caduca a los 7 días: la herramienta la renueva si la dejas configurada.</li>
          </UL>
        </Plataforma>
      </div>

      <Card className="p-6 sm:p-8 [&>h2:first-child]:mt-0">
        <H2>Comprueba lo que descargas</H2>
        <P>
          Descarga los instaladores solo desde esta página. Cada versión publica la huella SHA-256 de sus archivos en{' '}
          <A href={RELEASES_URL}>la lista de versiones</A>, junto con las notas de cambios y las versiones anteriores.
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
