const baseLabels = {
  label: 'text-ink text-xs font-semibold',
  errorMessage: 'text-persimmon-deep text-xs font-medium',
} as const;

// Mouse focus shows a persimmon border + surface background. Keyboard focus
// adds HeroUI's default ring on top — themed to persimmon via the heroui()
// plugin in tailwind.config.ts so the two indicators read as one designed
// focus look rather than competing colours.
const wrapperBase =
  'bg-cream-2/40 border border-rule shadow-none rounded-xl ' +
  'data-[hover=true]:border-rule-2 ' +
  'group-data-[focus=true]:border-persimmon group-data-[focus=true]:bg-surface';

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
