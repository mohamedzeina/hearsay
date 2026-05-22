const baseLabels = {
  label: 'text-ink text-xs font-semibold',
  errorMessage: 'text-persimmon-deep text-xs font-medium',
} as const;

// Focus is a single indicator: the wrapper border shifts to persimmon and the
// background flips to surface white. HeroUI's default focus-visible ring is
// suppressed here (ring-0 + ring-offset-0) — when it was left on, it layered
// outside the border and read as two parallel persimmon lines instead of one
// coordinated halo. The border alone is a sufficient a11y cue.
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
