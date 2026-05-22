export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

/**
 * Flatten markdown to plain text for card previews. Not a full parser —
 * just enough to keep `line-clamp-2` snippets clean. Drops code blocks
 * and images entirely; unwraps bold/italic/links/lists/headings/quotes.
 */
export function stripMarkdown(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, '') // fenced code blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → text
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/(\*\*|__)(.+?)\1/g, '$2') // bold
    .replace(/(\*|_)(.+?)\1/g, '$2') // italic
    .replace(/~~(.+?)~~/g, '$1') // strikethrough
    .replace(/^\s{0,3}>\s?/gm, '') // blockquote markers
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
    .replace(/^\s{0,3}[-*+]\s+/gm, '') // unordered list markers
    .replace(/^\s{0,3}\d+\.\s+/gm, '') // ordered list markers
    .replace(/\s+/g, ' ') // collapse whitespace (incl. newlines)
    .trim();
}

const TOPIC_PALETTE = [
  { bg: 'bg-topic-terracotta-50', text: 'text-topic-terracotta-700', dot: 'bg-topic-terracotta-500' },
  { bg: 'bg-topic-sage-50',       text: 'text-topic-sage-700',       dot: 'bg-topic-sage-500' },
  { bg: 'bg-topic-plum-50',       text: 'text-topic-plum-700',       dot: 'bg-topic-plum-500' },
  { bg: 'bg-topic-teal-50',       text: 'text-topic-teal-700',       dot: 'bg-topic-teal-500' },
  { bg: 'bg-topic-mustard-50',    text: 'text-topic-mustard-700',    dot: 'bg-topic-mustard-500' },
  { bg: 'bg-topic-periwinkle-50', text: 'text-topic-periwinkle-700', dot: 'bg-topic-periwinkle-500' },
  { bg: 'bg-topic-rust-50',       text: 'text-topic-rust-700',       dot: 'bg-topic-rust-500' },
  { bg: 'bg-topic-rose-50',       text: 'text-topic-rose-700',       dot: 'bg-topic-rose-500' },
] as const;

export type TopicTone = (typeof TOPIC_PALETTE)[number];

export function topicTone(slug: string): TopicTone {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return TOPIC_PALETTE[hash % TOPIC_PALETTE.length];
}

/**
 * Turn a display name like "Maya Chen" into a URL-safe slug "maya-chen".
 * Used as a fallback when a user has no stored `username` (mostly legacy
 * rows pre-dating the username column).
 */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolve the URL slug for an author profile link. Prefers the stored
 * `username`; falls back to slugifying the display name for legacy rows.
 * Returns null when there's nothing to link to.
 */
export function resolveAuthorSlug(user: {
  name?: string | null;
  username?: string | null;
}): string | null {
  return user.username ?? (user.name ? slugifyName(user.name) : null);
}
