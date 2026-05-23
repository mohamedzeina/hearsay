import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MentionTextarea from '@/components/mentions/mention-textarea';
import type { UserSuggestion } from '@/db/queries/users';

const fetchMock = vi.fn();

function setFetchResponse(users: UserSuggestion[]) {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ users }),
  });
}

function ControlledHost({
  initial = '',
  onValueChange,
}: {
  initial?: string;
  onValueChange?: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <MentionTextarea
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onValueChange?.(v);
      }}
      placeholder="Write..."
    />
  );
}

const alice: UserSuggestion = {
  id: 'u-alice',
  username: 'alice',
  name: 'Alice Hopper',
  image: null,
};
const bob: UserSuggestion = {
  id: 'u-bob',
  username: 'bob',
  name: null,
  image: null,
};

describe('MentionTextarea', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    setFetchResponse([alice, bob]);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does NOT show the dropdown when no @ has been typed', async () => {
    const user = userEvent.setup();
    render(<ControlledHost />);
    const ta = screen.getByPlaceholderText('Write...');
    await user.click(ta);
    await user.type(ta, 'hello world');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens a dropdown of suggestions when the user types @', async () => {
    const user = userEvent.setup();
    render(<ControlledHost />);
    const ta = screen.getByPlaceholderText('Write...');
    await user.click(ta);
    await user.type(ta, '@');

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
  });

  it('queries the suggestions endpoint with the typed prefix', async () => {
    const user = userEvent.setup();
    render(<ControlledHost />);
    const ta = screen.getByPlaceholderText('Write...');
    await user.click(ta);
    await user.type(ta, '@ali');

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const lastCall = fetchMock.mock.calls.at(-1);
    expect(lastCall?.[0]).toContain('/api/users/suggestions?q=ali');
  });

  it('treats @ inside an email as not a trigger', async () => {
    const user = userEvent.setup();
    render(<ControlledHost />);
    const ta = screen.getByPlaceholderText('Write...');
    await user.click(ta);
    await user.type(ta, 'reach me at alice@bob');

    // No fetch fired; no dropdown opened.
    await new Promise((r) => setTimeout(r, 200));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the dropdown when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<ControlledHost />);
    const ta = screen.getByPlaceholderText('Write...');
    await user.click(ta);
    await user.type(ta, '@a');
    await waitFor(() =>
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    );

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('inserts the chosen username and a trailing space on click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledHost onValueChange={onValueChange} />);

    const ta = screen.getByPlaceholderText('Write...');
    await user.click(ta);
    await user.type(ta, 'hey @al');

    await waitFor(() =>
      expect(screen.getByText('@alice')).toBeInTheDocument()
    );
    // mousedown is what the dropdown listens on (so the textarea doesn't
    // blur and dismount the dropdown before select fires).
    const option = screen.getByRole('option', { name: /alice/i });
    await act(async () => {
      option.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true, cancelable: true })
      );
    });

    await waitFor(() => {
      const last = onValueChange.mock.calls.at(-1)?.[0];
      expect(last).toBe('hey @alice ');
    });
  });

  it('inserts via Enter when a suggestion is active', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ControlledHost onValueChange={onValueChange} />);

    const ta = screen.getByPlaceholderText('Write...');
    await user.click(ta);
    await user.type(ta, '@bo');
    await waitFor(() =>
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    );

    await user.keyboard('{Enter}');
    // The first suggestion is alice in our mock — Enter picks the
    // active row (index 0) which is alice; assert that.
    await waitFor(() => {
      const last = onValueChange.mock.calls.at(-1)?.[0];
      expect(last).toBe('@alice ');
    });
  });

  it('navigates between suggestions with ArrowDown / ArrowUp', async () => {
    const user = userEvent.setup();
    render(<ControlledHost />);
    const ta = screen.getByPlaceholderText('Write...');
    await user.click(ta);
    await user.type(ta, '@');
    await waitFor(() =>
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    );

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('option')[1]).toHaveAttribute(
      'aria-selected',
      'true'
    );

    await user.keyboard('{ArrowUp}');
    expect(screen.getAllByRole('option')[0]).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('shows a no-matches hint when the endpoint returns empty', async () => {
    setFetchResponse([]);
    const user = userEvent.setup();
    render(<ControlledHost />);
    const ta = screen.getByPlaceholderText('Write...');
    await user.click(ta);
    await user.type(ta, '@xyz');

    const listbox = await screen.findByRole('listbox');
    expect(listbox).toHaveTextContent(/no matches/i);
    expect(listbox).toHaveTextContent('@xyz');
  });

  it('portals the dropdown to document.body so an overflow-hidden ancestor cannot clip it', async () => {
    const user = userEvent.setup();
    const { container } = render(
      // Simulate a clipping wrapper (the SurfacePanel does this in
      // production): if the dropdown sat as a descendant, the panel's
      // `overflow: hidden` would hide it from view.
      <div className="overflow-hidden" data-testid="clip-wrap">
        <ControlledHost />
      </div>
    );
    const ta = screen.getByPlaceholderText('Write...');
    await user.click(ta);
    await user.type(ta, '@');

    const listbox = await screen.findByRole('listbox');
    // The portal renders the dropdown to document.body — the clipping
    // wrapper rendered by `render()` (container) must NOT contain it.
    expect(container.contains(listbox)).toBe(false);
    // And the dropdown is a direct child of document.body (or its
    // immediate test-harness root), which has no overflow-hidden.
    expect(document.body.contains(listbox)).toBe(true);
  });
});
