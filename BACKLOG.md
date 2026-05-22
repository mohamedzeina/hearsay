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

---

## Tier 1 — highest leverage

_All Tier 1 items have shipped. See Tier 2 for the next-best pick._

## Tier 2 — engagement & retention

- **Notifications — live + filtering** (S→M)
  Follow-ups to the in-app notifications MVP + history page:
  - **Light polling** every ~60s on the bell so new items appear without
    a full navigation (S).
  - **Filtering** (replies vs. upvotes) on the `/notifications` page (S).

- **Mentions** (M)
  `@username` autolinks to profile and writes a notification (now that
  the notification system exists). Detect in markdown render and scan
  server-side on save.

## Tier 3 — content quality

- **Topic following + a "Following" tab on the home feed** (M)
  Follow a topic → its new posts surface in a `Following` view on home
  (still explicit, not algorithmic). Single join table; toggle on each
  topic page.

## Tier 4 — moderation (light-touch)

- **Report button** (S)
  On posts and comments. Writes a `Report` row with reason; admin sees
  it in `/admin`. No auto-action.

- **Soft-block / mute users** (S)
  Hide a user's content from your feed. Local to the viewer; no
  notification to the muted party.

## Tier 5 — polish

- **Dark mode** (M)
  CSS-var-driven theming is most of the way there already. Toggle in
  the header, persist in `localStorage`, swap a small set of hex values.

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

_Last touched 2026-05-22 (after notifications history page ship). Update or trash as priorities shift._
