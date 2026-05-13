import { describe, it, expect } from 'vitest';
import { beautify } from '@/lib/json/beautify';

describe('beautify', () => {
  it('indents with 2 spaces', () => {
    const r = beautify('{"a":1}', { indent: 2, sortKeys: false });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.output).toBe('{\n  "a": 1\n}');
  });

  it('indents with 4 spaces', () => {
    const r = beautify('{"a":1}', { indent: 4, sortKeys: false });
    if (r.ok) expect(r.output).toContain('    "a"');
  });

  it('indents with tab', () => {
    const r = beautify('{"a":1}', { indent: '\t', sortKeys: false });
    if (r.ok) expect(r.output).toContain('\t"a"');
  });

  it('sortKeys orders object keys alphabetically', () => {
    const r = beautify('{"b":1,"a":2}', { indent: 2, sortKeys: true });
    if (r.ok) expect(r.output.indexOf('"a"')).toBeLessThan(r.output.indexOf('"b"'));
  });

  it('sortKeys leaves array order alone', () => {
    const r = beautify('[3,1,2]', { indent: 2, sortKeys: true });
    if (r.ok) expect(r.output.replace(/\s/g, '')).toBe('[3,1,2]');
  });

  it('sortKeys recurses into nested objects', () => {
    const r = beautify('{"x":{"b":1,"a":2}}', { indent: 2, sortKeys: true });
    if (r.ok) expect(r.output).toMatch(/"a": 2[\s\S]*"b": 1/);
  });

  it('returns error for invalid input', () => {
    const r = beautify('{a:1}', { indent: 2, sortKeys: false });
    expect(r.ok).toBe(false);
  });
});
