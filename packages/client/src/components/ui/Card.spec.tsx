import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

describe('Card Primitives', () => {
  it('renders card with all nested primitives correctly', () => {
    render(
      <Card data-testid="test-card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main Card Body</p>
        </CardContent>
        <CardFooter>
          <span>Card Footer</span>
        </CardFooter>
      </Card>,
    );

    const card = screen.getByTestId('test-card');
    expect(card.className).toContain('card');
    expect(card.className).toContain('bg-base-100');
    expect(card.className).toContain('border-base-300');

    expect(screen.getByText('Card Title')).toBeDefined();
    expect(screen.getByText('Card Description')).toBeDefined();
    expect(screen.getByText('Main Card Body')).toBeDefined();
    expect(screen.getByText('Card Footer')).toBeDefined();
  });
});
