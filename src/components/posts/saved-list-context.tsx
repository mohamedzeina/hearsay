'use client';

import { createContext, useContext } from 'react';

type SavedListContextValue = {
  removePost: (postId: string) => void;
  /**
   * Undo affordance for {@link removePost}: tells the list to put the
   * tombstoned post back. Used by the bookmark toast's Undo button so
   * the card reappears in the same frame the server re-save kicks off.
   */
  restorePost: (postId: string) => void;
};

const SavedListContext = createContext<SavedListContextValue | null>(null);

export const SavedListProvider = SavedListContext.Provider;

export function useSavedListContext() {
  return useContext(SavedListContext);
}
