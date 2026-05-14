import { EditorView, lineNumbers, highlightActiveLine, keymap, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
// biome-ignore lint/correctness/noUnusedImports: planned for later tasks
import { Compartment } from '@codemirror/state';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { type Diagnostic, linter, lintGutter } from '@codemirror/lint';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

export const theme = EditorView.theme({
  '&': { backgroundColor: 'var(--editor)', color: 'var(--ink)', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', height: '100%' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-gutters': { backgroundColor: 'var(--editor)', color: 'var(--muted)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--amber)' },
  '.cm-cursor': { borderLeftColor: 'var(--amber)', borderLeftWidth: '2px' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'color-mix(in srgb, var(--amber) 25%, transparent)' },
});

export function makeEditor(parent: HTMLElement, opts: { value: string; readOnly?: boolean; ariaLabel?: string; onChange?: (v: string) => void }) {
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: opts.value,
      extensions: [
        lineNumbers(), lintGutter(), history(), bracketMatching(), drawSelection(), highlightActiveLine(),
        EditorView.lineWrapping,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        json(),
        linter((view): Diagnostic[] =>
          view.state.doc.toString().trim() === '' ? [] : jsonParseLinter()(view),
        ),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        theme,
        EditorView.editable.of(!opts.readOnly),
        EditorState.readOnly.of(!!opts.readOnly),
        EditorView.contentAttributes.of({ 'aria-label': opts.ariaLabel ?? (opts.readOnly ? 'Output JSON' : 'Input JSON') }),
        EditorView.updateListener.of((u) => {
          if (u.docChanged && opts.onChange) opts.onChange(u.state.doc.toString());
        }),
      ],
    }),
  });
  // Expose editor views on `window.__cmViews` for E2E tests. Harmless in prod —
  // adds two references to an array, no API surface beyond the view itself.
  if (typeof window !== 'undefined') {
    const w = window as unknown as { __cmViews?: EditorView[] };
    if (!w.__cmViews) w.__cmViews = [];
    w.__cmViews.push(view);
    const orig = view.destroy.bind(view);
    view.destroy = () => {
      const arr = w.__cmViews;
      if (arr) {
        const i = arr.indexOf(view);
        if (i >= 0) arr.splice(i, 1);
      }
      orig();
    };
  }
  return view;
}
