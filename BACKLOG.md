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

---

## Tier 1 — highest leverage

_All Tier 1 items have shipped. See Tier 2 for the next-best pick._

## Tier 2 — engagement & retention

- **In-app notifications** (L)
  When someone replies to a post or comment you authored, or upvotes
  your content. A `Notification` model, dropdown in the header,
  mark-as-read. No email yet — keep it self-contained.

- **Mentions** (M)
  `@username` autolinks to profile and sends a notification. Detect in
  markdown render and scan server-side on save.

- **Drafts via localStorage** (S)
  Auto-save the comment/post form contents keyed by route. No server
  work; survives accidental reloads.

## Tier 3 — content quality

- **Syntax highlighting on code blocks** (S)
  Code blocks already render through markdown — they just lack
  highlighting. Drop in Shiki or rehype-highlight via the existing
  Markdown wrapper. Big win for the dev-heavy seed topics
  (`javascript`, `web-dev`, `open-source`).

- **Comment sort options** (S)
  Currently implicit newest-first. Add top / old / new toggles; reuse
  the post-feed sort pill pattern. Top would use the new vote counts.

- **Word / char counters on forms** (S)
  Live counter against the Zod min/max under each textarea. Reduces
  "post failed" surprises.

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

_Last touched 2026-05-22 (after better-empty-states ship). Update or trash as priorities shift._
