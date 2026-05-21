'use client';

import { createContext, useContext } from 'react';

type SavedListContextValue = {
  removePost: (postId: string) => void;
};

const SavedListContext = createContext<SavedListContextValue | null>(null);

export const SavedListProvider = SavedListContext.Provider;

export function useSavedListContext() {
  return useContext(SavedListContext);
}
