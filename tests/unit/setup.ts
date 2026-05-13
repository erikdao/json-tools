import '@testing-library/jest-dom/vitest';

// Node 25 ships a native-but-partial localStorage (missing .clear(), .key(), etc.).
// Vitest's jsdom environment does not include 'localStorage'/'sessionStorage' in its
// KEYS propagation list, so the Node 25 stub stays on globalThis instead of jsdom's
// full Storage implementation. Replace both globals with jsdom's Storage objects.
type JsdomGlobal = typeof globalThis & {
  jsdom?: { window?: { _localStorage?: Storage; _sessionStorage?: Storage } };
};
const dom = (globalThis as JsdomGlobal).jsdom;
if (dom?.window?._localStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: dom.window._localStorage,
    writable: true,
    configurable: true,
  });
}
if (dom?.window?._sessionStorage) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: dom.window._sessionStorage,
    writable: true,
    configurable: true,
  });
}
