import type { BeautifyOptions, Tool } from './json/types';

export type Persisted = {
  schemaVersion: 1;
  input: string;
  tool: Tool;
  options: BeautifyOptions;
  theme: 'auto' | 'light' | 'dark';
};

const KEY = 'jsontools:v1';
const CURRENT_VERSION = 1;

function isPersisted(v: unknown): v is Persisted {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    o.schemaVersion === CURRENT_VERSION &&
    typeof o.input === 'string' &&
    (o.tool === 'beautify' || o.tool === 'minify' || o.tool === 'validate' || o.tool === 'parse') &&
    (o.theme === 'auto' || o.theme === 'light' || o.theme === 'dark') &&
    !!o.options &&
    typeof o.options === 'object'
  );
}

export function loadState(): Persisted | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isPersisted(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveState(state: Persisted): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota — silent */
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
