import { BookOpen, Camera, Download, LogIn, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useLatestRelease } from '../lib/latest-release';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Props {
  onLoginClick: () => void;
  onTryWebClick: () => void;
}

export function LandingPage({ onLoginClick, onTryWebClick }: Props) {
  const { t } = useI18n();
  const release = useLatestRelease();

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:py-14">
      {/* Hero Section */}
      <section className="text-center md:text-left md:grid md:grid-cols-[1.2fr_0.8fr] md:items-center md:gap-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun/40 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-ink shadow-[2px_2px_0_#262134]">
            <Sparkles className="h-4 w-4 text-coral" aria-hidden />
            {t.landing.badge}
          </div>

          <h1 className="mt-4 font-display text-4xl font-black leading-tight sm:text-6xl sm:leading-[1.1]">
            {t.landing.heroTitle} <span className="marker">{t.landing.heroHighlight}</span>
          </h1>

          <p className="mt-4 max-w-[54ch] text-lg font-medium leading-relaxed text-ink-soft">
            {t.landing.heroDescription}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 md:justify-start">
            <Button
              variant="coral"
              size="lg"
              onClick={onTryWebClick}
              className="min-h-[52px] text-base font-black shadow-[4px_4px_0_#262134]"
            >
              <BookOpen className="h-5 w-5 mr-1" aria-hidden />
              {t.landing.ctaTryWeb}
            </Button>

            <a
              href="/descargas"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-xl border-2 border-ink bg-white px-5 py-3 text-base font-black text-ink shadow-[4px_4px_0_#262134] transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <Download className="h-5 w-5" aria-hidden />
              {t.landing.ctaDownload} <span className="text-xs text-ink-soft">({release.tag})</span>
            </a>

            <Button
              variant="ghost"
              size="lg"
              onClick={onLoginClick}
              className="min-h-[52px] text-base font-bold text-ink hover:bg-sun/30"
            >
              <LogIn className="h-5 w-5 mr-1" aria-hidden />
              {t.landing.ctaLogin}
            </Button>
          </div>

          <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-ink-soft">
            <ShieldCheck className="h-4 w-4 text-leaf" aria-hidden />
            {t.landing.offlineBadge}
          </p>
        </div>

        {/* Ilustración interactiva hero */}
        <div className="mt-10 md:mt-0 flex justify-center">
          <div className="relative w-full max-w-[340px] rounded-3xl border-3 border-ink bg-white p-6 shadow-[8px_8px_0_#262134]">
            <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
              <span className="sticker rounded-md bg-sun px-2 py-0.5 text-xs font-black">
                {release.tag}
              </span>
              <span className="text-xs font-bold text-ink-soft">Reading in English</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border-2 border-ink bg-slate-50 p-3">
                <p className="font-display text-lg font-bold">The little bear <mark className="word-active px-1 rounded">explored</mark> the forest.</p>
                <div className="mt-2 flex items-center justify-between text-xs font-bold text-ink-soft">
                  <span>🔊 /ɪkˈsplɔːd/</span>
                  <span className="text-leaf">exploró</span>
                </div>
              </div>
              <div className="rounded-xl border-2 border-dashed border-ink/30 p-3 text-sm text-ink-soft">
                Toca cualquier palabra para escuchar su sonido nativo y ver el significado didáctico.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="mt-16 sm:mt-24 grid gap-6 md:grid-cols-3" aria-label="Características">
        <Card className="p-6 sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-coral text-white shadow-[3px_3px_0_#262134]" aria-hidden>
            <Camera className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-black">{t.landing.feature1Title}</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-ink-soft">{t.landing.feature1Desc}</p>
        </Card>

        <Card className="p-6 sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-sun text-ink shadow-[3px_3px_0_#262134]" aria-hidden>
            <Volume2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-black">{t.landing.feature2Title}</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-ink-soft">{t.landing.feature2Desc}</p>
        </Card>

        <Card className="p-6 sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-leaf text-white shadow-[3px_3px_0_#262134]" aria-hidden>
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-black">{t.landing.feature3Title}</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-ink-soft">{t.landing.feature3Desc}</p>
        </Card>
      </section>
    </div>
  );
}
