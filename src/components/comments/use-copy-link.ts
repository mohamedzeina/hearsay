'use client';

import { useState } from 'react';

export function useCopyLink(commentId: string) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#c-${commentId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail on insecure origins or denied permissions.
    }
  };

  return { copied, copy };
}
