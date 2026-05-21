import { PrimaryLink } from '@/components/common/primary-button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2 mb-4">
        Error &mdash; 404
      </p>
      <h1 className="font-display font-extrabold tracking-tight text-6xl sm:text-7xl text-ink leading-none">
        Nothing{' '}
        <span className="relative inline-block">
          <span className="relative z-10 italic font-medium">here</span>
          <span
            aria-hidden
            className="absolute inset-x-0 -bottom-1 h-3 bg-persimmon-soft -z-0 rounded-sm"
          />
        </span>
        .
      </h1>
      <p className="mt-5 max-w-sm text-base text-ink-2 leading-relaxed">
        The page you&apos;re looking for has been taken down, renamed, or
        never existed in the first place.
      </p>
      <div className="mt-7 flex items-center gap-3">
        <PrimaryLink href="/">
          <span
            aria-hidden
            className="transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none"
          >
            &larr;
          </span>
          Back to the front page
        </PrimaryLink>
      </div>
    </div>
  );
}
