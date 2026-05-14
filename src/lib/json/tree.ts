import { normalizeJsonError } from './errors';
import { parseRaw } from './parse';
import type { JsonError, TreeNode } from './types';

function joinPath(parent: string, key: string | number): string {
  if (typeof key === 'number') return `${parent}[${key}]`;
  return parent ? `${parent}.${key}` : key;
}

function build(v: unknown, key: string | number | null, path: string): TreeNode {
  if (Array.isArray(v))
    return {
      kind: 'array',
      key,
      path,
      children: v.map((item, i) => build(item, i, joinPath(path, i))),
    };
  if (v && typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>);
    return {
      kind: 'object',
      key,
      path,
      children: entries.map(([k, val]) => build(val, k, joinPath(path, k))),
    };
  }
  const kind: TreeNode['kind'] =
    v === null
      ? 'null'
      : typeof v === 'string'
        ? 'string'
        : typeof v === 'number'
          ? 'number'
          : typeof v === 'boolean'
            ? 'boolean'
            : 'string';
  return { kind, key, path, value: v };
}

export function buildTree(
  src: string,
): { ok: true; tree: TreeNode } | { ok: false; error: JsonError } {
  try {
    return { ok: true, tree: build(parseRaw(src), null, '') };
  } catch (e) {
    return { ok: false, error: normalizeJsonError(src, e as Error) };
  }
}
