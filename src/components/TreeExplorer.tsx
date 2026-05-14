import { useState } from 'preact/hooks';
import type { TreeNode } from '@/lib/json/types';

type Props = { tree: TreeNode };

type FlatRow = { node: TreeNode; depth: number };

function isContainerNode(node: TreeNode): node is Extract<TreeNode, { children: TreeNode[] }> {
  return node.kind === 'object' || node.kind === 'array';
}

function matches(node: TreeNode, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  const keyHit = String(node.key ?? '')
    .toLowerCase()
    .includes(needle);
  if (keyHit) return true;
  if (isContainerNode(node)) return node.children.some((c) => matches(c, q));
  return JSON.stringify(node.value).toLowerCase().includes(needle);
}

function flatten(
  node: TreeNode,
  depth: number,
  openSet: Set<string>,
  out: FlatRow[],
  q: string,
): void {
  if (q && !matches(node, q)) return;
  out.push({ node, depth });
  if (!isContainerNode(node)) return;
  const open = q ? true : openSet.has(node.path) || depth < 2;
  if (open) for (const c of node.children) flatten(c, depth + 1, openSet, out, q);
}

function Row({
  node,
  depth,
  open,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  open: boolean;
  onToggle: () => void;
}) {
  const copy = () => navigator.clipboard?.writeText(node.path);

  return (
    <div data-row style={{ height: `${24}px` }}>
      <div
        class="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[color-mix(in_srgb,var(--amber)_8%,transparent)]"
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {isContainerNode(node) ? (
          <button
            type="button"
            onClick={onToggle}
            class="text-[var(--muted)] w-3"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span class="w-3" />
        )}
        <span class="text-[var(--muted)] text-xs uppercase tracking-wider">{node.kind}</span>
        <span class="text-[var(--ink)]">{String(node.key ?? 'root')}</span>
        {!isContainerNode(node) && (
          <span class="text-[var(--str)]">{JSON.stringify(node.value)}</span>
        )}
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy path ${node.path || '(root)'}`}
          class="ml-auto text-xs text-[var(--muted)] hover:text-[var(--amber)]"
        >
          ⎘
        </button>
      </div>
    </div>
  );
}

const ROW_H = 24;
const WINDOW_PAD = 10;

export default function TreeExplorer({ tree }: Props) {
  const [q, setQ] = useState('');
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(0);

  const rows: FlatRow[] = [];
  flatten(tree, 0, openSet, rows, q);

  const virtualize = rows.length > 1000;
  const startIdx = virtualize ? Math.max(0, Math.floor(scrollTop / ROW_H) - WINDOW_PAD) : 0;
  const endIdx = virtualize
    ? Math.min(rows.length, Math.ceil((scrollTop + viewport) / ROW_H) + WINDOW_PAD)
    : rows.length;
  const visible = rows.slice(startIdx, endIdx);

  const toggle = (path: string) => {
    const next = new Set(openSet);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setOpenSet(next);
  };

  return (
    <div class="font-mono text-sm">
      <input
        value={q}
        onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        placeholder="search keys or values…"
        class="w-full px-2 py-1 bg-transparent border-b border-[var(--border)] text-xs"
        aria-label="Filter tree"
      />
      <div
        class="max-h-[60vh] overflow-auto relative"
        onScroll={(e) => setScrollTop((e.target as HTMLElement).scrollTop)}
        ref={(el) => {
          if (el) setViewport(el.clientHeight);
        }}
      >
        {virtualize && <div style={{ height: `${startIdx * ROW_H}px` }} />}
        {visible.map(({ node, depth }) => (
          <Row
            node={node}
            depth={depth}
            open={q ? true : openSet.has(node.path) || depth < 2}
            onToggle={() => toggle(node.path)}
          />
        ))}
        {virtualize && <div style={{ height: `${(rows.length - endIdx) * ROW_H}px` }} />}
      </div>
    </div>
  );
}
