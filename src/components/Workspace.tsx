// src/components/Workspace.tsx
import { useState, useEffect, useRef } from 'preact/hooks';
import type { BeautifyOptions, JsonError, Tool, Result } from '@/lib/json/types';
import { beautify, minify, validate, buildTree } from '@/lib/json';
import { makeEditor } from '@/lib/editor';
import type { EditorView } from '@codemirror/view';
import StatusBar from './StatusBar';
import ToolOptions from './ToolOptions';
import { readFiles } from '@/lib/fileInput';

type Props = { tool: Tool };

export default function Workspace({ tool }: Props) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<JsonError | null>(null);
  const [status, setStatus] = useState('');
  const [opts, setOpts] = useState<BeautifyOptions>({ indent: 2, sortKeys: false });

  const inputHost = useRef<HTMLDivElement>(null);
  const inputView = useRef<EditorView | null>(null);
  const outputHost = useRef<HTMLDivElement>(null);
  const outputView = useRef<EditorView | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = new URL(window.location.href);
    const indent = u.searchParams.get('indent');
    const sort = u.searchParams.get('sort');
    if (indent || sort) {
      setOpts({
        indent: indent === 'tab' ? '\t' : indent === '4' ? 4 : 2,
        sortKeys: sort === '1',
      });
    }
  }, []);

  useEffect(() => {
    if (!inputHost.current) return;
    inputView.current = makeEditor(inputHost.current, {
      value: input,
      onChange: (v) => setInput(v),
    });
    return () => inputView.current?.destroy();
  }, []);

  useEffect(() => {
    if (!outputHost.current) return;
    outputView.current = makeEditor(outputHost.current, { value: '', readOnly: true });
    return () => outputView.current?.destroy();
  }, []);

  useEffect(() => {
    const v = outputView.current;
    if (!v) return;
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: output } });
  }, [output]);

  function runTool(tool: Tool, src: string, opts: BeautifyOptions): Result {
    switch (tool) {
      case 'beautify': return beautify(src, opts);
      case 'minify':   return minify(src);
      case 'validate': return validate(src);
      case 'parse': {
        const r = buildTree(src);
        return r.ok
          ? { ok: true, output: '', stats: { bytes: 0, keys: 0, depth: 0 } }
          : { ok: false, error: r.error, stats: null };
      }
    }
  }

  const setInputFromFile = async (files: FileList | File[]) => {
    const r = await readFiles(files);
    if (!r.ok) { setStatus(r.reason); return; }
    setInput(r.content);
    inputView.current?.dispatch({
      changes: { from: 0, to: inputView.current.state.doc.length, insert: r.content }
    });
    setStatus(r.extraFiles > 0 ? `Multiple files dropped — using ${r.name}` : `loaded ${r.name}`);
  };

  const onFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files) setInputFromFile(input.files);
  };

  const updateOpts = (o: BeautifyOptions) => {
    setOpts(o);
    const u = new URL(window.location.href);
    u.searchParams.set('indent', o.indent === '\t' ? 'tab' : String(o.indent));
    u.searchParams.set('sort', o.sortKeys ? '1' : '0');
    history.replaceState({}, '', u);
  };

  const run = () => {
    const r = runTool(tool, input, opts);
    if (r.ok) {
      setOutput(r.output);
      setError(null);
      if (tool === 'validate') setStatus(`valid · ${r.stats.keys} keys · depth ${r.stats.depth} · ${r.stats.bytes} B`);
      else if (tool === 'parse') setStatus('parsed');
      else setStatus(`${tool}d · ${r.stats.bytes} B`);
    } else {
      setOutput('');
      setError(r.error);
      setStatus('');
      const v = inputView.current;
      if (v && r.error) {
        v.dispatch({
          selection: { anchor: r.error.offsetStart, head: r.error.offsetEnd },
          scrollIntoView: true,
        });
      }
    }
  };

  const jumpToError = () => {
    const v = inputView.current;
    if (v && error) v.dispatch({
      selection: { anchor: error.offsetStart, head: error.offsetEnd },
      scrollIntoView: true,
    });
    v?.focus();
  };

  return (
    <div class="grid grid-cols-1 md:grid-cols-[1fr_56px_1fr] gap-0 border border-[var(--border)] rounded-md overflow-hidden">
      <div
        ref={inputHost}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer?.files?.length) setInputFromFile(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        class="min-h-[60vh] bg-[var(--editor)]"
      />
      <div class="flex items-center justify-center bg-[var(--paper)] border-x border-[var(--border)]">
        <button
          onClick={run}
          class="text-[var(--amber)] border border-[var(--amber)] px-2 py-2 [writing-mode:vertical-rl] text-xs tracking-widest">
          {tool.toUpperCase()} ▶
        </button>
      </div>
      <div ref={outputHost} class="min-h-[60vh]" />
      <div class="col-span-full">
        <div class="flex items-center justify-between px-3 py-1.5 border-t" style="border-color: var(--border)">
          <div class="flex items-center gap-3">
            <input
              type="file"
              accept=".json,.txt,application/json,text/plain"
              ref={fileRef}
              class="hidden"
              onChange={onFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              class="text-xs text-[var(--muted)] hover:text-[var(--amber)]"
            >
              upload file
            </button>
            <ToolOptions tool={tool} opts={opts} onChange={updateOpts} />
          </div>
        </div>
        <StatusBar tool={tool} status={status} error={error} onJump={jumpToError} />
      </div>
    </div>
  );
}
