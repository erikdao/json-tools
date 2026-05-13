// tests/unit/lib/errors.test.ts
import { describe, it, expect } from 'vitest';
import { normalizeJsonError } from '@/lib/json/errors';

function parseError(src: string) {
  try { JSON.parse(src); throw new Error('expected throw'); }
  catch (e) { return normalizeJsonError(src, e as Error); }
}

describe('normalizeJsonError', () => {
  it('locates a trailing comma before }', () => {
    const e = parseError('{ "a": 1, }');
    expect(e.line).toBe(1);
    expect(e.column).toBeGreaterThanOrEqual(10);
    expect(e.hint).toMatch(/trailing comma/i);
  });

  it('flags single quotes', () => {
    const e = parseError("{ 'a': 1 }");
    expect(e.hint).toMatch(/single quotes/i);
  });

  it('flags unquoted keys', () => {
    const e = parseError('{ a: 1 }');
    expect(e.hint).toMatch(/quoted/i);
  });

  it('flags unterminated input', () => {
    const e = parseError('{ "a":');
    expect(e.hint).toMatch(/ends mid-value|missing/i);
  });

  it('reports line/column on multi-line input', () => {
    const src = '{\n  "a": 1,\n  "b": ,\n}';
    const e = parseError(src);
    expect(e.line).toBe(3);
    expect(e.column).toBeGreaterThan(0);
  });

  it('returns no hint when the message has no match', () => {
    const e = parseError('@@@');
    expect(e.message).toBeTruthy();
  });
});
