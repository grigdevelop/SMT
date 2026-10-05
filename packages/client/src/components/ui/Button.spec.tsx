import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Primitive (CVA)', () => {
  it('renders primary variant by default with base styles', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDefined();
    expect(button.className).toContain('bg-indigo-600');
    expect(button.className).toContain('text-white');
  });

  it('renders secondary variant correctly', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button.className).toContain('bg-secondary');
    expect(button.className).toContain('text-secondary-foreground');
  });

  it('renders outline variant correctly', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button', { name: /outline/i });
    expect(button.className).toContain('border-border');
    expect(button.className).toContain('bg-card');
  });

  it('renders danger variant correctly', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button.className).toContain('bg-rose-600');
  });

  it('handles sizes correctly (sm, md, lg, icon)', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button');
    expect(button.className).toContain('px-2.5 py-1 text-xs');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('px-4 py-2.5 text-sm');

    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('p-1.5');
  });

  it('handles click events and disabled state', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toHaveProperty('disabled', true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
