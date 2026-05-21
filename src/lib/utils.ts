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
  { bg: 'bg-[#FDE8E0]', text: 'text-[#9C3D24]', dot: 'bg-[#C25636]' }, // terracotta
  { bg: 'bg-[#E4EBDF]', text: 'text-[#3F5733]', dot: 'bg-[#5F7A4D]' }, // sage
  { bg: 'bg-[#EDE2EE]', text: 'text-[#6B3D6E]', dot: 'bg-[#8A5790]' }, // plum
  { bg: 'bg-[#DBEDEB]', text: 'text-[#1F5A55]', dot: 'bg-[#357973]' }, // teal
  { bg: 'bg-[#F5EDD3]', text: 'text-[#6B5421]', dot: 'bg-[#9A7B30]' }, // mustard
  { bg: 'bg-[#E2E5F2]', text: 'text-[#3F4878]', dot: 'bg-[#5B679F]' }, // periwinkle
  { bg: 'bg-[#F3DCC9]', text: 'text-[#7A3F1C]', dot: 'bg-[#A1582E]' }, // rust
  { bg: 'bg-[#F4E0E1]', text: 'text-[#7C3F49]', dot: 'bg-[#A05A66]' }, // dusty rose
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
