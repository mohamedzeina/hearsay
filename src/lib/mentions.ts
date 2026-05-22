// GitHub-style username pattern:
//   - first char must be alphanumeric (no leading hyphen)
//   - subsequent chars allow alphanumeric or hyphen, up to 38 more (39 total)
// The negative lookbehind on `\w` / `@` rules out email addresses
// (foo@bar.com → no match) and chained at-signs (@@bob → no match).
//
// A factory not a shared const: regexes with the `g` flag carry
// `lastIndex` state across `.exec()` / `.matchAll()`, so different
// callers must each get their own instance.
export const mentionRegex = (): RegExp =>
  /(?<![\w@])@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38}))/g;

// Extract unique mentioned usernames from a raw markdown string.
// Strips fenced and inline code first so `@user` inside ``` blocks or
// `backticks` never counts as a mention. Returned usernames are
// lowercased so the caller can look them up against the unique
// `User.username` column without case-sensitivity drama.
export function extractMentions(content: string): string[] {
  const withoutFenced = content.replace(/```[\s\S]*?```/g, '');
  const withoutCode = withoutFenced.replace(/`[^`\n]*`/g, '');
  const seen = new Set<string>();
  for (const match of withoutCode.matchAll(mentionRegex())) {
    seen.add(match[1].toLowerCase());
  }
  return Array.from(seen);
}
