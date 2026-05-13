// src/components/StatusBar.tsx
import type { JsonError, Tool } from '@/lib/json/types';

type Props = { tool: Tool; status: string; error: JsonError | null; onJump?: () => void };

export default function StatusBar({ tool, status, error, onJump }: Props) {
  return (
    <div role="status" aria-live="polite"
         class="px-3 py-2 border-t text-xs flex gap-3 font-mono"
         style="border-color: var(--border)">
      {error ? (
        <>
          <span class="text-[var(--error)]">› {tool} failed at {error.line}:{error.column} — {error.hint ?? error.message}</span>
          {onJump && (
            <button onClick={onJump} class="text-[var(--amber)] underline-offset-2 hover:underline">[ jump ]</button>
          )}
        </>
      ) : status ? (
        <span>› {status}</span>
      ) : (
        <span class="text-[var(--muted)]">› ready</span>
      )}
    </div>
  );
}
