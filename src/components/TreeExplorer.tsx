import { useState } from 'preact/hooks';
import type { TreeNode } from '@/lib/json/types';

type Props = { tree: TreeNode };

function Row({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const isContainer = node.kind === 'object' || node.kind === 'array';

  const copy = () => navigator.clipboard?.writeText(node.path);

  return (
    <div>
      <div
        class="flex items-center gap-1.5 px-2 py-0.5 hover:bg-[color-mix(in_srgb,var(--amber)_8%,transparent)]"
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {isContainer
          ? (
            <button onClick={() => setOpen(!open)} class="text-[var(--muted)] w-3">
              {open ? '▾' : '▸'}
            </button>
          )
          : <span class="w-3" />}
        <span class="text-[var(--muted)] text-xs uppercase tracking-wider">{node.kind}</span>
        <span class="text-[var(--ink)]">{String(node.key ?? 'root')}</span>
        {!isContainer && (
          <span class="text-[var(--str)]">{JSON.stringify((node as any).value)}</span>
        )}
        <button
          onClick={copy}
          title={node.path || '(root)'}
          class="ml-auto text-xs text-[var(--muted)] hover:text-[var(--amber)]"
        >
          ⎘
        </button>
      </div>
      {isContainer && open && (node as any).children.map((c: TreeNode) => (
        <Row node={c} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function TreeExplorer({ tree }: Props) {
  return <div class="font-mono text-sm py-2"><Row node={tree} depth={0} /></div>;
}
