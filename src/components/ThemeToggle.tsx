// src/components/ThemeToggle.tsx
import { useEffect, useState } from 'preact/hooks';
import { loadState, saveState } from '@/lib/storage';

type Theme = 'auto' | 'light' | 'dark';
const NEXT: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' };

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto');
  useEffect(() => {
    const s = loadState();
    if (s) setTheme(s.theme);
  }, []);

  const cycle = () => {
    const next = NEXT[theme];
    setTheme(next);
    if (next === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);
    const existing = loadState();
    saveState({
      schemaVersion: 1,
      input: existing?.input ?? '',
      tool: existing?.tool ?? 'beautify',
      options: existing?.options ?? { indent: 2, sortKeys: false },
      theme: next,
    });
  };

  return (
    <button
      type="button"
      onClick={cycle}
      class="text-xs text-[var(--muted)] hover:text-[var(--amber)]"
      aria-label={`Theme: ${theme}. Click to cycle.`}
    >
      ↕ {theme}
    </button>
  );
}
