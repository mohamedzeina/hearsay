import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ToastProvider, { useToast } from '@/components/common/toast';

// Capture the live toast API into a ref so tests can call show()/dismiss()
// directly without going through userEvent — which deadlocks against fake
// timers in jsdom for this provider's rAF + setTimeout combo.
let toastApi: ReturnType<typeof useToast> | null = null;

function Capture() {
  toastApi = useToast();
  return null;
}

function renderProvider() {
  toastApi = null;
  return render(
    <ToastProvider>
      <Capture />
    </ToastProvider>
  );
}

async function flushFrame() {
  // The provider flips phase 'enter' → 'visible' inside a rAF callback. Vitest's
  // jsdom rAF maps to setTimeout(0) by default, so a fake-timer tick + a
  // microtask flush is enough to land the visible phase.
  await act(async () => {
    vi.advanceTimersByTime(20);
    await Promise.resolve();
  });
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    toastApi = null;
  });

  it('renders nothing until show() is called', () => {
    renderProvider();
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('shows a toast with eyebrow + body when show() is called', async () => {
    renderProvider();

    act(() => {
      toastApi!.show({ eyebrow: 'Saved', body: 'Tucked away in /saved.' });
    });
    await flushFrame();

    const toast = screen.getByTestId('toast');
    expect(toast).toHaveTextContent('Saved');
    expect(toast).toHaveTextContent('Tucked away in /saved.');
    expect(toast).toHaveAttribute('role', 'status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  it('replaces (does not stack) when show() is called twice in succession', async () => {
    renderProvider();

    act(() => {
      toastApi!.show({ eyebrow: 'Saved', body: 'first' });
    });
    act(() => {
      toastApi!.show({ eyebrow: 'Unsaved', body: 'second' });
    });
    await flushFrame();

    const toasts = screen.getAllByTestId('toast');
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toHaveTextContent('second');
    expect(toasts[0]).not.toHaveTextContent('first');
  });

  it('auto-dismisses after ~3.5s', async () => {
    renderProvider();

    act(() => {
      toastApi!.show({ eyebrow: 'Saved', body: 'will disappear' });
    });
    await flushFrame();
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3500 + 220 + 10);
    });

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('Undo button calls the supplied callback and dismisses', async () => {
    const undo = vi.fn();
    renderProvider();

    act(() => {
      toastApi!.show({ eyebrow: 'Saved', body: 'with undo', undo });
    });
    await flushFrame();

    fireEvent.click(screen.getByRole('button', { name: /undo/i }));
    expect(undo).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(230);
    });
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('Escape dismisses the active toast', async () => {
    renderProvider();

    act(() => {
      toastApi!.show({ eyebrow: 'Saved', body: 'press escape' });
    });
    await flushFrame();
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    await act(async () => {
      vi.advanceTimersByTime(230);
    });

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('does not render an Undo button when no undo callback is given', async () => {
    renderProvider();

    act(() => {
      toastApi!.show({ eyebrow: 'Saved', body: 'no undo here' });
    });
    await flushFrame();

    expect(
      screen.queryByRole('button', { name: /undo/i })
    ).not.toBeInTheDocument();
  });

  it('dismiss() called from outside short-circuits the visible phase', async () => {
    renderProvider();

    act(() => {
      toastApi!.show({ eyebrow: 'Saved', body: 'short-lived' });
    });
    await flushFrame();
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    act(() => {
      toastApi!.dismiss();
    });
    await act(async () => {
      vi.advanceTimersByTime(230);
    });

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('useToast outside a provider throws a clear error', () => {
    expect(() => render(<Capture />)).toThrowError(/useToast/);
  });
});
