import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import CharCounter from '@/components/common/char-counter';

describe('CharCounter', () => {
  it('shows the bare "min N" hint at zero characters', () => {
    const { container } = render(<CharCounter current={0} min={10} max={1000} />);
    expect(screen.getByText('min 10')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-ink-3');
  });

  it('shows "min N to post" when below the minimum but not empty', () => {
    render(<CharCounter current={4} min={10} max={1000} />);
    expect(screen.getByText('min 10 to post')).toBeInTheDocument();
  });

  it('shows current/max with thousands separators while comfortably in range', () => {
    const { container } = render(<CharCounter current={1234} min={10} max={10000} />);
    expect(screen.getByText('1,234 / 10,000')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-ink-3');
    expect(container.firstChild).not.toHaveClass('text-persimmon-deep');
  });

  it('flips to persimmon-deep within the last 10% of max', () => {
    // 90% threshold: max=1000 → near at >= 900
    const { container } = render(<CharCounter current={920} min={10} max={1000} />);
    expect(container.firstChild).toHaveClass('text-persimmon-deep');
  });

  it('keeps the persimmon warning when over the max', () => {
    const { container } = render(<CharCounter current={1100} min={10} max={1000} />);
    expect(container.firstChild).toHaveClass('text-persimmon-deep');
    expect(screen.getByText('1,100 / 1,000')).toBeInTheDocument();
  });

  it('uses aria-live=polite so screen readers announce the count quietly', () => {
    const { container } = render(<CharCounter current={50} min={10} max={1000} />);
    expect(container.firstChild).toHaveAttribute('aria-live', 'polite');
  });
});
