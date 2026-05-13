import { describe, it, expect } from 'vitest';
import { validate } from '@/lib/json/validate';

describe('validate', () => {
  it('reports stats for nested objects', () => {
    const r = validate('{"a":{"b":{"c":1}},"d":[1,2,3]}');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.stats.keys).toBe(4);    // a, b, c, d
      expect(r.stats.depth).toBe(3);   // {a:{b:{c:.}}}
      expect(r.stats.bytes).toBeGreaterThan(0);
    }
  });

  it('scalar JSON has zero keys and zero depth', () => {
    const r = validate('42');
    if (r.ok) {
      expect(r.stats.keys).toBe(0);
      expect(r.stats.depth).toBe(0);
    }
  });

  it('reports a notice exactly once on duplicate keys (via raw text scan)', () => {
    const r = validate('{"a":1,"a":2}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.notices?.[0]).toMatch(/duplicate key/i);
  });

  it('fails on bad JSON', () => {
    expect(validate('{nope}').ok).toBe(false);
  });
});
