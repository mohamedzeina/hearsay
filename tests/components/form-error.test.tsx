import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormError from '@/components/common/form-error';

describe('FormError', () => {
  it('renders nothing when message is undefined', () => {
    const { container } = render(<FormError />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when message is empty string', () => {
    const { container } = render(<FormError message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the message inside role="alert"', () => {
    render(<FormError message="Name is required" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Name is required');
  });

  it('renders an aria-hidden icon', () => {
    const { container } = render(<FormError message="err" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden');
  });
});
