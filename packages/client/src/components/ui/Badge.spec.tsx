import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './Badge';

describe('Badge Primitive (CVA)', () => {
  it('renders default badge variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeDefined();
    expect(badge.className).toContain('badge');
    expect(badge.className).toContain('badge-ghost');
  });

  it('renders primary variant', () => {
    render(<Badge variant="primary">Primary Badge</Badge>);
    const badge = screen.getByText('Primary Badge');
    expect(badge.className).toContain('badge-primary');
  });

  it('renders success variant', () => {
    render(<Badge variant="success">Success Badge</Badge>);
    const badge = screen.getByText('Success Badge');
    expect(badge.className).toContain('badge-success');
  });

  it('renders purple variant', () => {
    render(<Badge variant="purple">Admin Badge</Badge>);
    const badge = screen.getByText('Admin Badge');
    expect(badge.className).toContain('badge-secondary');
  });

  it('renders sky variant', () => {
    render(<Badge variant="sky">Practitioner</Badge>);
    const badge = screen.getByText('Practitioner');
    expect(badge.className).toContain('badge-info');
  });
});
