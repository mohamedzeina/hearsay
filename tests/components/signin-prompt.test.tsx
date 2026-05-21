import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInPromptProvider, {
  useSignInPrompt,
} from '@/components/auth/signin-prompt';

const signInMock = vi.fn();

vi.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

function setLocation(url: string) {
  Object.defineProperty(window, 'location', {
    value: new URL(url),
    configurable: true,
    writable: true,
  });
}

function Trigger({ reason }: { reason?: string }) {
  const { open } = useSignInPrompt();
  return (
    <button type="button" onClick={() => open(reason)}>
      open prompt
    </button>
  );
}

describe('SignInPromptProvider', () => {
  beforeEach(() => {
    signInMock.mockReset();
    setLocation('https://hearsay.test/topics/javascript');
  });

  it('renders children', () => {
    render(
      <SignInPromptProvider>
        <div data-testid="child">hello</div>
      </SignInPromptProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('throws when useSignInPrompt is called outside provider', () => {
    const orig = console.error;
    console.error = () => {};
    expect(() => render(<Trigger />)).toThrow(
      /useSignInPrompt must be used inside SignInPromptProvider/
    );
    console.error = orig;
  });

  it('does not show modal initially', () => {
    render(
      <SignInPromptProvider>
        <Trigger />
      </SignInPromptProvider>
    );
    expect(screen.queryByText(/sign in to continue/i)).not.toBeInTheDocument();
  });

  it('opens modal when open() is called and displays reason', async () => {
    const user = userEvent.setup();
    render(
      <SignInPromptProvider>
        <Trigger reason="Sign in to upvote." />
      </SignInPromptProvider>
    );

    await user.click(screen.getByText('open prompt'));

    expect(await screen.findByText(/sign in to continue/i)).toBeInTheDocument();
    expect(screen.getByText('Sign in to upvote.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue with github/i })
    ).toBeInTheDocument();
  });

  it('calls signIn with github and current pathname as callbackUrl', async () => {
    const user = userEvent.setup();
    render(
      <SignInPromptProvider>
        <Trigger />
      </SignInPromptProvider>
    );

    await user.click(screen.getByText('open prompt'));
    await user.click(
      await screen.findByRole('button', { name: /continue with github/i })
    );

    expect(signInMock).toHaveBeenCalledWith('github', {
      callbackUrl: '/topics/javascript',
    });
  });

  it('shows loading state after clicking GitHub button', async () => {
    const user = userEvent.setup();
    render(
      <SignInPromptProvider>
        <Trigger />
      </SignInPromptProvider>
    );

    await user.click(screen.getByText('open prompt'));
    const githubBtn = await screen.findByRole('button', {
      name: /continue with github/i,
    });
    await user.click(githubBtn);

    const updatedBtn = screen.getByRole('button', {
      name: /connecting to github/i,
    });
    expect(updatedBtn).toBeDisabled();
    expect(updatedBtn).toHaveAttribute('aria-busy', 'true');
  });

  it('includes search params in callbackUrl when present', async () => {
    setLocation('https://hearsay.test/topics/javascript?term=hello');
    const user = userEvent.setup();
    render(
      <SignInPromptProvider>
        <Trigger />
      </SignInPromptProvider>
    );

    await user.click(screen.getByText('open prompt'));
    await user.click(
      await screen.findByRole('button', { name: /continue with github/i })
    );

    expect(signInMock).toHaveBeenCalledWith('github', {
      callbackUrl: '/topics/javascript?term=hello',
    });
  });

  it('preserves the hash fragment in callbackUrl', async () => {
    setLocation('https://hearsay.test/topics/javascript#c-abc123');
    const user = userEvent.setup();
    render(
      <SignInPromptProvider>
        <Trigger />
      </SignInPromptProvider>
    );

    await user.click(screen.getByText('open prompt'));
    await user.click(
      await screen.findByRole('button', { name: /continue with github/i })
    );

    expect(signInMock).toHaveBeenCalledWith('github', {
      callbackUrl: '/topics/javascript#c-abc123',
    });
  });
});
