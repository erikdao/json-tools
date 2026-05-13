import type { Page } from '@playwright/test';

/**
 * Type text into the (first) CodeMirror input editor on the page.
 *
 * `page.keyboard.type` is unreliable on contenteditable CodeMirror across
 * browsers (Shift modifier sync, IME composition). Instead, we dispatch a
 * transaction directly on the EditorView using CodeMirror's public
 * `EditorView.findFromDOM` helper. This works as long as the editor has
 * been mounted (which it is by the time `.cm-content` exists).
 */
export async function setEditorValue(page: Page, value: string, which: 'input' | 'output' = 'input'): Promise<void> {
  const nth = which === 'input' ? 0 : 1;
  await page.locator('.cm-content').nth(nth).waitFor();
  await page.evaluate(
    ({ value, nth }) => {
      const node = document.querySelectorAll('.cm-content')[nth] as HTMLElement | undefined;
      if (!node) throw new Error('CodeMirror .cm-content not found');
      // CodeMirror attaches the view's DOM root; walk up to find .cm-editor.
      let host: HTMLElement | null = node;
      while (host && !host.classList.contains('cm-editor')) host = host.parentElement;
      if (!host) throw new Error('cm-editor parent not found');
      // Access the EditorView via the host's cmView weakmap (private), or via the static helper.
      // `EditorView.findFromDOM` walks up from any descendant; expose it through a known global if needed.
      // Easiest: dispatch a paste-like input event with InputEvent + DataTransfer is fragile;
      // instead, rely on CodeMirror's internal `cmView` symbol if present, else use the public API.
      // We stored a debug handle on window for E2E. If absent, throw clearly.
      const handles = (window as unknown as { __cmViews?: unknown[] }).__cmViews;
      if (!handles || !handles[nth]) throw new Error('window.__cmViews not exposed for tests');
      const view = handles[nth] as {
        state: { doc: { length: number } };
        dispatch: (spec: unknown) => void;
        focus: () => void;
      };
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
      view.focus();
    },
    { value, nth },
  );
}
