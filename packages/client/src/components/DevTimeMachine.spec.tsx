import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DateProvider } from '../lib/date-context';
import { DevTimeMachine } from './DevTimeMachine';

describe('DevTimeMachine Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders in collapsed state by default displaying real date', () => {
    render(
      <DateProvider>
        <DevTimeMachine />
      </DateProvider>,
    );

    expect(screen.getByText(/Dev Time Machine/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /change date/i })).toBeDefined();
  });

  it('expands controls and allows changing date with +1d quick jump', async () => {
    render(
      <DateProvider>
        <DevTimeMachine />
      </DateProvider>,
    );

    // Click Change Date
    const changeBtn = screen.getByRole('button', { name: /change date/i });
    fireEvent.click(changeBtn);

    // Drawer should show inputs
    const dateInput = screen.getByLabelText(/simulate date/i) as HTMLInputElement;
    expect(dateInput).toBeDefined();
    const initialDate = dateInput.value;

    // Click +1d
    const plus1dBtn = screen.getByRole('button', { name: /\+1d/i });
    fireEvent.click(plus1dBtn);

    // Verify date advanced and simulated badge shows
    expect(screen.getByText(/Dev Time Travel:/i)).toBeDefined();
    expect(dateInput.value).not.toEqual(initialDate);

    // Reset back to real today
    const resetBtn = screen.getByRole('button', { name: /reset to today/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText(/Dev Time Machine \(Real:/i)).toBeDefined();
  });
});
