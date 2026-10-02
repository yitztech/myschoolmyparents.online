import type { ReactNode } from 'react';
import { Card } from '../ui/card';
import { LEGAL, LEGAL_PAGES, type LegalSlug } from '../../legal/site';

/** Un dato del titular, o «[pendiente: …]» resaltado mientras no esté definido. */
export function Dato({ value, label }: { value: string | null; label: string }) {
  if (value) return <>{value}</>;
  return <mark className="rounded bg-sun/70 px-1 font-bold">[pendiente: {label}]</mark>;
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-8 font-display text-2xl font-black">{children}</h2>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-5 text-lg font-black">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 font-medium leading-relaxed">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="mt-3 list-disc space-y-2 pl-6 font-medium leading-relaxed">{children}</ul>;
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith('http');
  return (
    <a
      href={href}
      className="font-black text-coral-deep underline decoration-sun decoration-[3px] underline-offset-4 hover:bg-sun/40"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

const fecha = new Date(`${LEGAL.actualizado}T12:00:00Z`).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });

/** Armazón común de los documentos legales: título, aviso de borrador, fecha y navegación entre ellos. */
export function LegalLayout({ slug, title, children }: { slug: LegalSlug | null; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-10 lg:grid-cols-[230px_1fr]">
      <nav aria-label="Documentos legales" className="lg:sticky lg:top-6 lg:self-start">
        <p className="text-xs font-bold uppercase tracking-widest text-coral-deep">Legal</p>
        <ul className="mt-2 grid gap-1">
          {LEGAL_PAGES.map((p) => (
            <li key={p.slug}>
              <a
                href={`/legal/${p.slug}`}
                aria-current={p.slug === slug ? 'page' : undefined}
                className="block rounded-lg px-3 py-2 text-sm font-bold hover:bg-sun/40 aria-[current=page]:bg-ink aria-[current=page]:text-paper"
              >
                {p.title}
              </a>
            </li>
          ))}
          <li>
            <a href="/descargas" className="block rounded-lg px-3 py-2 text-sm font-bold hover:bg-sun/40">Descargar la app</a>
          </li>
          <li>
            <a href="/" className="block rounded-lg px-3 py-2 text-sm font-bold text-ink-soft hover:bg-sun/40">← Volver a la app</a>
          </li>
        </ul>
      </nav>
      <Card className="p-6 sm:p-9">
        <article>
          <h1 className="font-display text-3xl font-black sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm font-bold text-ink-soft">Última actualización: {fecha}</p>
          {LEGAL.borrador && (
            <p role="note" className="mt-4 rounded-xl border-2 border-dashed border-coral-deep bg-[#FFE9E0] p-3 text-sm font-bold text-coral-deep">
              Borrador pendiente de revisión legal. Los datos marcados como «pendiente» se completarán antes de la
              versión definitiva.
            </p>
          )}
          {children}
        </article>
      </Card>
    </div>
  );
}
