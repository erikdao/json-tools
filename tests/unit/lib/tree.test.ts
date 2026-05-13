import { describe, it, expect } from 'vitest';
import { buildTree } from '@/lib/json/tree';

describe('buildTree', () => {
  it('produces dotted paths for object members', () => {
    const r = buildTree('{"a":{"b":1}}');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const root = r.tree;
    expect(root.kind).toBe('object');
    if (root.kind !== 'object') return;
    expect(root.children[0].path).toBe('a');
    expect((root.children[0] as any).children[0].path).toBe('a.b');
  });

  it('uses bracketed indices for arrays', () => {
    const r = buildTree('{"users":[{"email":"x"}]}');
    if (!r.ok) return;
    const users = (r.tree as any).children[0];
    expect(users.path).toBe('users');
    expect(users.children[0].path).toBe('users[0]');
    expect(users.children[0].children[0].path).toBe('users[0].email');
  });

  it('tags primitive types', () => {
    const r = buildTree('[1,"x",true,null]');
    if (!r.ok) return;
    const kinds = (r.tree as any).children.map((c: any) => c.kind);
    expect(kinds).toEqual(['number', 'string', 'boolean', 'null']);
  });

  it('returns ok:false for invalid JSON', () => {
    expect(buildTree('{nope}').ok).toBe(false);
  });
});
