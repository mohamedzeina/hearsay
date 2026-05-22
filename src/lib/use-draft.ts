'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Auto-saves form text to localStorage so refreshes/tab-closes don't
// nuke in-progress posts and comments. Pure client-side; values clear
// on successful submit via the returned `clear()`.
//
// SSR-safe: initial render is always '' to match server output, then a
// post-mount effect rehydrates from localStorage. Tolerates disabled
// storage (Safari private, quota errors, etc.) silently — drafts are a
// nice-to-have, not a blocker.

const PREFIX = 'hearsay:draft:';

export function useDraft(key: string) {
  const [value, setValue] = useState('');
  const hydratedRef = useRef(false);

  // Restore on mount / key change.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PREFIX + key);
      setValue(stored ?? '');
    } catch {
      setValue('');
    }
    hydratedRef.current = true;
    return () => {
      hydratedRef.current = false;
    };
  }, [key]);

  // Persist on every change after hydration. Empty strings remove the
  // entry rather than storing '' so cleared drafts don't litter storage.
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      if (value === '') {
        window.localStorage.removeItem(PREFIX + key);
      } else {
        window.localStorage.setItem(PREFIX + key, value);
      }
    } catch {
      // Storage unavailable — drafts simply don't persist this session.
    }
  }, [key, value]);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {}
    setValue('');
  }, [key]);

  return { value, setValue, clear };
}
