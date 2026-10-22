import { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { SUPPORTED_LOCALES, type SiteLocale } from '../i18n/locales';

export function LanguageSwitcher() {
  const { locale, setLocale, currentMeta } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (code: SiteLocale) => {
    setLocale(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`${currentMeta.label} - Cambiar idioma / Change language`}
        className="flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 border-ink/20 bg-white/90 px-2.5 py-1.5 text-sm font-bold text-ink shadow-sm transition hover:border-ink hover:bg-white focus:outline-none focus:ring-2 focus:ring-ink"
      >
        <span className="text-base" aria-hidden>{currentMeta.flag}</span>
        <span className="hidden sm:inline font-bold">{currentMeta.label}</span>
        <Globe className="h-4 w-4 text-ink-soft sm:hidden" aria-hidden />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu"
          className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200/90 bg-white shadow-xl ring-1 ring-black/5 focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Cabecera idéntica a la imagen: VER ESTE SITIO EN ESPAÑOL */}
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-left">
            <p className="text-[0.8rem] font-black uppercase tracking-wider text-slate-500">
              {currentMeta.header}
            </p>
          </div>

          {/* Opciones con banderas, texto y checkmark */}
          <div className="divide-y divide-slate-100 py-1" role="none">
            {SUPPORTED_LOCALES.map((item) => {
              const isSelected = item.code === locale;
              return (
                <button
                  key={item.code}
                  role="menuitem"
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`flex w-full min-h-[52px] items-center justify-between px-5 py-3 text-left text-base transition-colors ${
                    isSelected
                      ? 'bg-slate-50/80 font-extrabold text-[#78350f]'
                      : 'font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-xl" aria-hidden>{item.flag}</span>
                    <span className={isSelected ? 'font-bold text-[#78350f]' : 'font-medium'}>
                      {item.label}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 stroke-[2.5] text-[#78350f]" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
