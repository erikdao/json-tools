import { describe, expect, it } from 'vitest';
import { parse } from '@/lib/json/parse';

describe('parse', () => {
  it('accepts valid object', () => {
    const r = parse('{"a":1}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.output).toBe('{"a":1}');
  });

  it('accepts scalar inputs', () => {
    for (const src of ['null', 'true', 'false', '42', '"x"']) {
      expect(parse(src).ok).toBe(true);
    }
  });

  it('rejects trailing comma', () => {
    const r = parse('{"a":1,}');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.hint).toMatch(/trailing comma/i);
  });

  it('treats empty / whitespace as not-an-error empty', () => {
    for (const src of ['', '   ', '\n\n']) {
      const r = parse(src);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toMatch(/empty/i);
    }
  });

  it('strips BOM before parsing', () => {
    expect(parse('﻿{"a":1}').ok).toBe(true);
  });
});
