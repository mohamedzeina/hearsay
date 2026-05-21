import Link from 'next/link';
import type { ComponentProps } from 'react';

export const primaryButtonClass =
  'group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-ink text-cream text-sm font-semibold hover:bg-persimmon active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 motion-reduce:transition-none shadow-soft';

function compose(fullWidth: boolean | undefined, className: string | undefined) {
  return [
    primaryButtonClass,
    fullWidth ? 'w-full' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
};

export function PrimaryButton({
  fullWidth,
  className,
  ...rest
}: ButtonProps) {
  return <button {...rest} className={compose(fullWidth, className)} />;
}

type LinkProps = ComponentProps<typeof Link> & {
  fullWidth?: boolean;
};

export function PrimaryLink({ fullWidth, className, ...rest }: LinkProps) {
  return <Link {...rest} className={compose(fullWidth, className)} />;
}
