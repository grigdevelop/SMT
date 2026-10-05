import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, ThemeToggle, useTheme } from './theme-context';

function TestConsumer() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('black')}>Set Black</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext & ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.documentElement.removeAttribute('data-theme');
  });

  it('defaults to system/light when no preference is stored', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('system');
  });

  it('updates theme to dark and sets .dark class and data-theme on documentElement', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('Set Dark'));
    });

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('smt_theme')).toBe('dark');
  });

  it('updates theme to black (OLED) and sets data-theme to black', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByText('Set Black'));
    });

    expect(screen.getByTestId('current-theme').textContent).toBe('black');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('black');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('black');
    expect(localStorage.getItem('smt_theme')).toBe('black');
  });

  it('updates theme to light and removes .dark class', () => {
    localStorage.setItem('smt_theme', 'dark');
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>,
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      fireEvent.click(screen.getByText('Set Light'));
    });

    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('smt_theme')).toBe('light');
  });

  it('ThemeToggle switches between light and dark themes on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    const toggleButton = screen.getByRole('button', { name: /switch to/i });
    expect(toggleButton).toBeDefined();

    // Initial state is light (if system is light)
    act(() => {
      fireEvent.click(toggleButton);
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      fireEvent.click(toggleButton);
    });

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
