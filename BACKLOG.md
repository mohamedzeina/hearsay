# Hearsay backlog

Curated feature ideas that fit the brand and the current shape of the app.
Sizes: **S** = a day or less, **M** = a few days, **L** = a week+.

## Brand constraints (don't violate)

- **No algorithmic feed.** Sort is always explicit.
- **Light moderation.** Tools assist; they don't gatekeep.
- **GitHub-only sign-in stays.** Accountability via account age; no PII collected.
- **Cream-and-persimmon aesthetic; respect `prefers-reduced-motion`.**

---

## Recently shipped (since last backlog touch)

- ✅ Voting on posts and comments (upvote-only), with "top" sort by vote count
- ✅ Reddit-style sign-in modal on protected actions (vote, reply, write a post, create a topic)
- ✅ Full test suite — Vitest unit + component, integration vs Docker Postgres, Playwright E2E (138 tests)
- ✅ Multi-persona seed with DiceBear avatars; idempotent reset on rerun
- ✅ Markdown rendering on posts and comments (react-markdown + remark-gfm, restricted); seed enriched with bold/lists/code-blocks/links/blockquotes
- ✅ Edit posts and comments — `editedAt` column, inline edit forms, and a muted "edited Xm ago" hint
- ✅ Comment permalinks — "copy link" button on every comment (top-level + nested) with smooth-scroll + flash on load
- ✅ User profile pages — `/u/[username]` with posts, recent replies, joined-on date, stats; indexed `User.username` (GitHub `login` on signin); clickable usernames across `PostCard` / `CommentCard` / `PostAuthor`
- ✅ Saved posts — bookmark button on `PostCard`, `/saved` page (newest-save first), header dropdown link, indexed `SavedPost` join table
- ✅ Better empty states — topics with zero posts show a "start the discussion" CTA card with the embedded post-create button; seed includes an empty topic to demo it
- ✅ Syntax highlighting on code blocks — `rehype-highlight` wired into the Markdown wrapper, custom cream-and-persimmon hljs theme for keywords/strings/comments/numbers
- ✅ Word / char counters on forms — every textarea gets a live `min N to post` / `current / max` counter; shared `form-limits.ts` keeps Zod schemas and UI in lockstep, counter flips persimmon-deep within the last 10% of the cap
- ✅ Drafts via localStorage — every create-form textarea (post, top-level comment, nested reply, topic modal) auto-saves to `hearsay:draft:*` keys, rehydrates on remount, and clears on successful submit; new `useDraft` hook is SSR-safe and tolerates disabled storage
- ✅ Comment sort options — Top / New / Old pill at the head of every comment thread (matches the post-feed sort pattern); top-level branches reorder client-side, nested replies keep their chronological subtree order; default is New
- ✅ In-app notifications (MVP) — `Notification` model + header bell with unread badge + dropdown of the 20 most-recent items; reply / upvote actions emit notifications inside the existing write transactions (self-actions skipped); mark-as-read fires optimistically on dropdown open. No live updates yet (refreshes on navigation); no dedicated `/notifications` history page yet; no mention-triggered notifications yet
- ✅ Notifications history page — dedicated `/notifications` route with the full history paginated at 10/page via `usePaginated`, per-row mark-read + "Mark all read" pill (matches the bell), bell footer now links here via a "See all →" link, "Notifications" entry added to the avatar dropdown
- ✅ Mentions — `@username` in post and comment markdown autolinks to `/u/<name>` (custom remark plugin via `mdast-util-find-and-replace`, code-context safe); a `MENTION` notification fires inside the existing create transactions, with self-mention skip, unknown-user skip, dedupe per write, and suppression of double-pinging a recipient who already got the reply notification
- ✅ Notifications filtering — All / Replies / Upvotes / Mentions pill row on `/notifications` (matches the comment-sort pill pattern); filters client-side, resets to page 1 on change, shows a filter-specific empty state when the active filter has no matches; pill row hidden when there are no items overall
- ✅ Mention autocomplete — typing `@` in a post or comment textarea opens a portaled dropdown of matching users (avatar + @username + display name); click / Enter / Tab inserts `@username `; `↑` / `↓` navigate, `Escape` closes; `GET /api/users/suggestions` (auth-gated, ≤6 rows, prefix-match case-insensitive) backs the lookup; dropdown is portaled to `document.body` and tracks scroll/resize so a `SurfacePanel`'s `overflow-hidden` can't clip it
- ✅ Notifications live polling — header bell polls `GET /api/notifications/recent` every 60s, pauses while the dropdown is open and while the tab is hidden, and fires an immediate refresh when the tab returns to visible; cadence overridable via `NEXT_PUBLIC_NOTIFICATIONS_POLL_MS` for local dev so the loop is testable without sitting and waiting a minute
- ✅ Topic following + Following tab — new `TopicFollow` join table (`@@unique(userId, topicId)` + `userId` index, cascades on both FKs); `toggleTopicFollow` action ($transaction find/delete-or-create, `revalidatePath('/')`); Follow/Following pill on each topic page header (optimistic via `useOptimistic`, auth-gated via signin modal); Following tab on the home post feed (signed-in viewers only, newest-first, dedicated empty state when you follow nothing); seed gives every persona 2–4 follows and the real owner 4 so the demo lands
- ✅ Feed scope nav (URL-driven, instant client-side swap) — Following is no longer a third sort pill; the home page renders a dedicated "Your feed" sidebar `SurfacePanel` (Everywhere / Following, persimmon left rail on the active row, quiet follow-count chip) plus a `lg:hidden` horizontal fallback above the feed. Both feeds are fetched server-side once (`Promise.all`); a `ScopeProvider` owns the client-side scope state so toggling between Everywhere and Following is a synchronous React state swap — no Next router involved, no recompile, instant. Scope clicks update the URL via `history.replaceState` (deep-links still work; `popstate` keeps browser back/forward in sync). Sort is sticky across scope swaps; `PostFeed` is scope-agnostic and gains `defaultSort` / `title` / `subtitle` / `emptyState` / `resetKey` props so per-scope copy + pagination reset come from the page.
- ✅ Bookmark save/unsave toast — editorial index-card toast in the bottom-right (`SurfacePanel`-family card with persimmon dot + mono uppercase eyebrow + display-font sentence + Undo affordance). Fires from `SaveButton` urgently — alongside the optimistic icon flip — so the confirmation lands in the same frame as the tap. `Saved · Tucked away in /saved.` / `Unsaved · Removed from /saved.`; auto-dismisses at 3.5s, hover pauses, Escape closes, Undo snap-dismisses (no exit animation lag). `SavedListContext` gained `restorePost` backed by a tombstone cache so unsaving on `/saved` + Undo restores the card at its original index — the provider stays mounted even when the list empties so an undo from the last-unsave still has somewhere to call back into. New `ToastProvider` + `useToast()` primitive is generic — single visible toast at a time, calling `show()` replaces (never stacks). Dropped `useOptimistic` from `SaveButton` because its setter has to run inside `startTransition`, which scheduled the icon flip one frame behind the urgent toast render; manual `pending ?? confirmed` pattern is on the urgent lane.
- ✅ Dark mode — "Hearsay at night" is warm charcoal (`#161210` page, `#241E1A` surface), not generic black; persimmon stays as the accent. Tailwind palette rewired to `rgb(var(--name-rgb) / <alpha-value>)` so a single `.dark` class on `<html>` swaps the entire theme while utilities like `bg-ink/40` and `border-persimmon/15` keep working. Topic-chip palette (8 tones × 3 shades = 24 tokens) gets a paired dark set with dark-tinted backgrounds + brighter pastel labels so each topic still reads as its own color. `ThemeProvider` + sun/moon `ThemeToggle` in the header, persisting to `hearsay:theme` in localStorage; an inline boot script in `<head>` applies the saved-or-system theme before paint so dark-preference users don't see a light flash. hljs syntax highlighting follows the var-driven swap without a separate ruleset. Modal backdrops switched from `bg-ink/40` (which would invert and lighten on dark) to `bg-black/40 dark:bg-black/60`.

---

## Tier 1 — highest leverage

_All Tier 1 items have shipped. See Tier 3 for the next-best pick._

## Tier 2 — engagement & retention

_Notifications polish complete: filtering on `/notifications` shipped, live polling on the bell shipped._

## Tier 3 — content quality

_Topic following shipped. No remaining Tier 3 items — see Tier 4+ for the next pick._

## Tier 4 — moderation (light-touch)

- **Report button** (S)
  On posts and comments. Writes a `Report` row with reason; admin sees
  it in `/admin`. No auto-action.

- **Soft-block / mute users** (S)
  Hide a user's content from your feed. Local to the viewer; no
  notification to the muted party.

## Tier 5 — polish

- **OG image generation per post** (S)
  `@vercel/og` for `/topics/[slug]/posts/[id]/opengraph-image.tsx`.
  Much better link previews when shared.

- **RSS feed per topic** (S)
  `/topics/[slug]/feed.xml` route. A signal the platform respects open
  standards.

- **Activity / read-state per post** (S)
  Local-only — mark posts as visited so the home feed can fade them
  slightly. No server tracking required.

## Tier 6 — infra & DX

- **CI pipeline running the full test pyramid** (S)
  `test:everything` already works locally. Wire it to GitHub Actions:
  spin up the Docker test PG, run unit + integration + E2E on every PR.

- **Coverage gate** (S)
  Vitest already supports `--coverage`. Add a threshold so PRs that
  drop coverage below the line fail CI.

---

## Later / maybe

Cross-posts; pinning; locking; multi-provider auth (intentionally
GitHub-only today); email digests; image uploads (real storage + cost);
live updates via SSE; mobile swipe gestures; analytics for authors; 2FA;
delegated topic moderators (separate philosophy choice from
light-touch).

## Explicitly out of scope

- Algorithmic / personalized "for you" feed.
- Engagement-maxing notifications ("you have 12 new things!" pile-on
  emails).
- Quote-retweet-style reposting that decontextualizes.
- Visible karma scores. Votes as a sort signal are fine; karma as a
  status game is the gateway drug to farming.
- Downvotes. Upvote-only is intentional — disagreement goes in replies.

---

_Last touched 2026-05-23 (after dark mode ship). Update or trash as priorities shift._
