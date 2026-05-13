export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

export type FileLoad =
  | { ok: true; name: string; content: string; extraFiles: number }
  | { ok: false; reason: string };

function looksBinary(content: string): boolean {
  // quick sniff: presence of NUL, or UTF-16 BOM
  return content.charCodeAt(0) === 0xFFFE || content.includes('\0');
}

export async function readFiles(files: FileList | File[]): Promise<FileLoad> {
  const arr = Array.from(files);
  if (arr.length === 0) return { ok: false, reason: 'no file' };
  const file = arr[0];
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB) — limit is 50 MB` };
  }
  const content = await file.text();
  if (looksBinary(content)) return { ok: false, reason: 'Doesn\'t look like text — only .json/.txt files are supported' };
  return { ok: true, name: file.name, content, extraFiles: arr.length - 1 };
}
