// Single source of truth for write-form min/max bounds. Both the Zod
// schemas (server-side validation) and the CharCounter UI import from
// here so the two never drift.

export const POST_TITLE = { min: 3, max: 200 } as const;
export const POST_CONTENT = { min: 10, max: 10_000 } as const;
export const COMMENT_CONTENT = { min: 3, max: 5_000 } as const;
export const TOPIC_DESCRIPTION = { min: 10, max: 280 } as const;
