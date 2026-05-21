import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthorChip from '@/components/common/author-chip';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('next/image', () => ({
  default: (props: React.ComponentProps<'img'>) => (
    <img {...props} alt={props.alt ?? ''} />
  ),
}));

beforeEach(() => {
  pushMock.mockReset();
});

describe('AuthorChip', () => {
  it('renders the user name and a button that links to the profile', () => {
    render(
      <AuthorChip user={{ name: 'Maya Chen', image: null, username: 'maya' }} />
    );
    expect(
      screen.getByRole('button', { name: /view maya chen's profile/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Maya Chen')).toBeInTheDocument();
  });

  it('prefers the stored username over a slugified name', async () => {
    const user = userEvent.setup();
    render(
      <AuthorChip
        user={{ name: 'Theo Nakamura', image: null, username: 'theo' }}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /view theo nakamura's profile/i })
    );

    expect(pushMock).toHaveBeenCalledWith('/u/theo');
  });

  it('falls back to slugified name when no username is stored', async () => {
    const user = userEvent.setup();
    render(
      <AuthorChip user={{ name: 'Maya Chen', image: null, username: null }} />
    );

    await user.click(screen.getByRole('button'));

    expect(pushMock).toHaveBeenCalledWith('/u/maya-chen');
  });

  it('stops the click from bubbling to a parent link', async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <AuthorChip
          user={{ name: 'Maya Chen', image: null, username: 'maya' }}
        />
      </div>
    );

    await user.click(screen.getByRole('button'));

    expect(parentClick).not.toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith('/u/maya');
  });

  it('renders inert plain text when there is no username and no name', () => {
    render(<AuthorChip user={{ name: null, image: null, username: null }} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('anon')).toBeInTheDocument();
  });
});
