import { describe, expect, it } from 'vitest';
import { findMentionTrigger } from '@/lib/find-mention-trigger';

describe('findMentionTrigger', () => {
  it('returns null when there is no @ anywhere before the caret', () => {
    expect(findMentionTrigger('')).toBeNull();
    expect(findMentionTrigger('hello world')).toBeNull();
  });

  it('returns an empty-query trigger when the user just typed @', () => {
    expect(findMentionTrigger('@')).toEqual({ start: 0, query: '' });
    expect(findMentionTrigger('hey @')).toEqual({ start: 4, query: '' });
  });

  it('captures the in-progress query after @', () => {
    expect(findMentionTrigger('@al')).toEqual({ start: 0, query: 'al' });
    expect(findMentionTrigger('hey @alice')).toEqual({
      start: 4,
      query: 'alice',
    });
  });

  it('honours the latest @ when several appear', () => {
    expect(findMentionTrigger('email me at foo@bar then @car')).toEqual({
      start: 25,
      query: 'car',
    });
  });

  it('treats @ inside an email as not a mention (preceded by a word char)', () => {
    expect(findMentionTrigger('reach me at alice@bob')).toBeNull();
  });

  it('rejects @@ chains', () => {
    expect(findMentionTrigger('@@al')).toBeNull();
  });

  it('rejects a leading hyphen in the query', () => {
    expect(findMentionTrigger('@-foo')).toBeNull();
  });

  it('accepts hyphens after the first query character', () => {
    expect(findMentionTrigger('@a-b')).toEqual({ start: 0, query: 'a-b' });
  });

  it('aborts when an invalid character appears mid-query', () => {
    // A space or punctuation closes the mention — the helper returns
    // null so the caller can hide the dropdown.
    expect(findMentionTrigger('@alice ')).toBeNull();
    expect(findMentionTrigger('@alice.')).toBeNull();
    expect(findMentionTrigger('@alice!')).toBeNull();
  });

  it('caps the query at the GitHub username max of 39', () => {
    expect(findMentionTrigger('@' + 'a'.repeat(39))).not.toBeNull();
    expect(findMentionTrigger('@' + 'a'.repeat(40))).toBeNull();
  });

  it('treats @ after whitespace as a fresh trigger', () => {
    expect(findMentionTrigger('hey, @bob')).toEqual({ start: 5, query: 'bob' });
    expect(findMentionTrigger('hi\n@bob')).toEqual({ start: 3, query: 'bob' });
  });
});
