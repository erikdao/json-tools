import { useState } from 'preact/hooks';
import type { TreeNode } from '@/lib/json/types';

type Props = { tree: TreeNode };

function matches(node: TreeNode, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const keyHit = String(node.key ?? '').toLowerCase().includes(needle);
  if (keyHit) return true;
  if (node.kind === 'object' || node.kind === 'array') return node.children.some((c) => matches(c, q));
  return JSON.stringify((node as any).value).toLowerCase().includes(needle);
}

function Row({ node, depth, q }: { node: TreeNode; depth: number; q: string }) {
  const [open, setOpen] = useState(depth < 2);
  const isContainer = node.kind === 'object' || node.kind === 'array';

  if (q && !matches(node, q)) return null;
  const effectiveOpen = q ? true : open;

  const copy = () => navigator.clipboard?.writeText(node.path);

  return (
    <div data-row>
      <div class="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[color-mix(in_srgb,var(--amber)_8%,transparent)]"
           style={{ paddingLeft: `${depth * 14 + 8}px` }}>
        {isContainer
          ? <button onClick={() => setOpen(!open)} class="text-[var(--muted)] w-3"
              aria-label={effectiveOpen ? 'Collapse' : 'Expand'}>{effectiveOpen ? '▾' : '▸'}</button>
          : <span class="w-3" />}
        <span class="text-[var(--muted)] text-xs uppercase tracking-wider">{node.kind}</span>
        <span class="text-[var(--ink)]">{String(node.key ?? 'root')}</span>
        {!isContainer && (
          <span class="text-[var(--str)]">{JSON.stringify((node as any).value)}</span>
        )}
        <button onClick={copy} aria-label={`Copy path ${node.path || '(root)'}`}
          class="ml-auto text-xs text-[var(--muted)] hover:text-[var(--amber)]">⎘</button>
      </div>
      {isContainer && effectiveOpen && (node as any).children.map((c: TreeNode) => (
        <Row node={c} depth={depth + 1} q={q} />
      ))}
    </div>
  );
}

export default function TreeExplorer({ tree }: Props) {
  const [q, setQ] = useState('');
  return (
    <div class="font-mono text-sm py-2">
      <input
        value={q}
        onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        placeholder="search keys or values…"
        class="w-full mb-2 px-2 py-1 bg-transparent border border-[var(--border)] rounded text-xs"
        aria-label="Filter tree"
      />
      <Row node={tree} depth={0} q={q} />
    </div>
  );
}
