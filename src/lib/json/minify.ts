import type { Result } from './types';
import { parseRaw } from './parse';
import { normalizeJsonError } from './errors';

export function minify(src: string): Result {
  if (src.trim() === '') {
    return { ok: false, stats: null,
      error: { line: 1, column: 1, offsetStart: 0, offsetEnd: 0, message: 'empty input' } };
  }
  try {
    const output = JSON.stringify(parseRaw(src));
    return { ok: true, output, stats: { bytes: output.length, keys: 0, depth: 0 } };
  } catch (e) {
    return { ok: false, stats: null, error: normalizeJsonError(src, e as Error) };
  }
}
