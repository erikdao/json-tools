import { EditorView, lineNumbers, highlightActiveLine, keymap, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
// biome-ignore lint/correctness/noUnusedImports: planned for later tasks
import { Compartment } from '@codemirror/state';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

export const theme = EditorView.theme({
  '&': { backgroundColor: 'var(--editor)', color: 'var(--ink)', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' },
  '.cm-gutters': { backgroundColor: 'var(--editor)', color: 'var(--muted)', border: 'none' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--amber)' },
  '.cm-cursor': { borderLeftColor: 'var(--amber)', borderLeftWidth: '2px' },
  '.cm-selectionBackground, ::selection': { backgroundColor: 'color-mix(in srgb, var(--amber) 25%, transparent)' },
});

export function makeEditor(parent: HTMLElement, opts: { value: string; readOnly?: boolean; onChange?: (v: string) => void }) {
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: opts.value,
      extensions: [
        lineNumbers(), lintGutter(), history(), bracketMatching(), drawSelection(), highlightActiveLine(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        json(),
        linter(jsonParseLinter()),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        theme,
        EditorView.editable.of(!opts.readOnly),
        EditorState.readOnly.of(!!opts.readOnly),
        EditorView.updateListener.of((u) => {
          if (u.docChanged && opts.onChange) opts.onChange(u.state.doc.toString());
        }),
      ],
    }),
  });
  return view;
}
