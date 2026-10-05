import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Input } from './Input';

describe('Input Primitive', () => {
  it('renders input with default styling and handles change', () => {
    const onChange = vi.fn();
    render(<Input placeholder="Type something..." onChange={onChange} />);
    const input = screen.getByPlaceholderText('Type something...');
    expect(input).toBeDefined();
    expect(input.className).toContain('input');
    expect(input.className).toContain('input-bordered');

    fireEvent.change(input, { target: { value: 'Test value' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
