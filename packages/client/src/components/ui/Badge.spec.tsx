import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';

describe('Badge Primitive (CVA)', () => {
  it('renders default badge variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeDefined();
    expect(badge.className).toContain('bg-secondary');
    expect(badge.className).toContain('text-secondary-foreground');
  });

  it('renders primary variant', () => {
    render(<Badge variant="primary">Primary Badge</Badge>);
    const badge = screen.getByText('Primary Badge');
    expect(badge.className).toContain('bg-indigo-50');
  });

  it('renders success variant', () => {
    render(<Badge variant="success">Success Badge</Badge>);
    const badge = screen.getByText('Success Badge');
    expect(badge.className).toContain('bg-emerald-50');
  });

  it('renders purple variant', () => {
    render(<Badge variant="purple">Admin Badge</Badge>);
    const badge = screen.getByText('Admin Badge');
    expect(badge.className).toContain('bg-purple-50');
  });

  it('renders sky variant', () => {
    render(<Badge variant="sky">Practitioner</Badge>);
    const badge = screen.getByText('Practitioner');
    expect(badge.className).toContain('bg-sky-50');
  });
});
