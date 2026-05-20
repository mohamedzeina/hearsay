'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import paths from '@/paths';
import { topicTone } from '@/lib/utils';
import { IconSearch, IconReply } from '@/components/icons';
import type { SuggestionResult } from '@/db/queries/search-suggestions';

const EMPTY: SuggestionResult = { topics: [], posts: [] };
const DEBOUNCE_MS = 200;
const MIN_CHARS = 2;

export default function SearchInput() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState(searchParams.get('term') ?? '');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionResult>(EMPTY);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // Flat ordered list for keyboard navigation
  const items = [
    ...suggestions.topics.map((t) => ({
      kind: 'topic' as const,
      href: paths.topicShow(t.slug),
      data: t,
    })),
    ...suggestions.posts.map((p) => ({
      kind: 'post' as const,
      href: paths.postShow(p.topicSlug, p.id),
      data: p,
    })),
  ];

  const trimmed = value.trim();
  const showDropdown = focused && trimmed.length >= MIN_CHARS;
  const hasResults = items.length > 0;

  // Debounced suggestion fetch
  useEffect(() => {
    if (trimmed.length < MIN_CHARS) {
      setSuggestions(EMPTY);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/suggestions?term=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const result: SuggestionResult = await res.json();
        setSuggestions(result);
        setActiveIndex(-1);
        setIsLoading(false);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setSuggestions(EMPTY);
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback(() => {
    setFocused(false);
    setActiveIndex(-1);
  }, []);

  const goToFullSearch = useCallback(() => {
    router.push(`/search?term=${encodeURIComponent(trimmed)}`);
    handleSelect();
  }, [trimmed, router, handleSelect]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter explicitly regardless of dropdown state so the form
    // submit handler is never the load-bearing path.
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        router.push(items[activeIndex].href);
        handleSelect();
      } else if (trimmed) {
        e.preventDefault();
        goToFullSearch();
      }
      return;
    }

    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length === 0) return;
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (trimmed) goToFullSearch();
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <label
          className={`group flex items-center gap-2.5 h-10 px-3.5 rounded-full bg-surface transition-all duration-200 motion-reduce:transition-none ${
            focused
              ? 'ring-2 ring-persimmon/40 border border-persimmon/60 shadow-soft'
              : 'border border-rule hover:border-rule-2 shadow-soft'
          }`}
        >
          <IconSearch
            aria-hidden
            className={`w-4 h-4 transition-colors duration-200 motion-reduce:transition-none ${
              focused ? 'text-persimmon' : 'text-ink-2'
            }`}
          />
          <input
            ref={inputRef}
            name="term"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search posts, topics, people..."
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-3 focus:outline-none min-w-0"
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown && hasResults}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-activedescendant={
              activeIndex >= 0 ? `search-item-${activeIndex}` : undefined
            }
          />
          {value && (
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-ink-3 px-1.5 py-0.5 rounded border border-rule bg-cream-2/60">
              <span aria-hidden>&crarr;</span>
              <span>enter</span>
            </kbd>
          )}
        </label>
      </form>

      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-rule bg-surface shadow-lift-lg overflow-hidden z-40 rise"
        >
          {isLoading && !hasResults ? (
            <div className="px-4 py-3 text-xs font-mono uppercase tracking-[0.14em] text-ink-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-persimmon animate-pulse" />
              Searching the room&hellip;
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-ink-2">
                No matches for &ldquo;<span className="text-ink font-medium">{trimmed}</span>&rdquo;
              </p>
              <button
                type="button"
                onClick={goToFullSearch}
                className="mt-2 text-xs font-mono uppercase tracking-[0.12em] text-persimmon hover:underline"
              >
                See full search &rarr;
              </button>
            </div>
          ) : (
            <div className="max-h-[26rem] overflow-y-auto">
              {suggestions.topics.length > 0 && (
                <SectionHeader label="Topics" count={suggestions.topics.length} />
              )}
              {suggestions.topics.map((topic, i) => {
                const idx = i;
                const tone = topicTone(topic.slug);
                return (
                  <Row
                    key={topic.id}
                    id={`search-item-${idx}`}
                    href={paths.topicShow(topic.slug)}
                    active={activeIndex === idx}
                    onHover={() => setActiveIndex(idx)}
                    onSelect={handleSelect}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${tone.bg} ${tone.text}`}
                    >
                      #
                    </span>
                    <span className="flex-1 min-w-0 flex items-baseline gap-2">
                      <Highlight
                        text={topic.slug}
                        match={trimmed}
                        className="font-semibold text-ink lowercase truncate"
                      />
                      <span className="font-mono text-[10px] text-ink-2 shrink-0">
                        {topic.postCount} {topic.postCount === 1 ? 'post' : 'posts'}
                      </span>
                    </span>
                  </Row>
                );
              })}

              {suggestions.posts.length > 0 && (
                <SectionHeader label="Posts" count={suggestions.posts.length} />
              )}
              {suggestions.posts.map((post, i) => {
                const idx = suggestions.topics.length + i;
                const tone = topicTone(post.topicSlug);
                return (
                  <Row
                    key={post.id}
                    id={`search-item-${idx}`}
                    href={paths.postShow(post.topicSlug, post.id)}
                    active={activeIndex === idx}
                    onHover={() => setActiveIndex(idx)}
                    onSelect={handleSelect}
                  >
                    <span className="w-7 h-7 rounded-lg bg-cream-2 flex items-center justify-center shrink-0">
                      <IconReply className="w-3.5 h-3.5 text-ink-2" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <Highlight
                        text={post.title}
                        match={trimmed}
                        className="block text-sm font-medium text-ink truncate"
                      />
                      <span className="block text-[10px] font-mono mt-0.5">
                        <span className={`${tone.text} font-semibold lowercase`}>
                          #{post.topicSlug}
                        </span>
                        <span className="text-ink-3 mx-1">&middot;</span>
                        <span className="text-ink-2">
                          {post.replies} {post.replies === 1 ? 'reply' : 'replies'}
                        </span>
                      </span>
                    </span>
                  </Row>
                );
              })}

              <button
                type="button"
                onClick={goToFullSearch}
                onMouseEnter={() => setActiveIndex(-1)}
                className="w-full px-4 py-3 border-t border-rule text-xs font-mono uppercase tracking-[0.14em] text-ink-2 hover:bg-cream-2/50 hover:text-persimmon transition-colors duration-150 motion-reduce:transition-none flex items-center justify-between"
              >
                <span>See all results for &ldquo;{trimmed}&rdquo;</span>
                <span aria-hidden>&rarr;</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="px-4 pt-3 pb-1.5 flex items-baseline justify-between">
      <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-3">
        {label}
      </p>
      <span className="text-[10px] font-mono text-ink-3 num-plate">
        {count}
      </span>
    </div>
  );
}

interface RowProps {
  id: string;
  href: string;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
  children: React.ReactNode;
}

function Row({ id, href, active, onHover, onSelect, children }: RowProps) {
  return (
    <Link
      id={id}
      role="option"
      aria-selected={active}
      href={href}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`flex items-center gap-3 px-4 py-2 transition-colors duration-100 motion-reduce:transition-none ${
        active ? 'bg-cream-2' : 'hover:bg-cream-2/60'
      }`}
    >
      {children}
    </Link>
  );
}

/** Bold the matched substring within a label. */
function Highlight({
  text,
  match,
  className,
}: {
  text: string;
  match: string;
  className?: string;
}) {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(match.toLowerCase());
  if (idx === -1 || match.length === 0) {
    return <span className={className}>{text}</span>;
  }
  const before = text.slice(0, idx);
  const hit = text.slice(idx, idx + match.length);
  const after = text.slice(idx + match.length);
  return (
    <span className={className}>
      {before}
      <mark className="bg-persimmon-soft text-persimmon-deep px-0.5 rounded">
        {hit}
      </mark>
      {after}
    </span>
  );
}
