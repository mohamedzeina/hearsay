import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeedNav from '@/components/feed-nav/feed-nav';
import FeedNavMobile from '@/components/feed-nav/feed-nav-mobile';

const useSearchParamsMock = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => useSearchParamsMock(),
}));

function paramsWith(view?: string) {
  return {
    get: (key: string) => (key === 'view' ? view ?? null : null),
  };
}

describe('FeedNav (sidebar)', () => {
  beforeEach(() => {
    useSearchParamsMock.mockReset();
  });

  it('marks Everywhere as the active scope when no ?view is set', () => {
    useSearchParamsMock.mockReturnValue(paramsWith(undefined));

    render(<FeedNav />);

    const everywhere = screen.getByRole('link', { name: /everywhere/i });
    expect(everywhere).toHaveAttribute('aria-current', 'page');
    expect(everywhere).toHaveAttribute('href', '/');

    const following = screen.getByRole('link', { name: /following/i });
    expect(following).not.toHaveAttribute('aria-current');
    expect(following).toHaveAttribute('href', '/?view=following');
  });

  it('marks Following as the active scope when ?view=following', () => {
    useSearchParamsMock.mockReturnValue(paramsWith('following'));

    render(<FeedNav />);

    const following = screen.getByRole('link', { name: /following/i });
    expect(following).toHaveAttribute('aria-current', 'page');

    const everywhere = screen.getByRole('link', { name: /everywhere/i });
    expect(everywhere).not.toHaveAttribute('aria-current');
  });

  it('shows the follow count badge next to Following when greater than zero', () => {
    useSearchParamsMock.mockReturnValue(paramsWith(undefined));

    render(<FeedNav followCount={4} />);

    const following = screen.getByRole('link', { name: /following/i });
    expect(following).toHaveTextContent('4');
  });

  it('hides the badge when followCount is zero', () => {
    useSearchParamsMock.mockReturnValue(paramsWith(undefined));

    render(<FeedNav followCount={0} />);

    const following = screen.getByRole('link', { name: /following/i });
    expect(following.textContent ?? '').not.toMatch(/\b0\b/);
  });

  it('hides the badge when followCount is undefined', () => {
    useSearchParamsMock.mockReturnValue(paramsWith(undefined));

    render(<FeedNav />);

    // No numeric badge appears on either scope row.
    const following = screen.getByRole('link', { name: /following/i });
    expect(following.textContent ?? '').not.toMatch(/\d/);
  });
});

describe('FeedNavMobile', () => {
  beforeEach(() => {
    useSearchParamsMock.mockReset();
  });

  it('renders both scope links with the lg:hidden gate', () => {
    useSearchParamsMock.mockReturnValue(paramsWith(undefined));

    render(<FeedNavMobile />);

    const nav = screen.getByRole('navigation', { name: /feed scope/i });
    expect(nav.className).toMatch(/lg:hidden/);

    expect(screen.getByRole('link', { name: /everywhere/i })).toHaveAttribute(
      'href',
      '/'
    );
    expect(screen.getByRole('link', { name: /following/i })).toHaveAttribute(
      'href',
      '/?view=following'
    );
  });

  it('marks Everywhere as active by default', () => {
    useSearchParamsMock.mockReturnValue(paramsWith(undefined));

    render(<FeedNavMobile />);

    expect(
      screen.getByRole('link', { name: /everywhere/i })
    ).toHaveAttribute('aria-current', 'page');
  });

  it('marks Following as active when ?view=following', () => {
    useSearchParamsMock.mockReturnValue(paramsWith('following'));

    render(<FeedNavMobile />);

    expect(
      screen.getByRole('link', { name: /following/i })
    ).toHaveAttribute('aria-current', 'page');
  });
});
