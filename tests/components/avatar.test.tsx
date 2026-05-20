import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from '@/components/common/avatar';

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: React.ComponentProps<'img'>) => <img {...props} alt={props.alt ?? ''} />,
}));

describe('Avatar', () => {
  it('renders an image when user has an image url', () => {
    render(<Avatar user={{ name: 'Alice', image: 'https://example.com/a.png' }} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/a.png');
    expect(img).toHaveAttribute('alt', 'Alice');
  });

  it('falls back to first initial when no image', () => {
    render(<Avatar user={{ name: 'Bob' }} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('uppercases the initial', () => {
    render(<Avatar user={{ name: 'alice' }} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows "?" when name is null and no image', () => {
    render(<Avatar user={{ name: null }} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows "?" when name is empty string', () => {
    render(<Avatar user={{ name: '' }} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('trims whitespace from name for initial', () => {
    render(<Avatar user={{ name: '  Carol  ' }} />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('applies size variants', () => {
    const { rerender } = render(<Avatar user={{ name: 'A' }} size="xs" />);
    expect(screen.getByText('A')).toHaveClass('w-5', 'h-5');

    rerender(<Avatar user={{ name: 'A' }} size="lg" />);
    expect(screen.getByText('A')).toHaveClass('w-12', 'h-12');
  });

  it('applies tone classes when tone provided', () => {
    const tone = { bg: 'bg-test', text: 'text-test', dot: 'bg-dot-test' };
    render(<Avatar user={{ name: 'A' }} tone={tone} />);
    const el = screen.getByText('A');
    expect(el).toHaveClass('bg-test', 'text-test');
  });

  it('applies default persimmon-soft fallback when no tone', () => {
    render(<Avatar user={{ name: 'A' }} />);
    expect(screen.getByText('A')).toHaveClass('bg-persimmon-soft', 'text-persimmon-deep');
  });

  it('respects ring="none"', () => {
    render(<Avatar user={{ name: 'A' }} ring="none" />);
    const el = screen.getByText('A');
    expect(el.className).not.toMatch(/ring-/);
  });

  it('uses empty alt when image is present but name is whitespace', () => {
    const { container } = render(
      <Avatar user={{ name: '   ', image: 'https://example.com/x.png' }} />
    );
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('src', 'https://example.com/x.png');
  });
});
