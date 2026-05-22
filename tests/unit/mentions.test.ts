import { describe, expect, it } from 'vitest';
import { extractMentions } from '@/lib/mentions';

describe('extractMentions', () => {
  it('finds a single @mention', () => {
    expect(extractMentions('hi @maya, welcome')).toEqual(['maya']);
  });

  it('finds multiple distinct mentions and preserves order of first occurrence', () => {
    expect(extractMentions('cc @theo and @nadia for context')).toEqual([
      'theo',
      'nadia',
    ]);
  });

  it('dedupes when a name is mentioned more than once', () => {
    expect(extractMentions('@kai please look. @kai also pls')).toEqual(['kai']);
  });

  it('lowercases usernames', () => {
    expect(extractMentions('thoughts @MAYA?')).toEqual(['maya']);
  });

  it('ignores email addresses (no false positives)', () => {
    expect(extractMentions('mail me at foo@bar.com')).toEqual([]);
  });

  it('ignores chained @ signs', () => {
    expect(extractMentions('classified info @@bob')).toEqual([]);
  });

  it('ignores mentions inside fenced code blocks', () => {
    const input = [
      'discuss the script:',
      '```bash',
      'echo @maya',
      '```',
      'and afterwards @theo',
    ].join('\n');
    expect(extractMentions(input)).toEqual(['theo']);
  });

  it('ignores mentions inside inline code', () => {
    expect(extractMentions('the `@kai` literal is not a mention; @sam is')).toEqual(['sam']);
  });

  it('stops at punctuation and non-name characters', () => {
    expect(extractMentions("@bob's idea was great, @jordan!")).toEqual([
      'bob',
      'jordan',
    ]);
  });

  it('respects the 39-char GitHub username cap', () => {
    const justFits = 'a'.repeat(39);
    const tooLong = 'a'.repeat(40);
    expect(extractMentions(`@${justFits}`)).toEqual([justFits]);
    // 40 chars: the 40th char is captured by the trailing rule but only 38
    // of the [a-zA-Z0-9-] chars are matched after the first — the rest
    // becomes prose after the username. Verify the captured slice is 39.
    const [captured] = extractMentions(`@${tooLong}`);
    expect(captured).toHaveLength(39);
  });

  it('skips a leading hyphen (must start with alphanumeric)', () => {
    expect(extractMentions('@-bob is invalid')).toEqual([]);
  });

  it('allows hyphens inside the username', () => {
    expect(extractMentions('@kim-jones thoughts?')).toEqual(['kim-jones']);
  });
});
