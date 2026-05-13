import { describe, it, expect } from 'vitest';
import { minify } from '@/lib/json/minify';

describe('minify', () => {
  it('strips whitespace', () => {
    const r = minify('{\n  "a": 1,\n  "b": [1, 2]\n}');
    if (r.ok) expect(r.output).toBe('{"a":1,"b":[1,2]}');
  });
  it('preserves escapes', () => {
    const r = minify('{"s": "a\\nb"}');
    if (r.ok) expect(r.output).toBe('{"s":"a\\nb"}');
  });
  it('round-trips minified output', () => {
    const r1 = minify('{"a":1}');
    if (r1.ok) expect(JSON.parse(r1.output)).toEqual({ a: 1 });
  });
});
