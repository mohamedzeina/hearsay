import { describe, expect, it } from 'vitest';
import { fetchUserSuggestions } from '@/db/queries/users';
import { makeUser } from './factories';

describe('fetchUserSuggestions', () => {
  it('returns users when the query is empty', async () => {
    // Bare-@ trigger should still surface candidates. We don't assert
    // an exact ordering — three back-to-back inserts can share a
    // createdAt millisecond, so any tie-break order is acceptable as
    // long as the rows are all present.
    const alice = await makeUser({ username: 'alice' });
    const bob = await makeUser({ username: 'bob' });
    const carol = await makeUser({ username: 'carol' });

    const result = await fetchUserSuggestions('');
    const ids = result.map((u) => u.id);
    expect(ids).toContain(alice.id);
    expect(ids).toContain(bob.id);
    expect(ids).toContain(carol.id);
  });

  it('caps the result at 6 entries', async () => {
    for (let i = 0; i < 12; i++) {
      await makeUser({ username: `bulk-${i}` });
    }
    const result = await fetchUserSuggestions('bulk-');
    expect(result).toHaveLength(6);
  });

  it('matches by username prefix (case-insensitive)', async () => {
    await makeUser({ username: 'alpha' });
    await makeUser({ username: 'alphaeon' });
    await makeUser({ username: 'beta' });

    const result = await fetchUserSuggestions('AL');
    expect(result.map((u) => u.username).sort()).toEqual([
      'alpha',
      'alphaeon',
    ]);
  });

  it('excludes legacy rows with a null username', async () => {
    await makeUser({ username: 'visible' });
    await makeUser({ username: null });

    const all = await fetchUserSuggestions('');
    const usernames = all.map((u) => u.username);
    expect(usernames).toContain('visible');
    // Null-username rows are filtered out — every returned row has a
    // non-empty username string we can render.
    for (const u of all) {
      expect(typeof u.username).toBe('string');
      expect(u.username.length).toBeGreaterThan(0);
    }
  });

  it('returns the avatar + display fields each row needs', async () => {
    await makeUser({
      username: 'shaper',
      name: 'Shaper Person',
    });
    const result = await fetchUserSuggestions('shap');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      username: 'shaper',
      name: 'Shaper Person',
    });
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('image');
  });

  it('trims whitespace and respects the 39-char query cap', async () => {
    await makeUser({ username: 'spaced' });
    const result = await fetchUserSuggestions('   spaced   ');
    expect(result.map((u) => u.username)).toContain('spaced');

    // 50 chars → server clips to 39, no match
    const long = await fetchUserSuggestions('x'.repeat(50));
    expect(long).toEqual([]);
  });
});
