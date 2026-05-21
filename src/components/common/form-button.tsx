'use client';

import { useFormStatus } from 'react-dom';
import { IconSpinner } from '@/components/icons';
import { PrimaryButton } from '@/components/common/primary-button';

interface FormButtonProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function FormButton({ children, fullWidth = true }: FormButtonProps) {
  const { pending } = useFormStatus();

  return (
    <PrimaryButton type="submit" disabled={pending} aria-busy={pending} fullWidth={fullWidth}>
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
    </PrimaryButton>
  );
}
