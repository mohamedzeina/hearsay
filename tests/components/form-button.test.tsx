import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormButton from '@/components/common/form-button';

const useFormStatusMock = vi.fn();

vi.mock('react-dom', async () => {
  const actual = await vi.importActual<typeof import('react-dom')>('react-dom');
  return {
    ...actual,
    useFormStatus: () => useFormStatusMock(),
  };
});

describe('FormButton', () => {
  it('renders children and is enabled when not pending', () => {
    useFormStatusMock.mockReturnValue({ pending: false });
    render(<FormButton>Submit</FormButton>);
    const btn = screen.getByRole('button');
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'false');
    expect(btn).toHaveTextContent('Submit');
  });

  it('disables and shows "Working" spinner when pending', () => {
    useFormStatusMock.mockReturnValue({ pending: true });
    render(<FormButton>Submit</FormButton>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn).toHaveTextContent(/working/i);
    expect(btn).not.toHaveTextContent('Submit');
  });

  it('renders full-width by default', () => {
    useFormStatusMock.mockReturnValue({ pending: false });
    render(<FormButton>X</FormButton>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('omits w-full when fullWidth=false', () => {
    useFormStatusMock.mockReturnValue({ pending: false });
    render(<FormButton fullWidth={false}>X</FormButton>);
    expect(screen.getByRole('button')).not.toHaveClass('w-full');
  });

  it('has type="submit"', () => {
    useFormStatusMock.mockReturnValue({ pending: false });
    render(<FormButton>X</FormButton>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
