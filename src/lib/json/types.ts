// src/lib/json/types.ts
export type JsonError = {
  line: number;
  column: number;
  offsetStart: number;
  offsetEnd: number;
  message: string;
  hint?: string;
};

export type Stats = {
  bytes: number;
  keys: number;
  depth: number;
};

export type Result =
  | { ok: true;  output: string; stats: Stats; notices?: string[] }
  | { ok: false; error: JsonError; stats: null; notices?: string[] };

export type BeautifyOptions = { indent: 2 | 4 | '\t'; sortKeys: boolean };

export type Tool = 'beautify' | 'minify' | 'validate' | 'parse';

// Tree for /parse
export type TreeNode =
  | { kind: 'object'; key: string | number | null; path: string; children: TreeNode[] }
  | { kind: 'array';  key: string | number | null; path: string; children: TreeNode[] }
  | { kind: 'string' | 'number' | 'boolean' | 'null';
      key: string | number | null; path: string; value: unknown };
