import { describe, expect, it } from 'vitest';
import { fetchSearchSuggestions } from '@/db/queries/search-suggestions';
import { makePost, makeTopic, makeUser } from './factories';

describe('fetchSearchSuggestions', () => {
  it('returns empty result for terms shorter than 2 chars', async () => {
    expect(await fetchSearchSuggestions('')).toEqual({ topics: [], posts: [] });
    expect(await fetchSearchSuggestions('a')).toEqual({ topics: [], posts: [] });
  });

  it('trims whitespace before checking length', async () => {
    expect(await fetchSearchSuggestions('  a  ')).toEqual({
      topics: [],
      posts: [],
    });
  });

  it('finds topics by slug substring (case-insensitive)', async () => {
    await makeTopic({ slug: 'javascript' });
    await makeTopic({ slug: 'java-tips' });
    await makeTopic({ slug: 'cooking' });

    const result = await fetchSearchSuggestions('java');
    expect(result.topics.map((t) => t.slug).sort()).toEqual([
      'java-tips',
      'javascript',
    ]);
    expect(result.posts).toEqual([]);
  });

  it('finds posts by title or content', async () => {
    const user = await makeUser();
    const topic = await makeTopic({ slug: 'foo' });
    await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'About Rust',
      content: 'unrelated body',
    });
    await makePost({
      userId: user.id,
      topicId: topic.id,
      title: 'A post',
      content: 'I love rusty bikes',
    });

    const result = await fetchSearchSuggestions('rust');
    expect(result.posts).toHaveLength(2);
  });

  it('caps to 4 topics and 5 posts', async () => {
    for (let i = 0; i < 7; i++) await makeTopic({ slug: `topic-x-${i}` });
    const user = await makeUser();
    const topic = await makeTopic({ slug: 'host' });
    for (let i = 0; i < 8; i++) {
      await makePost({
        userId: user.id,
        topicId: topic.id,
        title: `Searchable post ${i}`,
      });
    }

    const result = await fetchSearchSuggestions('searchable');
    expect(result.posts).toHaveLength(5);

    const topicResult = await fetchSearchSuggestions('topic-x');
    expect(topicResult.topics).toHaveLength(4);
  });

  it('truncates excessively long terms to MAX_TERM_LENGTH', async () => {
    // Should not throw; just runs against a clamped term.
    const huge = 'a'.repeat(2000);
    await expect(fetchSearchSuggestions(huge)).resolves.toEqual({
      topics: [],
      posts: [],
    });
  });
});
