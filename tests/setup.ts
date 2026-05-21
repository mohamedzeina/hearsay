import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// React 19's useActionState + react-dom's useFormStatus rely on React's
// experimental form runtime which isn't wired into jsdom. Provide stubs that
// mimic the shape without doing anything; individual tests can override via
// vi.mock if they need finer control (see form-button.test.tsx).
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useActionState: <T,>(_action: unknown, initial: T) => [initial, () => {}, false],
  };
});
vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    useFormStatus: () => ({ pending: false, data: null, method: null, action: null }),
  };
});

// React logs a DOM warning when a function is passed to <form action={...}>
// in jsdom — that's our stubbed useFormState action, expected in tests.
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === 'string' && /Invalid value for prop `?\w*`? on </.test(first)) {
    return;
  }
  originalConsoleError(...args);
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// jsdom doesn't implement matchMedia — NextUI's motion code touches it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// ResizeObserver is used by NextUI internals; jsdom doesn't have it.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
