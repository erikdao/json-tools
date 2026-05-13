// src/components/Workspace.tsx
import { useState, useEffect, useRef } from 'preact/hooks';
import type { BeautifyOptions, JsonError, Tool } from '@/lib/json/types';
import { makeEditor } from '@/lib/editor';
import type { EditorView } from '@codemirror/view';
import StatusBar from './StatusBar';

type Props = { tool: Tool };

export default function Workspace({ tool }: Props) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<JsonError | null>(null);
  const [status, setStatus] = useState('');
  const [opts, setOpts] = useState<BeautifyOptions>({ indent: 2, sortKeys: false });

  const inputHost = useRef<HTMLDivElement>(null);
  const inputView = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!inputHost.current) return;
    inputView.current = makeEditor(inputHost.current, {
      value: input,
      onChange: (v) => setInput(v),
    });
    return () => inputView.current?.destroy();
  }, []);

  return (
    <div class="grid grid-cols-1 md:grid-cols-[1fr_56px_1fr] gap-0 border border-[var(--border)] rounded-md overflow-hidden">
      <div ref={inputHost} class="min-h-[60vh] bg-[var(--editor)]" />
      <div class="flex items-center justify-center bg-[var(--paper)] border-x border-[var(--border)]">
        <button
          onClick={() => { /* run wired in T22 */ }}
          class="text-[var(--amber)] border border-[var(--amber)] px-2 py-2 [writing-mode:vertical-rl] text-xs tracking-widest">
          {tool.toUpperCase()} ▶
        </button>
      </div>
      <div class="min-h-[60vh] bg-[var(--editor)] p-3 font-mono text-sm whitespace-pre overflow-auto">
        {output || <span class="text-[var(--muted)]">— no output —</span>}
      </div>
      <div class="col-span-full">
        <StatusBar tool={tool} status={status} error={error} />
      </div>
    </div>
  );
}
