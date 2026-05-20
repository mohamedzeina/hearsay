'use client';

import { useFormStatus } from 'react-dom';
import { IconSpinner } from '@/components/icons';

interface FormButtonProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function FormButton({ children, fullWidth = true }: FormButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-persimmon active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 motion-reduce:transition-none shadow-soft ${fullWidth ? 'w-full' : ''}`}
    >
      {pending ? (
        <>
          <IconSpinner className="w-4 h-4" />
          <span>Working&hellip;</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none">&rarr;</span>
        </>
      )}
    </button>
  );
}
