'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface ToastPayload {
  /** Internal — incremented per show() so successive callers replace, not stack. */
  id: number;
  /** Tiny uppercase mono label (e.g. "SAVED" / "UNSAVED"). */
  eyebrow: string;
  /** Single display-font sentence (e.g. "Tucked away in /saved."). */
  body: string;
  /**
   * Optional callback fired when the user taps Undo. The toast dismisses
   * itself afterward — callers don't need to call dismiss() themselves.
   */
  undo?: () => void;
}

interface ToastContextValue {
  show: (toast: Omit<ToastPayload, 'id'>) => void;
  /**
   * Dismiss the active toast. Pass `{ instant: true }` to skip the exit
   * animation — useful when the user just triggered an action (e.g. Undo)
   * and is expecting the toast to get out of the way immediately.
   */
  dismiss: (opts?: { instant?: boolean }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider />');
  }
  return ctx;
}

const DISMISS_MS = 3500;
const DISMISS_AFTER_HOVER_MS = 1500;
const EXIT_MS = 220;

type Phase = 'enter' | 'visible' | 'exit';

export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [phase, setPhase] = useState<Phase>('enter');
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const clearDismissTimer = () => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  };

  const clearExitTimer = () => {
    if (exitTimer.current) {
      clearTimeout(exitTimer.current);
      exitTimer.current = null;
    }
  };

  const beginExit = useCallback(() => {
    setPhase('exit');
    exitTimer.current = setTimeout(() => {
      setToast(null);
      exitTimer.current = null;
    }, EXIT_MS);
  }, []);

  const scheduleDismiss = useCallback(
    (ms: number) => {
      clearDismissTimer();
      dismissTimer.current = setTimeout(() => {
        dismissTimer.current = null;
        beginExit();
      }, ms);
    },
    [beginExit]
  );

  const show = useCallback(
    (payload: Omit<ToastPayload, 'id'>) => {
      clearDismissTimer();
      clearExitTimer();
      idRef.current += 1;
      setToast({ ...payload, id: idRef.current });
      // Mount in the off-screen "enter" state, then flip to "visible" next
      // frame so the CSS transition fires. rAF avoids the rare case where
      // React batches the state updates and skips the entry animation.
      setPhase('enter');
      requestAnimationFrame(() => {
        setPhase('visible');
      });
      scheduleDismiss(DISMISS_MS);
    },
    [scheduleDismiss]
  );

  const dismiss = useCallback(
    (opts?: { instant?: boolean }) => {
      clearDismissTimer();
      if (opts?.instant) {
        clearExitTimer();
        setToast(null);
        return;
      }
      if (exitTimer.current) return; // already exiting
      beginExit();
    },
    [beginExit]
  );

  // Pause the dismiss clock while the user has the toast hovered.
  const onMouseEnter = () => {
    clearDismissTimer();
  };
  const onMouseLeave = () => {
    if (phase === 'exit') return;
    scheduleDismiss(DISMISS_AFTER_HOVER_MS);
  };

  // Escape dismisses an open toast.
  useEffect(() => {
    if (!toast) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toast, dismiss]);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      clearDismissTimer();
      clearExitTimer();
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="toast"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-rule bg-surface shadow-lift px-4 py-3 transition-all duration-200 ease-out motion-reduce:transition-opacity motion-reduce:duration-150 ${
            phase === 'visible'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 motion-reduce:translate-y-0'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-persimmon"
                  aria-hidden
                />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2">
                  {toast.eyebrow}
                </span>
              </div>
              <p className="mt-1 font-display font-bold text-sm text-ink leading-snug">
                {toast.body}
              </p>
            </div>
            {toast.undo && (
              <button
                type="button"
                onClick={() => {
                  toast.undo?.();
                  // Snap-dismiss so the user gets immediate feedback that
                  // their tap landed — the exit animation reads as lag
                  // here, since the action they just took is the news.
                  dismiss({ instant: true });
                }}
                className="shrink-0 text-sm font-semibold text-persimmon-deep hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none"
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
