import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeProvider, {
  themeBootScript,
  useTheme,
} from '@/components/theme/theme-provider';
import ThemeToggle from '@/components/theme/theme-toggle';

function Capture({ onTheme }: { onTheme: (api: ReturnType<typeof useTheme>) => void }) {
  const api = useTheme();
  onTheme(api);
  return null;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('starts in light when the boot script has not added .dark', () => {
    let api!: ReturnType<typeof useTheme>;
    render(
      <ThemeProvider>
        <Capture onTheme={(a) => (api = a)} />
      </ThemeProvider>
    );

    expect(api.theme).toBe('light');
  });

  it('reads the initial theme from the DOM (mirrors what the boot script set)', () => {
    document.documentElement.classList.add('dark');
    let api!: ReturnType<typeof useTheme>;
    render(
      <ThemeProvider>
        <Capture onTheme={(a) => (api = a)} />
      </ThemeProvider>
    );

    expect(api.theme).toBe('dark');
  });

  it('setTheme("dark") adds the .dark class and persists to localStorage', () => {
    let api!: ReturnType<typeof useTheme>;
    render(
      <ThemeProvider>
        <Capture onTheme={(a) => (api = a)} />
      </ThemeProvider>
    );

    act(() => {
      api.setTheme('dark');
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('hearsay:theme')).toBe('dark');
  });

  it('toggle() flips between light and dark', () => {
    let api!: ReturnType<typeof useTheme>;
    render(
      <ThemeProvider>
        <Capture onTheme={(a) => (api = a)} />
      </ThemeProvider>
    );

    act(() => {
      api.toggle();
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => {
      api.toggle();
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('useTheme outside the provider throws', () => {
    expect(() =>
      render(<Capture onTheme={() => {}} />)
    ).toThrowError(/useTheme/);
  });
});

describe('themeBootScript', () => {
  it('applies .dark when localStorage has "dark"', () => {
    localStorage.setItem('hearsay:theme', 'dark');
    document.documentElement.classList.remove('dark');

    new Function(themeBootScript)();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('does not apply .dark when localStorage has "light"', () => {
    localStorage.setItem('hearsay:theme', 'light');
    document.documentElement.classList.remove('dark');

    new Function(themeBootScript)();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('survives missing localStorage (try/catch swallowed)', () => {
    document.documentElement.classList.remove('dark');
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error('disabled');
    };
    try {
      expect(() => new Function(themeBootScript)()).not.toThrow();
    } finally {
      Storage.prototype.getItem = orig;
    }
  });
});

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('renders the moon icon in light mode (toggle to dark)', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const btn = screen.getByRole('button', { name: /switch to dark theme/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders the sun icon in dark mode (toggle to light)', () => {
    document.documentElement.classList.add('dark');
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const btn = screen.getByRole('button', { name: /switch to light theme/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking flips the theme on the document and persists', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button'));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('hearsay:theme')).toBe('dark');

    await user.click(screen.getByRole('button'));

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('hearsay:theme')).toBe('light');
  });
});
