const baseLabels = {
  label: 'text-ink text-xs font-semibold',
  errorMessage: 'text-persimmon-deep text-xs font-medium',
} as const;

// Focus is signaled by a single, deliberate border colour shift + bg change.
// HeroUI's Input ships a default focus-visible ring (ring-2 + ring-offset-2)
// which used to be invisible because Tailwind purged its classes — once we
// fixed the purge (commit ddd8e18), the ring layered on top of our border,
// producing a double-line outline. ring-0 + ring-offset-0 here suppresses
// HeroUI's ring so only our border-persimmon focus state shows. The border
// shift alone is a strong a11y focus indicator for keyboard users.
const wrapperBase =
  'bg-cream-2/40 border border-rule shadow-none rounded-xl ' +
  'data-[hover=true]:border-rule-2 ' +
  'group-data-[focus=true]:border-persimmon group-data-[focus=true]:bg-surface ' +
  'group-data-[focus-visible=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0';

/** Standard-size NextUI Input/Textarea classNames matching the warm-modern palette. */
export const inputClassNames = {
  ...baseLabels,
  inputWrapper: wrapperBase,
  input: 'text-ink placeholder:text-ink-3 text-sm',
} as const;

/** Larger-size variant (h-12, text-base) for primary forms like post-create. */
export const inputClassNamesLg = {
  ...baseLabels,
  inputWrapper: `${wrapperBase} h-12`,
  input: 'text-ink placeholder:text-ink-3 text-base',
} as const;

/** Large textarea variant — same wrapper as Lg input but with comfortable leading. */
export const textareaClassNamesLg = {
  ...baseLabels,
  inputWrapper: wrapperBase,
  input: 'text-ink placeholder:text-ink-3 text-base leading-relaxed',
} as const;
