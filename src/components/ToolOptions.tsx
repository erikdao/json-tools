// src/components/ToolOptions.tsx
import type { BeautifyOptions, Tool } from '@/lib/json/types';

type Props = { tool: Tool; opts: BeautifyOptions; onChange: (o: BeautifyOptions) => void };

export default function ToolOptions({ tool, opts, onChange }: Props) {
  if (tool !== 'beautify') {
    return <div class="text-xs text-[var(--muted)] font-mono">{tool} · no options</div>;
  }
  const indents: BeautifyOptions['indent'][] = [2, 4, '\t'];
  return (
    <div class="flex items-center gap-4 text-xs font-mono">
      <span class="text-[var(--muted)]">indent</span>
      <div class="flex border border-[var(--border)] rounded">
        {indents.map((i) => (
          <button
            onClick={() => onChange({ ...opts, indent: i })}
            class={`px-2 py-0.5 ${opts.indent === i ? 'text-[var(--amber)]' : 'text-[var(--muted)]'}`}
            aria-pressed={opts.indent === i}
          >{i === '\t' ? 'tab' : i}</button>
        ))}
      </div>
      <label class="flex items-center gap-1.5 cursor-pointer">
        <input type="checkbox" checked={opts.sortKeys}
          onChange={(e) => onChange({ ...opts, sortKeys: (e.target as HTMLInputElement).checked })} />
        <span>sort keys</span>
      </label>
    </div>
  );
}
