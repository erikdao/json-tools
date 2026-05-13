import type { Result, Stats } from './types';
import { parseRaw } from './parse';
import { normalizeJsonError } from './errors';

function walk(v: unknown): { keys: number; depth: number } {
  if (Array.isArray(v)) {
    let keys = 0, depth = 1;
    for (const item of v) {
      const w = walk(item);
      keys += w.keys;
      depth = Math.max(depth, w.depth + 1);
    }
    return { keys, depth: v.length === 0 ? 1 : depth };
  }
  if (v && typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>);
    let keys = entries.length, depth = 1;
    for (const [, val] of entries) {
      const w = walk(val);
      keys += w.keys;
      depth = Math.max(depth, w.depth + 1);
    }
    return { keys, depth: entries.length === 0 ? 1 : depth };
  }
  return { keys: 0, depth: 0 };
}

// Heuristic duplicate-key scan: counts <"key">: occurrences across the raw text per
// containing object. Simple, fast, no second parser pass.
function firstDuplicateKey(src: string): string | null {
  const stack: Map<string, number>[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '{') { stack.push(new Map()); i++; continue; }
    if (ch === '}') { stack.pop(); i++; continue; }
    if (ch === '"' && stack.length > 0) {
      let j = i + 1;
      while (j < src.length && src[j] !== '"') j += src[j] === '\\' ? 2 : 1;
      const key = src.slice(i + 1, j);
      let k = j + 1;
      while (k < src.length && /\s/.test(src[k])) k++;
      if (src[k] === ':') {
        const top = stack[stack.length - 1];
        if (top.has(key)) return key;
        top.set(key, (top.get(key) ?? 0) + 1);
      }
      i = j + 1;
      continue;
    }
    i++;
  }
  return null;
}

export function validate(src: string): Result {
  if (src.trim() === '') {
    return { ok: false, stats: null,
      error: { line: 1, column: 1, offsetStart: 0, offsetEnd: 0, message: 'empty input' } };
  }
  try {
    const raw = parseRaw(src);
    const w = walk(raw);
    const stats: Stats = { keys: w.keys, depth: w.depth, bytes: new TextEncoder().encode(src).length };
    const dup = firstDuplicateKey(src);
    const notices = dup ? [`Duplicate key '${dup}' — kept last value`] : undefined;
    return { ok: true, output: '', stats, notices };
  } catch (e) {
    return { ok: false, stats: null, error: normalizeJsonError(src, e as Error) };
  }
}
