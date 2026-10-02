import type { ReactNode } from 'react';
import { Card } from '../ui/card';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-[1020px] gap-6 px-4 py-10 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
      <div className="sticker-pop relative overflow-hidden rounded-2xl border-2 border-ink bg-ink p-7 text-paper shadow-[7px_7px_0_#262134] sm:p-9">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-coral" aria-hidden />
        <div className="absolute -bottom-14 -left-8 h-52 w-52 rounded-full bg-sun" aria-hidden />
        <div className="absolute right-16 top-16 hidden rotate-6 rounded-lg border-2 border-paper/70 px-2 py-1 font-display text-sm italic sm:block" aria-hidden>
          ¡lee conmigo!
        </div>
        <svg viewBox="0 0 200 40" className="absolute bottom-24 right-6 w-32 opacity-70" aria-hidden>
          <path d="M4 30 C 50 4, 120 4, 196 26" fill="none" stroke="#FFC52E" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 -rotate-3 items-center justify-center rounded-2xl border-2 border-paper bg-coral font-display text-xl font-black text-white">M</div>
            <div>
              <p className="font-display text-lg font-black leading-tight">MySchoolMyParents</p>
              <p className="text-xs font-bold uppercase tracking-widest text-sun">Online · familia y escuela</p>
            </div>
          </div>
          <p className="mt-8 font-display text-3xl font-black leading-[1.05] sm:text-4xl">
            Las hojas<br />de la mochila,<br /><span className="bg-sun px-2 text-ink">suenas en casa.</span>
          </p>
          <p className="mt-4 max-w-[34ch] font-medium text-paper/85">
            Fotografía las páginas, revisa lo que leyó la app y escúchalo con tus hijos en el idioma que están aprendiendo.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-leaf px-3 py-1 text-xs font-bold text-white">Se guarda en este aparato</span>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-ink">Sin papeleo perdido</span>
            <span className="rounded-full bg-candy px-3 py-1 text-xs font-bold text-ink">Con voz alta</span>
          </div>
        </div>
      </div>
      <Card className="tape w-full p-6 sm:p-8">
        <p className="inline-block -rotate-1 rounded-md bg-[#DCD4FF] px-2 py-0.5 text-xs font-bold text-ink">Cuaderno de familia</p>
        <h1 className="mt-2 font-display text-3xl font-black">{title}</h1>
        <p className="mt-1 font-medium text-ink-soft">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </Card>
    </div>
  );
}
