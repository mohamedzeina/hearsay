// Pure helper that inspects the text up to the caret in a textarea and
// decides whether the user is mid-mention. Returns the position of the
// `@` and the username characters typed so far, or null if no trigger
// is active.
//
// Rules — kept in lockstep with the mentions render regex:
//   - The `@` must be at the start of the text or follow a non-word /
//     non-`@` character. This excludes email-like substrings (`a@b`)
//     and chained at-signs (`@@`).
//   - The query may be empty (the user just typed `@` and hasn't typed
//     a username yet) — we still surface the trigger so the dropdown
//     can show recent suggestions.
//   - The first query character (if any) must be alphanumeric. A
//     leading hyphen disqualifies, matching GitHub's username rule.
//   - Subsequent query characters must be alphanumeric or `-`.
//   - Query length is capped at 39 chars (GitHub username max).

export interface MentionTrigger {
  /** Index of the `@` in the source text. */
  start: number;
  /** Username characters typed after the `@`, possibly empty. */
  query: string;
}

const QUERY_CHAR = /^[A-Za-z0-9-]$/;
const FIRST_CHAR = /^[A-Za-z0-9]$/;
const BLOCK_BEFORE = /[\w@]/;
const MAX_QUERY = 39;

export function findMentionTrigger(
  textBeforeCaret: string
): MentionTrigger | null {
  const at = textBeforeCaret.lastIndexOf('@');
  if (at === -1) return null;

  if (at > 0 && BLOCK_BEFORE.test(textBeforeCaret[at - 1] ?? '')) {
    return null;
  }

  const query = textBeforeCaret.slice(at + 1);
  if (query.length > MAX_QUERY) return null;
  if (query.length > 0 && !FIRST_CHAR.test(query[0])) return null;
  for (let i = 1; i < query.length; i++) {
    if (!QUERY_CHAR.test(query[i])) return null;
  }
  return { start: at, query };
}
