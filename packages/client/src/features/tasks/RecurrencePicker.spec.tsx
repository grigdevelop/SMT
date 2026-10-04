import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecurrencePicker } from './RecurrencePicker';
import { RecurrenceFrequency } from '@self/contracts';

describe('RecurrencePicker Component', () => {
  it('renders default state with "Does not repeat"', () => {
    const onChange = vi.fn();
    render(<RecurrencePicker value={null} onChange={onChange} currentDate="2026-10-04" />);

    const select = screen.getByLabelText(/repeat frequency/i) as HTMLSelectElement;
    expect(select.value).toBe('none');
    expect(screen.queryByTestId('recurrence-preview-badge')).toBeNull();
  });

  it('selects DAILY and updates interval', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <RecurrencePicker value={null} onChange={onChange} currentDate="2026-10-04" />,
    );

    const select = screen.getByLabelText(/repeat frequency/i);
    fireEvent.change(select, { target: { value: RecurrenceFrequency.DAILY } });

    expect(onChange).toHaveBeenCalledWith({
      frequency: RecurrenceFrequency.DAILY,
      interval: 1,
    });

    rerender(
      <RecurrencePicker
        value={{ frequency: RecurrenceFrequency.DAILY, interval: 1 }}
        onChange={onChange}
        currentDate="2026-10-04"
      />,
    );

    expect(screen.getByTestId('recurrence-preview-badge').textContent).toBe('Daily');

    const intervalInput = screen.getByRole('spinbutton');
    fireEvent.change(intervalInput, { target: { value: '3' } });

    expect(onChange).toHaveBeenCalledWith({
      frequency: RecurrenceFrequency.DAILY,
      interval: 3,
    });
  });

  it('selects WEEKLY and toggles weekdays', () => {
    const onChange = vi.fn();
    render(
      <RecurrencePicker
        value={{
          frequency: RecurrenceFrequency.WEEKLY,
          interval: 1,
          daysOfWeek: [1], // Monday
        }}
        onChange={onChange}
        currentDate="2026-10-04"
      />,
    );

    expect(screen.getByTestId('recurrence-preview-badge').textContent).toBe('Weekly: Mon');

    // Click Wednesday (day 3)
    const wednesdayBtn = screen.getByRole('button', { name: 'Wednesday' });
    fireEvent.click(wednesdayBtn);

    expect(onChange).toHaveBeenCalledWith({
      frequency: RecurrenceFrequency.WEEKLY,
      interval: 1,
      daysOfWeek: [1, 3],
    });

    // Toggle off Monday (day 1)
    const mondayBtn = screen.getByRole('button', { name: 'Monday' });
    fireEvent.click(mondayBtn);

    expect(onChange).toHaveBeenCalledWith({
      frequency: RecurrenceFrequency.WEEKLY,
      interval: 1,
      daysOfWeek: [],
    });
  });

  it('selects MONTHLY and toggles month days', () => {
    const onChange = vi.fn();
    render(
      <RecurrencePicker
        value={{
          frequency: RecurrenceFrequency.MONTHLY,
          interval: 1,
          daysOfMonth: [15],
        }}
        onChange={onChange}
        currentDate="2026-10-04"
      />,
    );

    expect(screen.getByTestId('recurrence-preview-badge').textContent).toBe('Monthly: day 15');

    // Click Day 1
    const day1Btn = screen.getByRole('button', { name: 'Day 1' });
    fireEvent.click(day1Btn);

    expect(onChange).toHaveBeenCalledWith({
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      daysOfMonth: [1, 15],
    });
  });

  it('selects YEARLY and modifies month and day', () => {
    const onChange = vi.fn();
    render(
      <RecurrencePicker
        value={{
          frequency: RecurrenceFrequency.YEARLY,
          interval: 1,
          yearlyDate: {
            month: 10,
            day: 4,
          },
        }}
        onChange={onChange}
        currentDate="2026-10-04"
      />,
    );

    expect(screen.getByTestId('recurrence-preview-badge').textContent).toBe('Yearly on Oct 4');
  });

  it('clears recurrence when Clear button is clicked', () => {
    const onChange = vi.fn();
    render(
      <RecurrencePicker
        value={{
          frequency: RecurrenceFrequency.DAILY,
          interval: 1,
        }}
        onChange={onChange}
        currentDate="2026-10-04"
      />,
    );

    const clearBtn = screen.getByTitle(/remove recurrence/i);
    fireEvent.click(clearBtn);

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
