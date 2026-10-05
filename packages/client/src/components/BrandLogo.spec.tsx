import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandLogo } from './BrandLogo';

describe('BrandLogo Component (Concept C: The Mastery Spark)', () => {
  it('renders SVG with accessible label and default sizing', () => {
    render(<BrandLogo />);

    const svg = screen.getByRole('img', { name: /Self Management Tool Logo/i });
    expect(svg).toBeDefined();
    expect(svg.getAttribute('viewBox')).toBe('0 0 32 32');
    expect(svg.classList.contains('w-8')).toBe(true);
    expect(svg.classList.contains('h-8')).toBe(true);
  });

  it('renders size variants correctly', () => {
    const { rerender } = render(<BrandLogo size="sm" />);
    let svg = screen.getByRole('img');
    expect(svg.classList.contains('w-6')).toBe(true);

    rerender(<BrandLogo size="lg" />);
    svg = screen.getByRole('img');
    expect(svg.classList.contains('w-12')).toBe(true);

    rerender(<BrandLogo size="xl" />);
    svg = screen.getByRole('img');
    expect(svg.classList.contains('w-16')).toBe(true);
  });

  it('renders background squircle by default and omits it when showBackground=false', () => {
    const { rerender, container } = render(<BrandLogo showBackground={true} />);
    expect(container.querySelector('rect')).not.toBeNull();

    rerender(<BrandLogo showBackground={false} />);
    expect(container.querySelector('rect')).toBeNull();
  });
});
