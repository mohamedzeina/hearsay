import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormError from '@/components/common/form-error';

describe('FormError', () => {
  it('renders nothing when messages is undefined', () => {
    const { container } = render(<FormError />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when messages is empty array', () => {
    const { container } = render(<FormError messages={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a single message inside role="alert"', () => {
    render(<FormError messages={['Name is required']} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Name is required');
  });

  it('joins multiple messages with commas', () => {
    render(<FormError messages={['Name is required', 'Slug too short']} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Name is required, Slug too short'
    );
  });

  it('renders an aria-hidden icon', () => {
    const { container } = render(<FormError messages={['err']} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden');
  });
});
