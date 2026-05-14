// src/components/Workspace.tsx

import type { EditorView } from '@codemirror/view';
import { useEffect, useRef, useState } from 'preact/hooks';
import { makeEditor } from '@/lib/editor';
import { readFiles } from '@/lib/fileInput';
import { beautify, buildTree, minify, validate } from '@/lib/json';
import type { BeautifyOptions, JsonError, Result, Tool, TreeNode } from '@/lib/json/types';
import { clearState, loadState, saveState } from '@/lib/storage';
import StatusBar from './StatusBar';
import ToolOptions from './ToolOptions';
import TreeExplorer from './TreeExplorer';

const FIVE_MB = 5 * 1024 * 1024;
const FIFTY_MB = 50 * 1024 * 1024;

type Props = { tool: Tool };

export default function Workspace({ tool }: Props) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<JsonError | null>(null);
  const [status, setStatus] = useState('');
  const [opts, setOpts] = useState<BeautifyOptions>({ indent: 2, sortKeys: false });
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [bytes, setBytes] = useState(0);

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
    const s = loadState();
    if (s && s.tool === tool) {
      setInput(s.input);
      setOpts(s.options);
      inputView.current?.dispatch({
        changes: { from: 0, to: inputView.current.state.doc.length, insert: s.input },
      });
    }
  }, []);

  useEffect(() => {
    if (!inputHost.current) return;
    inputView.current = makeEditor(inputHost.current, {
      value: input,
      ariaLabel: 'Input JSON',
      onChange: (v) => setInput(v),
    });
    return () => inputView.current?.destroy();
  }, []);

  useEffect(() => {
    if (!outputHost.current) return;
    outputView.current = makeEditor(outputHost.current, {
      value: '',
      readOnly: true,
      ariaLabel: 'Output JSON',
    });
    return () => outputView.current?.destroy();
  }, []);

  useEffect(() => {
    const v = outputView.current;
    if (!v) return;
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: output } });
  }, [output]);

  useEffect(() => {
    const v = inputView.current;
    if (!v) return;
    if (v.state.doc.toString() === input) return;
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: input } });
  }, [input]);

  useEffect(() => {
    const id = setTimeout(() => {
      saveState({
        schemaVersion: 1,
        input,
        tool,
        options: opts,
        theme: loadState()?.theme ?? 'auto',
      });
    }, 150);
    return () => clearTimeout(id);
  }, [input, tool, opts]);

  useEffect(() => {
    const id = setTimeout(() => setBytes(new TextEncoder().encode(input).length), 200);
    return () => clearTimeout(id);
  }, [input]);

  function runTool(tool: Tool, src: string, opts: BeautifyOptions): Result {
    switch (tool) {
      case 'beautify':
        return beautify(src, opts);
      case 'minify':
        return minify(src);
      case 'validate':
        return validate(src);
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
    if (!r.ok) {
      setStatus(r.reason);
      return;
    }
    setInput(r.content);
    inputView.current?.dispatch({
      changes: { from: 0, to: inputView.current.state.doc.length, insert: r.content },
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
    if (
      bytes > FIFTY_MB &&
      !confirm(`This input is ${(bytes / 1024 / 1024).toFixed(0)} MB. Proceed?`)
    )
      return;
    if (tool === 'parse') {
      const r = buildTree(input);
      if (r.ok) {
        setTree(r.tree);
        setError(null);
        setStatus('parsed');
      } else {
        setTree(null);
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
      return;
    }
    const r = runTool(tool, input, opts);
    if (r.ok) {
      setOutput(r.output);
      setError(null);
      if (tool === 'validate')
        setStatus(`valid · ${r.stats.keys} keys · depth ${r.stats.depth} · ${r.stats.bytes} B`);
      else setStatus(`${tool}d · ${r.stats.bytes} B`);
      if (r.notices?.length) setStatus((s) => `${s} · ${r.notices?.join(' · ')}`);
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
    if (v && error)
      v.dispatch({
        selection: { anchor: error.offsetStart, head: error.offsetEnd },
        scrollIntoView: true,
      });
    v?.focus();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setStatus('copied');
    } catch {
      setStatus("Couldn't copy — your browser blocked clipboard access");
    }
  };

  const download = () => {
    const blob = new Blob([output], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${tool}-output.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        run();
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setInput('');
        setOutput('');
        setError(null);
        setStatus('cleared');
        inputView.current?.dispatch({
          changes: { from: 0, to: inputView.current.state.doc.length, insert: '' },
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run]);

  return (
    <div class="flex flex-col flex-1 min-h-0 border border-[var(--border)] rounded-md overflow-hidden">
      {bytes > FIVE_MB && (
        <div
          class="text-xs text-[var(--amber)] px-3 py-1.5 border-b"
          style="border-color: var(--border)"
        >
          Large payload ({(bytes / 1024 / 1024).toFixed(1)} MB) — operation may take a moment.
        </div>
      )}
      <div class="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)] gap-0">
        {/* biome-ignore lint/a11y/noStaticElementInteractions: CodeMirror inside owns focus/keyboard; the wrapper only forwards drag-drop events */}
        <div
          ref={inputHost}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer?.files?.length) setInputFromFile(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          class="min-h-0 overflow-hidden bg-[var(--editor)]"
        />
        <div class="flex items-center justify-center bg-[var(--paper)] border-x border-[var(--border)]">
          <button
            type="button"
            onClick={run}
            aria-label={`Run ${tool}`}
            class="text-[var(--amber)] border border-[var(--amber)] px-2 py-2 [writing-mode:vertical-rl] text-xs tracking-widest"
          >
            {tool.toUpperCase()} ▶
          </button>
        </div>
        <div class="flex flex-col min-h-0">
          {tool === 'parse' ? (
            <div class="flex-1 min-h-0 bg-[var(--editor)] overflow-auto">
              {tree && <TreeExplorer tree={tree} />}
            </div>
          ) : (
            <div ref={outputHost} class="flex-1 min-h-0 overflow-hidden" />
          )}
          <div class="flex gap-2 text-xs px-3 py-1.5 border-t" style="border-color: var(--border)">
            <div class="flex border border-[var(--border)] rounded">
              <button
                type="button"
                onClick={copy}
                disabled={!output}
                aria-label="Copy output"
                class="px-2 py-0.5 text-[var(--muted)] hover:text-[var(--amber)] disabled:opacity-40"
              >
                copy
              </button>
              <button
                type="button"
                onClick={download}
                disabled={!output}
                aria-label="Download output"
                class="px-2 py-0.5 border-l border-[var(--border)] text-[var(--muted)] hover:text-[var(--amber)] disabled:opacity-40"
              >
                download
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        class="flex items-center justify-between px-3 py-1.5 border-t"
        style="border-color: var(--border)"
      >
        <div class="flex items-center gap-4">
          <input
            type="file"
            accept=".json,.txt,application/json,text/plain"
            ref={fileRef}
            class="hidden"
            onChange={onFileChange}
          />
          <div class="flex border border-[var(--border)] rounded text-xs">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Upload JSON file"
              class="px-2 py-0.5 text-[var(--muted)] hover:text-[var(--amber)]"
            >
              upload file
            </button>
            <button
              type="button"
              onClick={() => {
                clearState();
                setInput('');
                setOutput('');
                setError(null);
                inputView.current?.dispatch({
                  changes: { from: 0, to: inputView.current.state.doc.length, insert: '' },
                });
              }}
              aria-label="Clear input"
              class="px-2 py-0.5 border-l border-[var(--border)] text-[var(--muted)] hover:text-[var(--amber)]"
            >
              clear
            </button>
          </div>
          <ToolOptions tool={tool} opts={opts} onChange={updateOpts} />
        </div>
      </div>
      <StatusBar tool={tool} status={status} error={error} onJump={jumpToError} />
    </div>
  );
}
