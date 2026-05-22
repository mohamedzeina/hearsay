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

/** Person silhouette. Used for the "Your profile" link in the user dropdown. */
export function IconUser({ strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg {...outlineBase} strokeWidth={strokeWidth} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  );
}

/** Sign-out icon: a door with an outgoing arrow. */
export function IconSignOut({ strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg {...outlineBase} strokeWidth={strokeWidth} {...props}>
      <path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
    </svg>
  );
}

/** Spinning loader for pending buttons. Hidden when prefers-reduced-motion is on. */
export function IconSpinner(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
      className={`animate-spin motion-reduce:hidden ${props.className ?? ''}`.trim()}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeOpacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
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

/** Two-link chain icon. Used by the comment permalink "copy link" button. */
export function IconLink({ strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg {...outlineBase} strokeWidth={strokeWidth} {...props}>
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" />
    </svg>
  );
}

/** Small checkmark. Used to confirm transient actions like "Copied!". */
export function IconCheck({ strokeWidth = 2.5, ...props }: IconProps) {
  return (
    <svg {...outlineBase} strokeWidth={strokeWidth} {...props}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

/** Bell icon. Used by the header notifications dropdown trigger. */
export function IconBell({ strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg {...outlineBase} strokeWidth={strokeWidth} {...props}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/** Bookmark icon. Pass `filled` to render the saved state (filled persimmon). */
export function IconBookmark({
  filled = false,
  strokeWidth = 2,
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
