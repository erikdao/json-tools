import { render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import TreeExplorer from '@/components/TreeExplorer';
import { buildTree } from '@/lib/json/tree';

describe('TreeExplorer', () => {
  it('renders top-level keys', () => {
    const r = buildTree('{"a":1,"b":2}');
    if (!r.ok) throw new Error('invalid');
    render(<TreeExplorer tree={r.tree} />);
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });

  it('renders only a window of rows for large trees', () => {
    const big = JSON.stringify(
      Object.fromEntries(Array.from({ length: 1500 }, (_, i) => [`k${i}`, i])),
    );
    const r = buildTree(big);
    if (!r.ok) throw new Error('invalid');
    const { container } = render(<TreeExplorer tree={r.tree} />);
    expect(container.querySelectorAll('[data-row]').length).toBeLessThan(200);
  });
});
