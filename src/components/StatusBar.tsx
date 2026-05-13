// src/components/StatusBar.tsx
import type { JsonError, Tool } from '@/lib/json/types';

type Props = { tool: Tool; status: string; error: JsonError | null };

export default function StatusBar({ tool, status, error }: Props) {
  return (
    <div role="status" aria-live="polite"
         class="px-3 py-2 border-t text-xs flex gap-3 font-mono"
         style="border-color: var(--border)">
      {error
        ? <span class="text-[var(--error)]">› {tool} failed at {error.line}:{error.column} — {error.hint ?? error.message}</span>
        : status
          ? <span>› {status}</span>
          : <span class="text-[var(--muted)]">› ready</span>}
    </div>
  );
}
