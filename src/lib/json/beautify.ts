import type { BeautifyOptions, Result } from './types';
import { parseRaw } from './parse';
import { normalizeJsonError } from './errors';
import { sortKeysDeep } from './sortKeys';

export function beautify(src: string, opts: BeautifyOptions): Result {
  if (src.trim() === '') {
    return { ok: false, stats: null,
      error: { line: 1, column: 1, offsetStart: 0, offsetEnd: 0, message: 'empty input' } };
  }
  try {
    const raw = parseRaw(src);
    const value = opts.sortKeys ? sortKeysDeep(raw) : raw;
    const output = JSON.stringify(value, null, opts.indent);
    return { ok: true, output, stats: { bytes: new TextEncoder().encode(output).length, keys: 0, depth: 0 } };
  } catch (e) {
    return { ok: false, stats: null, error: normalizeJsonError(src, e as Error) };
  }
}
