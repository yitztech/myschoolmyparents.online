import { useState } from 'react';
import { useA11y, type A11yTheme } from '../lib/a11y-context';
import { useI18n } from '../i18n/I18nContext';
import { Button } from './ui/button';
import { Eye, HelpCircle, Sparkles, Type } from 'lucide-react';

export function AccessibilityToolbar() {
  const {
    theme,
    setTheme,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    focusMode,
    toggleFocusMode,
    wideSpacing,
    toggleWideSpacing,
  } = useA11y();
  const { t } = useI18n();
  const [showHelp, setShowHelp] = useState(false);

  const cycleTheme = () => {
    const next: Record<A11yTheme, A11yTheme> = {
      standard: 'hc-dark',
      'hc-dark': 'hc-light',
      'hc-light': 'standard',
    };
    setTheme(next[theme]);
  };

  const themeLabel =
    theme === 'hc-dark'
      ? t.a11y.highContrastDark
      : theme === 'hc-light'
      ? t.a11y.highContrastLight
      : t.a11y.defaultTheme;

  return (
    <div
      role="region"
      aria-label={t.a11y.toolbarLabel}
      className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-ink/30 bg-white/95 p-2 text-ink shadow-sm"
    >
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={cycleTheme}
          aria-label={`Contraste: ${themeLabel}. Pulsa para cambiar`}
          title={`Contraste: ${themeLabel}`}
          className="min-h-[44px] font-bold"
        >
          <Eye className="h-4 w-4 mr-1 text-coral-deep" />
          <span className="text-xs">{themeLabel}</span>
        </Button>
      </div>

      <div className="flex items-center gap-1 border-l-2 border-ink/20 pl-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={decreaseFontSize}
          disabled={fontSize <= 18}
          aria-label="Disminuir tamaño de letra"
          title="Disminuir tamaño de letra (-)"
          className="h-11 w-11 p-0 font-bold"
        >
          A-
        </Button>
        <span
          className="min-w-[42px] text-center text-xs font-black"
          aria-live="polite"
          aria-label={`Tamaño de letra ${fontSize} puntos`}
        >
          {fontSize}pt
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={increaseFontSize}
          disabled={fontSize >= 60}
          aria-label="Aumentar tamaño de letra"
          title="Aumentar tamaño de letra (+)"
          className="h-11 w-11 p-0 font-bold"
        >
          A+
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1 border-l-2 border-ink/20 pl-2">
        <Button
          size="sm"
          variant={focusMode ? 'coral' : 'outline'}
          onClick={toggleFocusMode}
          aria-pressed={focusMode}
          aria-label={t.a11y.focusMode}
          className="min-h-[44px] text-xs font-bold"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          {focusMode ? 'Párrafo activo' : 'Modo Enfoque'}
        </Button>

        <Button
          size="sm"
          variant={wideSpacing ? 'sunny' : 'outline'}
          onClick={toggleWideSpacing}
          aria-pressed={wideSpacing}
          aria-label="Espaciado amplio entre líneas y letras"
          className="min-h-[44px] text-xs font-bold"
        >
          <Type className="h-3.5 w-3.5 mr-1" />
          Espaciado amplio
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowHelp(!showHelp)}
          aria-expanded={showHelp}
          aria-label="Ayuda de atajos de teclado"
          className="h-11 w-11 p-0"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      {showHelp && (
        <div
          role="note"
          className="w-full rounded-lg border border-ink/20 bg-paper-deep/80 p-2 text-xs font-medium text-ink"
        >
          <p className="font-bold">{t.a11y.keyboardHelp}</p>
          <ul className="mt-1 list-disc list-inside space-y-0.5">
            <li><kbd className="rounded border bg-white px-1 font-mono">Espacio</kbd>: Reproducir / Pausar lectura</li>
            <li><kbd className="rounded border bg-white px-1 font-mono">↓</kbd> o <kbd className="rounded border bg-white px-1 font-mono">J</kbd>: Siguiente párrafo</li>
            <li><kbd className="rounded border bg-white px-1 font-mono">↑</kbd> o <kbd className="rounded border bg-white px-1 font-mono">K</kbd>: Párrafo anterior</li>
            <li><kbd className="rounded border bg-white px-1 font-mono">R</kbd>: Repetir párrafo actual</li>
            <li><kbd className="rounded border bg-white px-1 font-mono">+</kbd> / <kbd className="rounded border bg-white px-1 font-mono">-</kbd>: Aumentar / reducir tamaño de letra</li>
          </ul>
        </div>
      )}
    </div>
  );
}
