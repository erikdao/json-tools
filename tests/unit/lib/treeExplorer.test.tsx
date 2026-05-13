import { render, screen } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
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
});
