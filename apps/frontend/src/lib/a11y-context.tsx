import React, { createContext, useContext, useEffect, useState } from 'react';

export type A11yTheme = 'standard' | 'hc-dark' | 'hc-light';

export interface A11yContextValue {
  theme: A11yTheme;
  setTheme: (theme: A11yTheme) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  focusMode: boolean;
  setFocusMode: (mode: boolean) => void;
  toggleFocusMode: () => void;
  wideSpacing: boolean;
  setWideSpacing: (wide: boolean) => void;
  toggleWideSpacing: () => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
  announce: (message: string) => void;
}

const A11yContext = createContext<A11yContextValue | null>(null);

const STORAGE_KEY_THEME = 'msm_a11y_theme';
const STORAGE_KEY_FONT_SIZE = 'msm_a11y_fontsize';
const STORAGE_KEY_FOCUS_MODE = 'msm_a11y_focus_mode';
const STORAGE_KEY_WIDE_SPACING = 'msm_a11y_wide_spacing';

export function A11yProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<A11yTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) as A11yTheme;
      if (saved === 'standard' || saved === 'hc-dark' || saved === 'hc-light') return saved;
      if (window.matchMedia?.('(prefers-contrast: more)').matches) return 'hc-dark';
    } catch {
      // ignore
    }
    return 'standard';
  });

  const [fontSize, setFontSizeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FONT_SIZE);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 18 && val <= 60) return val;
      }
    } catch {
      // ignore
    }
    return 24;
  });

  const [focusMode, setFocusModeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_FOCUS_MODE) === 'true';
    } catch {
      return false;
    }
  });

  const [wideSpacing, setWideSpacingState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_WIDE_SPACING) === 'true';
    } catch {
      return false;
    }
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    try {
      return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    } catch {
      return false;
    }
  });

  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-hc-dark', 'theme-hc-light');
    if (theme === 'hc-dark') {
      root.classList.add('theme-hc-dark');
      root.setAttribute('data-theme', 'hc-dark');
    } else if (theme === 'hc-light') {
      root.classList.add('theme-hc-light');
      root.setAttribute('data-theme', 'hc-light');
    } else {
      root.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = (nextTheme: A11yTheme) => {
    setThemeState(nextTheme);
  };

  const setFontSize = (size: number) => {
    const clamped = Math.max(18, Math.min(60, Math.round(size)));
    setFontSizeState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY_FONT_SIZE, String(clamped));
    } catch {
      // ignore
    }
  };

  const increaseFontSize = () => {
    setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    setFontSize(fontSize - 2);
  };

  const setFocusMode = (mode: boolean) => {
    setFocusModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY_FOCUS_MODE, String(mode));
    } catch {
      // ignore
    }
  };

  const toggleFocusMode = () => setFocusMode(!focusMode);

  const setWideSpacing = (wide: boolean) => {
    setWideSpacingState(wide);
    try {
      localStorage.setItem(STORAGE_KEY_WIDE_SPACING, String(wide));
    } catch {
      // ignore
    }
  };

  const toggleWideSpacing = () => setWideSpacing(!wideSpacing);

  const announce = (msg: string) => {
    setLiveAnnouncement(msg);
  };

  return (
    <A11yContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        focusMode,
        setFocusMode,
        toggleFocusMode,
        wideSpacing,
        setWideSpacing,
        toggleWideSpacing,
        reducedMotion,
        setReducedMotion,
        announce,
      }}
    >
      {children}
      {/* Región ARIA polite para lectores de pantalla */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="a11y-announcements"
      >
        {liveAnnouncement}
      </div>
    </A11yContext.Provider>
  );
}

export function useA11y(): A11yContextValue {
  const ctx = useContext(A11yContext);
  if (!ctx) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  return ctx;
}
