import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthPage } from './AuthPage';
import { AuthProvider } from './AuthContext';

function renderWithProviders(ui: React.ReactElement, initialRoute = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

describe('AuthPage UI & Interaction Component', () => {
  it('renders login view correctly with Norman signifiers', () => {
    renderWithProviders(<AuthPage mode="login" />);

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeDefined();
    expect(screen.getByLabelText(/email address/i)).toBeDefined();
    expect(screen.getByLabelText(/^password/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /create one now/i })).toBeDefined();
  });

  it('renders registration view with password requirements', () => {
    renderWithProviders(<AuthPage mode="register" />);

    expect(screen.getByRole('heading', { name: /create your account/i })).toBeDefined();
    expect(screen.getByText(/min\. 8 characters/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /create account/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeDefined();
  });

  it('toggles password visibility when eye icon button is clicked', () => {
    renderWithProviders(<AuthPage mode="login" />);

    const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleButton);

    expect(passwordInput.type).toBe('text');

    const hideButton = screen.getByRole('button', { name: /hide password/i });
    fireEvent.click(hideButton);

    expect(passwordInput.type).toBe('password');
  });

  it('validates invalid email input with inline error', async () => {
    renderWithProviders(<AuthPage mode="login" />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeDefined();
    });
  });
});
