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

  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Cerrar con Escape y navegar con flechas arriba/abajo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = itemRefs.current.filter((el): el is HTMLButtonElement => el !== null);
        if (items.length === 0) return;
        const currentIndex = items.findIndex((el) => el === document.activeElement);
        const nextIndex =
          e.key === 'ArrowDown'
            ? (currentIndex + 1) % items.length
            : (currentIndex - 1 + items.length) % items.length;
        items[nextIndex]?.focus();
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
    <div className="relative inline-block text-left z-50" ref={containerRef}>
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
          className="absolute right-0 z-[100] mt-2 w-72 origin-top-right rounded-2xl border-2 border-ink bg-white shadow-[6px_6px_0_#262134] focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Cabecera idéntica a la imagen: VER ESTE SITIO EN ESPAÑOL */}
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3 text-left">
            <p className="text-[0.8rem] font-black uppercase tracking-wider text-slate-500">
              {currentMeta.header}
            </p>
          </div>

          {/* Opciones con banderas, texto y checkmark */}
          <div className="divide-y divide-slate-100 py-1" role="none">
            {SUPPORTED_LOCALES.map((item, idx) => {
              const isSelected = item.code === locale;
              return (
                <button
                  key={item.code}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
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
