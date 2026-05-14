import { normalizeJsonError } from './errors';
import type { Result } from './types';

export function parseRaw(src: string): unknown {
  const stripped = src.charCodeAt(0) === 0xfeff ? src.slice(1) : src;
  return JSON.parse(stripped);
}

// Returns a Result whose .output is the input string unchanged (round-tripped through
// the parser to confirm validity, but the consumer rarely needs the parsed value here).
export function parse(src: string): Result {
  if (src.trim() === '') {
    return {
      ok: false,
      stats: null,
      error: { line: 1, column: 1, offsetStart: 0, offsetEnd: 0, message: 'empty input' },
    };
  }
  try {
    parseRaw(src);
    return {
      ok: true,
      output: src,
      stats: { bytes: new TextEncoder().encode(src).length, keys: 0, depth: 0 },
    };
  } catch (e) {
    return { ok: false, stats: null, error: normalizeJsonError(src, e as Error) };
  }
}
