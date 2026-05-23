import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedNav from '@/components/feed-nav/feed-nav';
import FeedNavMobile from '@/components/feed-nav/feed-nav-mobile';
import {
  ScopeProvider,
  type Scope,
} from '@/components/feed-nav/scope-provider';

function renderWithScope(
  ui: React.ReactNode,
  opts: { initial?: Scope; canFollow?: boolean } = {}
) {
  return render(
    <ScopeProvider
      initialScope={opts.initial ?? 'everywhere'}
      canFollow={opts.canFollow ?? true}
    >
      {ui}
    </ScopeProvider>
  );
}

describe('FeedNav (sidebar)', () => {
  beforeEach(() => {
    // Reset URL between tests so the replaceState assertions don't leak.
    window.history.replaceState(null, '', '/');
  });

  it('marks Everywhere as the active scope by default', () => {
    renderWithScope(<FeedNav />);

    const everywhere = screen.getByRole('button', { name: /everywhere/i });
    expect(everywhere).toHaveAttribute('aria-current', 'page');

    const following = screen.getByRole('button', { name: /following/i });
    expect(following).not.toHaveAttribute('aria-current');
  });

  it('marks Following as active when initialScope is "following"', () => {
    renderWithScope(<FeedNav />, { initial: 'following' });

    expect(
      screen.getByRole('button', { name: /following/i })
    ).toHaveAttribute('aria-current', 'page');
  });

  it('switches scope and writes ?view=following to the URL on click', async () => {
    const user = userEvent.setup();
    renderWithScope(<FeedNav />);

    await user.click(screen.getByRole('button', { name: /following/i }));

    expect(
      screen.getByRole('button', { name: /following/i })
    ).toHaveAttribute('aria-current', 'page');
    expect(window.location.search).toBe('?view=following');
  });

  it('switching back to Everywhere clears the view query param', async () => {
    const user = userEvent.setup();
    renderWithScope(<FeedNav />, { initial: 'following' });
    // Seed the URL so the assertion has something to clear.
    window.history.replaceState(null, '', '/?view=following');

    await user.click(screen.getByRole('button', { name: /everywhere/i }));

    expect(window.location.search).toBe('');
  });

  it('shows the follow count badge next to Following when greater than zero', () => {
    renderWithScope(<FeedNav followCount={4} />);

    expect(
      screen.getByRole('button', { name: /following/i })
    ).toHaveTextContent('4');
  });

  it('hides the badge when followCount is zero', () => {
    renderWithScope(<FeedNav followCount={0} />);

    const following = screen.getByRole('button', { name: /following/i });
    expect(following.textContent ?? '').not.toMatch(/\b0\b/);
  });

  it('hides the badge when followCount is undefined', () => {
    renderWithScope(<FeedNav />);

    const following = screen.getByRole('button', { name: /following/i });
    expect(following.textContent ?? '').not.toMatch(/\d/);
  });
});

describe('FeedNavMobile', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('renders both scope buttons inside an lg:hidden wrapper', () => {
    renderWithScope(<FeedNavMobile />);

    const nav = screen.getByRole('navigation', { name: /feed scope/i });
    expect(nav.className).toMatch(/lg:hidden/);

    expect(screen.getByRole('button', { name: /everywhere/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /following/i })).toBeInTheDocument();
  });

  it('marks Everywhere as active by default', () => {
    renderWithScope(<FeedNavMobile />);

    expect(
      screen.getByRole('button', { name: /everywhere/i })
    ).toHaveAttribute('aria-current', 'page');
  });

  it('marks Following as active when initialScope is "following"', () => {
    renderWithScope(<FeedNavMobile />, { initial: 'following' });

    expect(
      screen.getByRole('button', { name: /following/i })
    ).toHaveAttribute('aria-current', 'page');
  });

  it('switching writes the URL via history.replaceState', async () => {
    const user = userEvent.setup();
    renderWithScope(<FeedNavMobile />);

    await user.click(screen.getByRole('button', { name: /following/i }));
    expect(window.location.search).toBe('?view=following');
  });
});

describe('ScopeProvider browser nav sync', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('mobile and sidebar nav stay in sync (shared context)', async () => {
    const user = userEvent.setup();
    renderWithScope(
      <>
        <FeedNav />
        <FeedNavMobile />
      </>
    );

    // Click in the sidebar
    const sidebarFollowing = screen.getAllByRole('button', {
      name: /following/i,
    })[0];
    await user.click(sidebarFollowing);

    // Both nav surfaces should now mark Following as active
    const followingButtons = screen.getAllByRole('button', {
      name: /following/i,
    });
    for (const btn of followingButtons) {
      expect(btn).toHaveAttribute('aria-current', 'page');
    }
  });
});
