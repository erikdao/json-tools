// src/lib/json/errors.ts
import type { JsonError } from './types';

// Hint entries: test against the error message. When a message is ambiguous,
// a `charTest` callback receives the source character at the error offset
// for additional disambiguation.
const HINTS: ReadonlyArray<{
  test: RegExp;
  hint: string;
  charTest?: (ch: string, src: string, offset: number) => boolean;
}> = [
  // V8 (Node >= 20): "Expected double-quoted property name in JSON at position N"
  // This fires for trailing commas before } in modern V8.
  {
    test: /Expected double-quoted property name/i,
    hint: 'Trailing comma before } — JSON does not allow it.',
  },
  // V8: "Unexpected token ',' …" fires for comma where a value is expected
  // (e.g. trailing comma before ] or double-comma).
  {
    test: /Unexpected token ','|Unexpected token .{0,4}[}\]]/,
    hint: 'Trailing comma — JSON does not allow trailing commas before } or ].',
  },
  // V8: "Expected property name or '}' in JSON at position N"
  // Fires for both single-quoted keys ('a') and bare/unquoted keys (a).
  // Use charTest to distinguish by the character at the error offset.
  {
    test: /Expected property name or '}'/,
    hint: "Single quotes aren't valid JSON — use double quotes.",
    charTest: (ch) => ch === "'",
  },
  {
    test: /Expected property name or '}'/,
    hint: 'Keys must be quoted strings — wrap identifiers in "double quotes".',
    charTest: (ch) => ch !== "'" && /[A-Za-z_]/.test(ch),
  },
  // Classic V8 / other runtimes: "Unexpected token [alpha]"
  {
    test: /Unexpected token [A-Za-z_]/,
    hint: 'Keys must be quoted strings — wrap identifiers in "double quotes".',
  },
  // V8: "Unexpected end of JSON input"
  {
    test: /Unexpected end of (?:JSON|input)/i,
    hint: 'Input ends mid-value — missing }, ], or closing ".',
  },
];

function offsetToLineCol(src: string, offset: number): { line: number; column: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset && i < src.length; i++) {
    if (src[i] === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, column: col };
}

function extractOffset(src: string, msg: string): number {
  // Modern V8 (Node >= 20): "... at position N (line L column C)"
  const pos = msg.match(/at position (\d+)/);
  if (pos) return Math.min(+pos[1], src.length);

  // Node 20+ new format (no numeric position):
  // "Unexpected token 'X', ..."<tail>" is not valid JSON"
  // The tail is a suffix of the source; find the bad token's last occurrence within it.
  const tailMatch = msg.match(/\.\.\."([\s\S]+)" is not valid JSON/);
  if (tailMatch) {
    const tail = tailMatch[1];
    const tokenM = msg.match(/Unexpected token '(.)'/);
    const badToken = tokenM?.[1] ?? null;

    // Find the last occurrence of the tail in the source
    let tailIdx = -1;
    let start = 0;
    while (true) {
      const found = src.indexOf(tail, start);
      if (found === -1) break;
      tailIdx = found;
      start = found + 1;
    }

    if (tailIdx >= 0 && badToken !== null) {
      // Collect all positions of the bad token within the tail
      const positions: number[] = [];
      for (let i = 0; i < tail.length; i++) {
        if (tail[i] === badToken) positions.push(i);
      }
      if (positions.length > 0) {
        // Use the last occurrence — it is most likely the actual erroneous site
        return Math.min(tailIdx + positions[positions.length - 1], src.length);
      }
    }
    // Tail found but no token extracted — use the tail start as the error offset
    if (tailIdx >= 0) return tailIdx;
  }

  // Older V8 / other runtimes: "... line L column C"
  const lc = msg.match(/line (\d+) column (\d+)/i);
  if (lc) {
    const targetLine = +lc[1];
    const targetCol = +lc[2];
    let currentLine = 1;
    let lineStart = 0;
    for (let i = 0; i < src.length; i++) {
      if (currentLine === targetLine) {
        return Math.min(lineStart + targetCol - 1, src.length);
      }
      if (src[i] === '\n') {
        currentLine++;
        lineStart = i + 1;
      }
    }
    return src.length;
  }

  return tokenizeFallback(src);
}

// Very small fallback: find the first byte that isn't a normal JSON structural char
function tokenizeFallback(src: string): number {
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (/[\s{}[\]:,"tfn0-9eE+\-.\\]/.test(ch)) continue;
    return i;
  }
  return src.length;
}

export function normalizeJsonError(src: string, err: Error): JsonError {
  const message = err.message ?? 'Invalid JSON';
  const offset = extractOffset(src, message);
  const { line, column } = offsetToLineCol(src, offset);
  const charAtOffset = src[offset] ?? '';

  const hit = HINTS.find((h) => {
    if (!h.test.test(message)) return false;
    if (h.charTest) return h.charTest(charAtOffset, src, offset);
    return true;
  });

  return {
    line,
    column,
    offsetStart: offset,
    offsetEnd: Math.min(offset + 1, src.length),
    message,
    hint: hit?.hint,
  };
}
