import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Primitive (CVA)', () => {
  it('renders primary variant by default with base styles', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDefined();
    expect(button.className).toContain('btn');
    expect(button.className).toContain('btn-primary');
  });

  it('renders secondary variant correctly', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button.className).toContain('btn-secondary');
  });

  it('renders outline variant correctly', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button', { name: /outline/i });
    expect(button.className).toContain('btn-outline');
  });

  it('renders danger variant correctly', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button.className).toContain('btn-error');
  });

  it('handles sizes correctly (sm, md, lg, icon)', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    let button = screen.getByRole('button');
    expect(button.className).toContain('btn-sm');

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('btn-lg');

    rerender(<Button size="icon">Icon</Button>);
    button = screen.getByRole('button');
    expect(button.className).toContain('btn-square');
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
