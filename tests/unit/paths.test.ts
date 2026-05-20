import { describe, expect, it } from 'vitest';
import paths from '@/paths';

describe('paths', () => {
  it('builds topicShow', () => {
    expect(paths.topicShow('javascript')).toBe('/topics/javascript');
  });

  it('builds postCreate', () => {
    expect(paths.postCreate('javascript')).toBe('/topics/javascript/posts/new');
  });

  it('builds postShow', () => {
    expect(paths.postShow('javascript', 'abc123')).toBe(
      '/topics/javascript/posts/abc123'
    );
  });

  it('preserves slug formatting (does not encode)', () => {
    // App enforces slug validity upstream; paths should not mangle.
    expect(paths.topicShow('multi-word-slug')).toBe('/topics/multi-word-slug');
  });
});
