'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Textarea, type TextAreaProps } from '@heroui/react';
import Avatar from '@/components/common/avatar';
import { findMentionTrigger } from '@/lib/find-mention-trigger';
import type { UserSuggestion } from '@/db/queries/users';

const DEBOUNCE_MS = 150;
const DROPDOWN_HIDE_AT_LENGTH = 0; // open as soon as `@` is typed

// Wraps HeroUI's Textarea and renders a positioned mention-autocomplete
// dropdown when the user types `@<query>` near the caret. Selecting a
// suggestion replaces the in-progress `@query` with `@username ` and
// places the caret right after the trailing space, so the user can
// keep typing without reaching for the mouse.
//
// Designed to be a drop-in for HeroUI Textarea: all standard textarea
// props pass through; only `value` + `onValueChange` are required since
// we mutate value when a suggestion is picked.

interface MentionTextareaProps
  extends Omit<TextAreaProps, 'value' | 'onValueChange'> {
  value: string;
  onValueChange: (v: string) => void;
}

const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  function MentionTextarea({ value, onValueChange, ...rest }, forwardedRef) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const taRef = useRef<HTMLTextAreaElement | null>(null);
    useImperativeHandle(forwardedRef, () => taRef.current as HTMLTextAreaElement);

    const [trigger, setTrigger] = useState<{
      start: number;
      query: string;
    } | null>(null);
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFetching, setIsFetching] = useState(false);
    // Portal target + measured dropdown position. The dropdown lives at
    // document.body so an ancestor with `overflow: hidden` (the post /
    // comment SurfacePanel) can't clip it.
    const [mounted, setMounted] = useState(false);
    const [anchor, setAnchor] = useState<{
      top: number;
      left: number;
      width: number;
    } | null>(null);
    useEffect(() => {
      setMounted(true);
    }, []);

    // Detect mention state from the textarea's caret. We read this on
    // every value change AND on cursor moves (click / arrow keys) so
    // the dropdown closes when the user navigates out of an in-progress
    // mention without typing.
    const recompute = useCallback(() => {
      const ta = taRef.current;
      if (!ta) return;
      const caret = ta.selectionStart ?? value.length;
      const before = value.slice(0, caret);
      const next = findMentionTrigger(before);
      setTrigger(next);
      if (!next) {
        setSuggestions([]);
        setActiveIndex(0);
      }
    }, [value]);

    // Recompute whenever value changes (most triggers come from typing).
    useEffect(() => {
      recompute();
    }, [recompute]);

    // Fetch suggestions for the current trigger query (debounced).
    useEffect(() => {
      if (!trigger || trigger.query.length < DROPDOWN_HIDE_AT_LENGTH) {
        setSuggestions([]);
        return;
      }
      const controller = new AbortController();
      setIsFetching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/users/suggestions?q=${encodeURIComponent(trigger.query)}`,
            { signal: controller.signal }
          );
          if (!res.ok) {
            setSuggestions([]);
            setIsFetching(false);
            return;
          }
          const data = (await res.json()) as { users: UserSuggestion[] };
          setSuggestions(data.users ?? []);
          setActiveIndex(0);
          setIsFetching(false);
        } catch (err) {
          if ((err as Error).name === 'AbortError') return;
          setSuggestions([]);
          setIsFetching(false);
        }
      }, DEBOUNCE_MS);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }, [trigger]);

    // Close on click outside the textarea + dropdown. The dropdown is
    // portaled to document.body, so we have to check BOTH the wrapper
    // and the dropdown ref — neither alone is a complete answer.
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          containerRef.current?.contains(target) ||
          dropdownRef.current?.contains(target)
        ) {
          return;
        }
        setTrigger(null);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Measure the wrapper's bounding rect so the portaled dropdown can
    // sit flush below it. Re-measure on scroll + resize so the dropdown
    // tracks if the page moves while it's open. useLayoutEffect avoids
    // a single frame of mis-positioning right after the trigger opens.
    const updateAnchor = useCallback(() => {
      const wrapper = containerRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      setAnchor({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }, []);

    useLayoutEffect(() => {
      if (!trigger) {
        setAnchor(null);
        return;
      }
      updateAnchor();
    }, [trigger, updateAnchor]);

    useEffect(() => {
      if (!trigger) return;
      const onScroll = () => updateAnchor();
      const onResize = () => updateAnchor();
      // `capture: true` so we catch scroll events from any scrolling
      // ancestor, not just window.
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('scroll', onScroll, true);
        window.removeEventListener('resize', onResize);
      };
    }, [trigger, updateAnchor]);

    const insertMention = (user: UserSuggestion) => {
      const ta = taRef.current;
      if (!ta || !trigger) return;
      const caret = ta.selectionStart ?? value.length;
      const before = value.slice(0, trigger.start);
      const after = value.slice(caret);
      const inserted = `@${user.username} `;
      const next = before + inserted + after;
      onValueChange(next);
      setTrigger(null);
      setSuggestions([]);
      // Restore caret to right after the inserted "@username " span on
      // the next tick — HeroUI re-renders the textarea between now and
      // when the DOM applies the new value.
      requestAnimationFrame(() => {
        const node = taRef.current;
        if (!node) return;
        const pos = trigger.start + inserted.length;
        node.focus();
        node.setSelectionRange(pos, pos);
      });
    };

    const open = !!trigger && suggestions.length > 0;
    const showEmptyHint = !!trigger && !isFetching && suggestions.length === 0;

    // HeroUI types Textarea's onKeyDown as KeyboardEvent<HTMLInputElement>
    // (shared with Input). Use the broader DOM keyboard event signature
    // so this handler can compose with either.
    const handleKeyDown = (e: {
      key: string;
      preventDefault: () => void;
    }) => {
      if (!trigger) return;
      if (!open) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setTrigger(null);
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) =>
          i <= 0 ? suggestions.length - 1 : i - 1
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        const picked = suggestions[activeIndex];
        if (picked) {
          e.preventDefault();
          insertMention(picked);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setTrigger(null);
      }
    };

    return (
      <div ref={containerRef} className="relative">
        <Textarea
          {...rest}
          ref={taRef}
          value={value}
          onValueChange={onValueChange}
          onKeyDown={(e) => {
            handleKeyDown(e);
            rest.onKeyDown?.(e);
          }}
          onClick={(e) => {
            // Click can move the caret without changing value, so re-check.
            recompute();
            rest.onClick?.(e);
          }}
          onKeyUp={(e) => {
            // Arrow keys / Home / End / etc. don't trigger value changes
            // but DO move the caret. Recompute so the dropdown closes
            // if the user navigates out of the mention.
            if (
              e.key === 'ArrowLeft' ||
              e.key === 'ArrowRight' ||
              e.key === 'Home' ||
              e.key === 'End'
            ) {
              recompute();
            }
            rest.onKeyUp?.(e);
          }}
        />
        {mounted &&
          (open || showEmptyHint) &&
          anchor &&
          createPortal(
            <div
              ref={dropdownRef}
              id="mention-suggestions"
              role="listbox"
              aria-label="Mention a user"
              style={{
                position: 'fixed',
                top: anchor.top,
                left: anchor.left,
                width: anchor.width,
              }}
              className="z-50 rounded-2xl border border-rule bg-surface shadow-lift-lg overflow-hidden rise"
            >
              {open ? (
                <ul className="max-h-64 overflow-y-auto py-1">
                  {suggestions.map((u, i) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        id={`mention-item-${i}`}
                        role="option"
                        aria-selected={activeIndex === i}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseDown={(e) => {
                          // mousedown (not click) so the textarea doesn't
                          // blur and dismount the dropdown before select.
                          e.preventDefault();
                          insertMention(u);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100 motion-reduce:transition-none ${
                          activeIndex === i
                            ? 'bg-cream-2'
                            : 'hover:bg-cream-2/60'
                        }`}
                      >
                        <Avatar user={u} size="sm" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-semibold text-ink truncate">
                            @{u.username}
                          </span>
                          {u.name && u.name !== u.username && (
                            <span className="block text-[11px] text-ink-2 truncate">
                              {u.name}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-3 text-xs text-ink-2">
                  No matches for{' '}
                  <span className="text-ink font-medium">
                    @{trigger?.query}
                  </span>
                </p>
              )}
            </div>,
            document.body
          )}
      </div>
    );
  }
);

export default MentionTextarea;
