import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const outlineBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Speech-bubble icon. Used for reply/comment counts and "no comments" empty states. */
export function IconReply({ strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg {...outlineBase} strokeWidth={strokeWidth} {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/** Magnifier icon. Used in the header search input and the search-results empty state. */
export function IconSearch({ strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg {...outlineBase} strokeWidth={strokeWidth} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/** Pencil icon. Used by the "Write a post" CTA and the new-post page header. */
export function IconPencil({ strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg {...outlineBase} strokeWidth={strokeWidth} {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

/** Plus icon. Used by the "Create a topic" CTA. */
export function IconPlus({ strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg {...outlineBase} strokeWidth={strokeWidth} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Filled chevron used for select/disclosure affordances. Different viewBox & style than outline icons. */
export function IconChevronDown(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Filled chevron-right used by the "Why GitHub?" disclosure (rotates 90° when open). */
export function IconChevronRight(props: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        d="M7.21 5.23a.75.75 0 011.06 0l4.5 4.25a.75.75 0 010 1.04l-4.5 4.25a.75.75 0 11-1.04-1.08L11.18 10 7.21 6.27a.75.75 0 010-1.04z"
        clipRule="evenodd"
      />
    </svg>
  );
}
