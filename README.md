# Hearsay

> *All opinions welcome. Even yours.*

A community discussion platform where every voice gets a thread — topics, posts, nested comments, upvotes, bookmarks, live search. Built with Next.js 15 App Router on React 19, Postgres, and a hand-tuned warm-modern design system.

**Live:** [hearsay-community.vercel.app](https://hearsay-community.vercel.app)

## Table of Contents

- [Features](#features)
  - [Feed scope nav](#feed-scope-nav)
- [Tech Stack](#tech-stack)
- [Design System](#design-system)
- [Architecture](#architecture)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)

## Features

### Authentication
- GitHub OAuth via NextAuth v5 (beta) with the Prisma adapter
- **Split-screen sign-in page**: oversized `hearsay.` wordmark, three numbered value props, a live topic-chip constellation pulled from the database, and an auth card whose GitHub button has a persimmon wash that sweeps up from the bottom on hover
- "Why only GitHub?" `<details>` disclosure with rotating chevron
- Real social proof (avatar stack + member count) from `db.user.count()`
- **Reddit-style sign-in modal** instead of redirects. Clicking any protected action (upvote, save, reply, write a post, create a topic) opens a centered modal with a single "Continue with GitHub" button and a contextual reason ("Sign in to upvote.", "Sign in to save posts.", "Sign in to start a topic.", …). Loading state on the GitHub button — the persimmon wash slides up and the label switches to "Connecting to GitHub…" with a spinner.

### Topics
- Create topics via a centered modal (Cancel + Create-topic footer bar, autofocus, slug-pattern validation `^[a-z-]+$`)
- Topic chips colored deterministically via `topicTone(slug)` — a hash of the slug maps to one of 8 muted palettes (terracotta, sage, plum, teal, mustard, periwinkle, rust, dusty rose). The same topic always renders in the same color across the entire app.
- Topic show page hero is washed in the topic's own tone with a soft radial bloom
- **Follow / unfollow** — each topic page renders a `FollowButton` pill in the hero (`+ Follow` → `✓ Following`). Optimistic via React 19's `useOptimistic` so the toggle flips immediately and auto-reverts on server rejection. Signed-out viewers see the standard sign-in modal with "Sign in to follow #[slug]." instead of being redirected away. Backed by a `TopicFollow` join table (`@@unique(userId, topicId)` so double-follows can't race; cascades on both FKs). **No public follower counts on profiles** — follow state is private to the viewer to keep popularity from becoming a status game.
- **Empty-state CTA** — when a topic has zero posts, the main column swaps the post list for a dashed `TopicPostsEmpty` card: persimmon-soft icon halo with `IconReply`, "Start the discussion in #[slug]" headline, a friendly nudge ("Drop the first one — a question, a hot take, or a half-formed thought."), and an embedded `PostCreateForm` button so the first post is one click away. The mobile-only top form is hidden in this state so the CTA reads as the single focal point.
- Sidebar list sorted by post count with hover-lift chips

### Posts
- Create posts inside a topic with title + content (large-variant HeroUI inputs)
- Per-topic-tone color band across the top of the post card
- Big serif headline, author avatar with ring, mono timestamp, hairline divider, generous-leading body
- Top/New sort tabs as a pill segmented control (star + clock icons); Top sorts by upvote count. Sort and **scope** are split — see [Feed scope nav](#feed-scope-nav) for how the "Following" view is surfaced as a sidebar destination rather than a third sort pill.
- 5-per-page pagination via a shared `usePaginated` hook
- Full-text search across title and content
- Owner-only delete with two-stage inline confirm (no browser dialogs)
- **Owner-only inline edit**: a small pencil button appears next to the title; clicking swaps the title and body for a validated form ("Tidy up · not rewrite"). Saves stamp `editedAt`; a muted "edited Xm ago" pip appears in the meta row.
- **Live char counters under every textarea** — `min N to post` while the field is too short, `1,234 / 10,000` once you're past the minimum, flipping to persimmon-deep within the last 10% of the cap. Limits live in `src/lib/form-limits.ts` (10k post / 5k comment / 280 description) and both the Zod schemas and the UI import from there, so the two never drift.
- Empty state cards with persimmon-soft icon halo

### Feed scope nav
- **"Following" is a scope, not a sort.** The home feed splits two independent axes: *sort* (Top / New, lives in component state) and *scope* (Everywhere / Following, lives in the URL as `?view=following`). They render in different controls so the pattern can't be mistaken for a three-way sort.
- **Sidebar "Your feed" panel** (`src/components/feed-nav/feed-nav.tsx`) — `SurfacePanel` with two vertical rows ("Everywhere" / "Following"), each row showing a label + hint ("All of Hearsay" / "Topics you follow"). The active row gets a persimmon left rail (`border-l-2 border-persimmon`) and a cream-2 wash; a small `bg-persimmon-soft text-persimmon-deep` count chip sits next to "Following" when the viewer follows ≥ 1 topic.
- **Mobile fallback** (`src/components/feed-nav/feed-nav-mobile.tsx`) — gated by `lg:hidden`, the sidebar gives way to a horizontal pill strip above the feed (same cream-2 track + `shadow-soft` active pill as the sort control beneath it).
- **URL is authoritative**: `paths.home({ view })` returns `/` or `/?view=following`. The home page reads `searchParams.view` server-side and only fetches the matching query (`fetchRecentPosts` *or* `fetchFollowingPosts`, never both).
- **Signed-out + `?view=following` silently redirects to `/`** so a stray link from a logged-out tab can't render an empty "follow some topics" prompt.
- **Per-scope defaults**: Everywhere defaults to Top sort with the standard "Top discussions / Most upvotes first" header; Following defaults to **New** with "From topics you follow / Scoped to your follows" and a dedicated "Nothing in your follows yet" empty card.
- **`PostFeed` is scope-agnostic**: only Top/New sort pills remain in the component; the page passes `defaultSort` / `title` / `subtitle` / `emptyState` per scope.

### Saved posts
- **Bookmark button** in the top-right corner of every `PostCard` (`absolute top-3 right-3`). `IconBookmark` toggles between outline (unsaved) and filled persimmon (saved); `aria-pressed`/`aria-label` swap between "Save post" and "Unsave post".
- **Bookmark also on the post detail page** — same `SaveButton` (size `md`) sits at the right end of the post's action row, opposite the upvote count.
- **Optimistic toggle via React 19's `useOptimistic`** — the in-flight icon state layers on top of the server-confirmed state and auto-reverts on failure, no manual rollback bookkeeping. Click bubbling is suppressed so the bookmark never triggers the card's outer `<Link>`.
- **Auth-gated** via the standard sign-in modal — signed-out users see "Sign in to save posts." instead of being redirected away.
- **`/saved` page** (auth-required; unauthenticated users redirect to signin with a `callbackUrl=/saved`) lists every bookmarked post newest-save-first, reusing `PostCard`. Paginates 5 at a time via the shared `usePaginated` hook; the underlying query caps at the 100 most-recent saves (`SAVED_POSTS_LIMIT`) so the round-trip stays bounded. Empty state shows a centered `IconBookmark` halo with "Nothing saved yet" + "Tap the bookmark on any post and it'll land here, in the order you saved them." and a "Browse posts →" CTA.
- **Unsaving on `/saved` drops the card immediately.** A small `SavedListContext` lets `SaveButton` tell the page-level list to remove the post on toggle-off; the list mutation runs *outside* `startTransition` so React treats it as urgent and the card disappears in the same frame. The toggle action also `revalidatePath('/saved')` to bust the Next.js Router Cache when you unsave somewhere else.
- **Header dropdown link**: the user-menu dropdown gains a "Saved posts" entry above sign-out so the page is reachable from anywhere.
- Backed by a `SavedPost` join table with `@@unique([userId, postId])` (prevents double-saves at the DB level) and `@@index([userId])` (cheap `/saved` listing). Toggle action wraps find/delete-or-create in a Prisma `$transaction`.
- Each post query also surfaces a viewer-aware `saves: { id: string }[]` (same pattern as `votes`), so the bookmark renders in the correct state on first paint without a follow-up roundtrip.

### User profiles
- `/u/[username]` route with a decorated header (avatar, name, `@username`, joined-on month, two-up stats), the user's 20 most-recent posts (reusing `PostCard`), and a sticky "Recent replies" sidebar that backlinks each comment to its source post via `paths.postShow(...) + '#c-{id}'`
- **Indexed `User.username` lookup** — `@unique` Postgres index, O(1) `db.user.findUnique({ where: { username } })`; no slug-scanning
- **GitHub login → Hearsay username** wired in the `profile()` callback on `src/auth.ts` — new signins land at `/u/<github-login>` automatically. Legacy rows that pre-date the column are backfilled by a `events.signIn` hook that only writes when `username` is currently `null`, so a later GitHub rename can't silently steal someone's profile URL.
- **`slugifyName` fallback** for legacy rows that pre-date the `username` column (rare path; mostly cosmetic)
- **Clickable author attribution everywhere**: `AuthorChip` (client primitive) inside `<Link>`-wrapped cards like `PostCard`, plus direct Next `<Link>` wrapping in `CommentCard`, `PostAuthor`, and `PostEditable`. All four resolve `user.username` first, slugify the name as a fallback.

### Comments
- Threaded replies (nested via `parentId`)
- Each comment is its own bordered card with an avatar column
- **Collapse rail**: the thin column between avatar and replies is a clickable pill that toggles a "+ show replies" footer for the subtree
- Soft delete for comments with children — renders `[comment deleted]` to preserve thread context; childless deletes hide entirely
- Instant client UI on delete; counts in the header exclude soft-deleted comments
- **Owner-only inline edit**: pencil button alongside Delete swaps the markdown body for a Textarea form; saves stamp `editedAt` and surface a "edited Xm ago" hint next to the timestamp
- **Per-comment permalink**: every comment — top-level or nested — wraps in an `id="c-{id}"` anchor with the `comment-anchor` class. A "Link" button (with `IconLink` / `IconCheck` swap) on every card copies `<post-url>#c-{id}` via `navigator.clipboard.writeText`, flips to "Copied" for 1.5s, and swallows clipboard failures silently. Loading the URL with that hash smooth-scrolls to the comment and triggers the existing 1.8s persimmon `:target` flash. `html { scroll-behavior: smooth }` is set globally with a `prefers-reduced-motion` opt-out.
- **Thread sort pill** (Top / New / Old) sits at the head of every comment list, matching the post-feed sort pattern (star / clock / counterclockwise-arrow icons; active tab on a cream `shadow-soft` pill). Default is **New** — newest top-level branches first. **Top** orders by `_count.votes` descending and tie-breaks newer-first so the ordering is stable; **Old** reverses to oldest-first. **Only top-level branches reorder** — nested replies always read top-to-bottom within their parent's subtree, so threads stay coherent. The underlying `fetchCommentsByPostId` query carries an explicit `orderBy: createdAt asc` so the natural fetch order isn't dependent on Postgres row order. Sort happens client-side via the same `useMemo` pattern as the post feed.

### Markdown rendering
- Post bodies and comments render through `react-markdown` + `remark-gfm` + `rehype-highlight`
- Restricted allowlist: **bold, italic, links, ordered/unordered lists, inline + fenced code, blockquotes, tables**; raw HTML and images are dropped
- External links auto-set `target="_blank" rel="noopener noreferrer nofollow"`
- Code blocks use the cream-2 / mono stack; inline code gets a softer pill
- **Syntax highlighting** on fenced code blocks via `rehype-highlight` (highlight.js). Language is taken from the fence tag (` ```js `, ` ```json `, ` ```bash `), with `detect: true` falling back to auto-detection for unlanguaged blocks. Themed in `globals.css` with `.hljs-*` token classes mapped to the brand palette — keywords/tags/titles in persimmon-deep, strings/built-ins/types in teal, numbers/literals in persimmon, comments in ink-3 italic, params/variables in ink-2. Inline code keeps the pill style untouched (selectors are scoped to `.hljs`).
- Two prose variants: `body` (generous leading, used on post show) and `comment` (tighter, zero-margin paragraphs)
- Post card previews use `stripMarkdown()` so the line-clamped excerpt doesn't show raw syntax

### Drafts
- **Every create-form textarea auto-saves to `localStorage`** — post composer (`/topics/[slug]/posts/new`), top-level comment box, nested reply box, and the topic-create modal. Refresh, close the tab, or navigate away mid-thought — the next time the same form mounts, your text is already there.
- **Scoped keys** under a single `hearsay:draft:*` namespace: `post:<slug>:title`, `post:<slug>:content`, `comment:<postId>`, `reply:<parentId>`, `topic:name`, `topic:description`. Drafts never bleed across topics, posts, or reply threads.
- **Clears on successful submit** — once the server action returns `ok`, the matching draft entry is removed so the next post starts blank.
- **Edit forms are intentionally excluded** — published content shouldn't shadow itself with a ghost draft after a cancelled edit. Cancel discards.
- Backed by a small `useDraft` hook (`src/lib/use-draft.ts`) that's SSR-safe (initial render always matches server output; rehydration runs in a post-mount effect), debounce-free (writes synchronously per keystroke — small payloads, no perceivable cost), and silently survives a disabled or quota-full `localStorage` (Safari private mode, etc.). Empty strings remove the entry rather than persisting `""`, so cleared drafts don't litter storage.

### Notifications
- **Header bell with an unread badge** — pinned next to the user menu (only when authed). Persimmon dot count caps at `99+` to keep the chip a single character wide. Click opens a dropdown of the **20 most-recent notifications**, scoped to the viewer.
- **Dedicated `/notifications` history page** — full history paginated 10-per-page via `usePaginated`, reachable from the bell's "See all →" footer link and the avatar dropdown. Cards mirror the bell row layout (avatar + verb + post title) at a slightly larger scale.
- **Filter pills on `/notifications`** — `role="tablist"` row above the list with **All / Replies / Upvotes / Mentions** (matches the comment-sort pill pattern: cream-2 track, `shadow-soft` pill for the active tab, small icon glyph + text). Filters client-side via a `useMemo` over `items`, resets to page 1 on change, and shows a filter-specific empty state ("No replies to show yet.") when the active filter has no matches. The "Mark all read" pill stays scoped to all items (not just the filtered view) so accidental scoping bugs can't leave you with persistent unread rows behind a hidden tab. Hidden entirely when the list is empty.
- **What triggers a notification:** someone replies to your post (top-level comment), replies to your comment (nested), upvotes your post, or upvotes your comment. The notification is written inside the **same Prisma `$transaction`** as the originating reply / vote, so a write-and-notify never half-succeeds.
- **Self-actions never notify** — you don't get a bell for replying to or upvoting your own content. Checked at write time in every emission path.
- **`kind` discriminates the verb** — five values (`REPLY_TO_POST`, `REPLY_TO_COMMENT`, `UPVOTE_POST`, `UPVOTE_COMMENT`, `MENTION`) so the dropdown can render "replied to your post" / "replied to your comment" / "upvoted your post" / "upvoted your comment" / "mentioned you" without a runtime lookup of the parent. Comment-kind and MENTION rows prefix the post title with "in" so the secondary line reads as location, not subject.
- **Deep-link to source** — comment-targeted notifications navigate to `/topics/<slug>/posts/<id>#c-<commentId>`, riding the existing comment-anchor smooth-scroll + `:target` flash so you land directly on the thread that triggered it. Both the bell and the history page use a plain `<a>` (not Next's `<Link>`) so the browser's native hash-anchor scroll fires after the target comment has hydrated.
- **Mark-as-read is per-row, optimistic** — clicking a row clears its own dot + decrements the badge in `useTransition`, then the server `updateMany`s that one row scoped to the viewer. An explicit **"Mark all read"** pill in the dropdown header (and on the history page) bulk-clears every unread row when you want it. Opening the bell never auto-clears — read state is intentional, not a side-effect of glancing.
- **Cross-component coordination via a window-event bus** (`src/lib/notifications-bus.ts`) — the bell sits in the root layout, the `/notifications` list sits in the page subtree, so they can't share React state directly. The list dispatches `hearsay:notification-read` (per row) and `hearsay:notifications-all-read` (bulk) `CustomEvent`s; the bell listens and decrements its badge in the same frame, before the user even navigates. Unidirectional (list dispatches, bell listens) so there's no feedback loop.
- **Light polling on the bell** — `GET /api/notifications/recent` returns the same `{ items, unread }` shape the layout's server component computes. The bell client refetches every 60s via `setInterval`, pauses while the dropdown is open (no rug-pull mid-interaction) and while `document.visibilityState !== 'visible'` (no useless traffic for a backgrounded tab), and fires an **immediate** refresh on `visibilitychange → visible` so users see fresh state the moment they switch back. Cadence is overridable via `NEXT_PUBLIC_NOTIFICATIONS_POLL_MS` (min 1000ms) so dev can drop it to e.g. `3000` in `.env.local` and not sit around waiting a full minute for the loop to fire.
- Backed by a `Notification` model with `(recipientId, createdAt desc)` and `(recipientId, readAt)` indexes for the recent-list and unread-count queries respectively. The model cascades on the post and comment FKs, so deleting a post / comment cleans up its notifications.

### Mentions
- **`@username` is a real link** in any post or comment body. A custom remark plugin (`src/lib/remark-mentions.ts`, using `mdast-util-find-and-replace`) walks the mdast tree before render and replaces `@name` text with a `link` node pointing at `/u/<name>`. The Markdown `a` override detects mention links by href shape and renders them as a Next/Link with mention-specific styling (persimmon semibold, no `target=_blank`, no underline-by-default).
- **Code is honoured** — fenced blocks and inline code never get mention-wrapped, because `findAndReplace` only touches text-position children and we explicitly `ignore: ['link', 'linkReference']` so a markdown link containing `@user` isn't double-wrapped either.
- **Server-side scan on create** — `createPost` and `createComment` run the same regex against the raw markdown (after stripping fenced + inline code) and emit a `MENTION` notification per mentioned user inside the existing `$transaction`. Self-mentions are skipped. Unknown usernames are skipped (we look them up by `User.username` first). The same recipient is never double-pinged within a single write — if a reply already notifies the parent author, a `@parent` in the same content suppresses the mention.
- **Notify on create only** — edits don't re-emit notifications even if they introduce new mentions, matching Twitter / Reddit. Keeps the system from being weaponizable for badge spam.
- **Username pattern matches GitHub** — first char alphanumeric, then up to 38 more alphanumeric / hyphens (39 total). A negative lookbehind on `\w` / `@` rules out email addresses (`foo@bar.com` doesn't match) and chained at-signs.
- **Autocomplete dropdown while typing** — `MentionTextarea` wraps HeroUI's `Textarea` on every post + comment create form. Typing `@` opens a popover of up to 6 users (avatar + `@username` + display name); the caret-side trigger detector (`src/lib/find-mention-trigger.ts`) shares the same first-char-alphanumeric + `\w`/`@` email-guard rules as the renderer, so what triggers the dropdown is exactly what the renderer will autolink. Picks insert `@username ` (trailing space, caret parked right after it); `↑` / `↓` navigate, `Enter` / `Tab` select, `Escape` closes. Backed by `GET /api/users/suggestions?q=<prefix>` (auth-gated, prefix-match case-insensitive, `USER_SUGGESTION_LIMIT = 6`, bare-`@` returns recent joiners). The dropdown is portaled to `document.body` and absolute-positioned against the textarea wrapper's `getBoundingClientRect()` so the post / comment `SurfacePanel`'s `overflow-hidden` can't clip it; re-anchors on `scroll` (capture phase) + `resize` so it tracks if the page moves while open.

### Voting
- **Upvote-only** on posts and comments — disagreement goes in replies; no karma scores
- Optimistic toggle: state flips immediately on click; rolls back if the server rejects
- Unvoted: outline arrow, ink-2 text, persimmon-soft hover. Voted: filled arrow, scale-up, persimmon-soft fill, persimmon-deep text
- Two sizes: `sm` on cards and comment rows, `md` on the post show page
- Vote counts use the `.num-plate` class (tabular numerals) so the digit width doesn't jitter as the count changes
- Click while signed out → opens the sign-in modal with the reason "Sign in to upvote." rather than redirecting away
- Server toggles run inside a Prisma `$transaction` for atomic create/delete + count

### Post Detail (Two-Column View)
- **Main column**: post card → reply form → comment thread
- **Sticky sidebar**:
  - **Author card** — avatar, "writes on hearsay" label, two-up stats grid (posts / replies) using real database counts
  - **Thread map** — numbered list (01, 02, …) of top-level comments. Click a row → anchor jumps to that comment via `#c-{id}`, smooth-scrolls, and triggers the persimmon `:target` flash. (The same anchor pattern now backs the per-comment copy-link button.)
  - **Related posts** — top 4 other recent posts in the same topic with an "all →" link
  - "Jump to reply" anchor pill at the bottom
- Each sidebar panel streams independently via its own Suspense boundary

### Live Search
- Header search with a **suggestions dropdown** that appears after 2+ characters
- Debounced (200ms) request to `/api/search/suggestions` which queries `Topic.slug` and `Post.title/content` in parallel, capped to 4 + 5
- Two sections (Topics / Posts), each with a count badge in the header
- **Matched substring highlighted in persimmon** inside the labels
- Keyboard nav: `↑/↓` move through items (wraps), `Enter` selects highlighted item or submits to full search, `Escape` closes
- Proper ARIA combobox semantics (`role="combobox"`, `aria-controls`, `aria-activedescendant`)
- Full search page leads with a serif "Results for «term»" line where the query sits in a persimmon-soft marker highlight

### UX & Motion
- Streaming UI via Suspense — post card, comment list, and sidebar panels load independently
- Custom 404 page with hand-drawn underline
- Route-level loading skeletons for `/`, `/saved`, `/search`, `/auth/signin`, `/topics/[slug]`, `/topics/[slug]/posts/[postId]`, and `/u/[username]` (all declare `'use client'` so HeroUI's `Skeleton` works under Turbopack)
- Subtle animations: `.rise` (fade + slide-up), `.dot-live` (persimmon glow pulse), `.ink-link` (hover underline reveal), `:target` flash on anchor arrival, bouncy logo period on hover, rotating `+` glyph on the topic-create trigger
- Global smooth scroll for hash-jumps (used by the thread map and comment permalinks); disabled under `prefers-reduced-motion`
- All animations honor `prefers-reduced-motion`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.1 (App Router, Turbopack dev) |
| Runtime | React 19 |
| Language | TypeScript 5 (strict) |
| Database | PostgreSQL (Neon) via Prisma 5.11 |
| Auth | NextAuth v5 (beta 25) + GitHub OAuth + Prisma adapter |
| UI | HeroUI 2.7+ + Tailwind CSS 3.4 |
| Fonts | Plus Jakarta Sans + JetBrains Mono (`next/font/google`) |
| Validation | Zod 3.22 |
| Motion | Framer Motion 11 |
| Markdown | react-markdown 10 + remark-gfm 4 + rehype-highlight 7 (restricted allowlist, hljs-themed code blocks) |
| Testing | Vitest 3.2 + React Testing Library + Playwright 1.60 |

## Design System

A self-built "warm community modern" design system — ivory paper background, ink text, one persimmon accent.

### Tokens (Tailwind extensions)

| Token | Hex | Use |
|---|---|---|
| `cream` | `#FAF7F2` | Page background |
| `cream-2` | `#F2EDE3` | Input fill, hover |
| `surface` | `#FFFFFF` | Cards |
| `ink` | `#1A1614` | Primary text |
| `ink-2` / `ink-3` | `#5C544E` / `#A8A29E` | Secondary / tertiary text |
| `rule` / `rule-2` | `#EAE4D7` / `#DDD5C5` | Borders |
| `persimmon` | `#E5533D` | The accent — CTAs, focus rings, highlights |
| `persimmon-soft` / `persimmon-deep` | `#FBE8E3` / `#C2402B` | Soft fill / strong hover |
| `teal` / `teal-soft` | `#0F6E64` / `#DDEFEC` | Secondary accent |

Three semantic shadows: `shadow-soft` (1px lift), `shadow-lift` (4-12px), `shadow-lift-lg` (modals). Plus `shadow-inset-rule` for hairline insets.

CSS custom properties are exposed in `globals.css` (e.g. `--nav-h: 4rem` so the header height has a single source of truth that sidebars can offset from with `top-[calc(var(--nav-h)+2rem)]`).

**HeroUI focus ring is themed to persimmon** via `heroui({ themes: { light: { colors: { focus: '#E5533D' } } } })` in `tailwind.config.ts`. The on-focus border-persimmon (mouse) and the on-focus-visible ring (keyboard) share a colour and read as one designed indicator — instead of HeroUI's default blue layered on top.

### Primitives

- **`Avatar`** (`src/components/common/avatar.tsx`) — single component covering image and fallback-initial variants. Sizes `xs`/`sm`/`md`/`lg`, optional `tone` for topic-colored backgrounds, configurable ring.
- **`SurfacePanel`** (`src/components/common/surface-panel.tsx`) — polymorphic card with `as` (section/article/aside) and `size` (md = `rounded-2xl` sidebars, lg = `rounded-3xl` content). Single source of truth for bordered surfaces.
- **`PostCard`** (`src/components/posts/post-card.tsx`) — shared by feed, topic list, search, profile, and `/saved`; reveals a persimmon left rail on hover and hosts the top-right bookmark.
- **`VoteButton`** (`src/components/votes/vote-button.tsx`) — optimistic upvote toggle with auth-gate via signin modal.
- **`SaveButton`** (`src/components/posts/save-button.tsx`) — optimistic bookmark toggle with the same auth-gate. Safe to nest inside `<Link>`-wrapped cards (intercepts clicks). Rendered on every card AND on the post detail page action row.
- **`SignInPromptProvider`** (`src/components/auth/signin-prompt.tsx`) — Context-based modal trigger. Any client component calls `useSignInPrompt().open(reason)` to surface the auth modal without losing the user's place.
- **`FormButton`** — ink pill with built-in `useFormStatus()` spinner and "Working…" state.
- **`FormError`** — accessible `role="alert"` error banner.
- **`CharCounter`** (`src/components/common/char-counter.tsx`) — live `current / max` counter for write forms. Three states (below-min hint, in-range muted, ≥90% persimmon-deep). `aria-live="polite"` so screen readers announce updates without interrupting.
- **`DeleteButton`** — trash icon → inline persimmon "Are you sure?" pill with Yes/Cancel.
- **`Markdown`** (`src/components/common/markdown.tsx`) — `react-markdown` + `remark-gfm` + `rehype-highlight` wrapper with `body` and `comment` variants. Strict allowlist; no raw HTML; external links auto-set `target="_blank" rel="noopener noreferrer nofollow"`. Highlight tokens themed in `globals.css` to the cream-and-persimmon palette.
- **`AuthorChip`** (`src/components/common/author-chip.tsx`) — client primitive that's safe to render inside an outer `<Link>` (renders as `<button>`, intercepts clicks, navigates via `router.push`). Resolves `user.username` → falls back to `slugifyName(user.name)` → renders inert text if both are missing.
- **`FeedNav`** (`src/components/feed-nav/feed-nav.tsx`) — client primitive for the home page's URL-driven scope switch. Reads `useSearchParams()` to compute the active scope, wraps a `SurfacePanel` titled "Your feed", and renders an `<ul>` of `<Link>` rows ("Everywhere" / "Following"). Active row picks up `border-l-2 border-persimmon bg-cream-2/70`; a quiet `bg-persimmon-soft text-persimmon-deep` chip surfaces the viewer's follow count next to "Following" when it's > 0. Mounted only for signed-in viewers.
- **`FeedNavMobile`** (`src/components/feed-nav/feed-nav-mobile.tsx`) — `lg:hidden` horizontal pill strip rendered above the feed on small screens. Same `useSearchParams` active-state logic as `FeedNav`, same `bg-surface text-ink shadow-soft` active pill as the sort control immediately beneath it.
- **`NotificationsBell`** (`src/components/notifications/notifications-bell.tsx`) — client primitive rendering the bell, unread badge (caps at `99+`), and dropdown. Per-row mark-read on click, explicit "Mark all read" pill in the header, "See all →" footer link to `/notifications`. Reconciles optimistic local-unread state with server-rendered props via `useEffect`. Server fetch is in a sibling `notifications.tsx` server component that gates on `getViewerId()`.
- **`NotificationsList`** (`src/components/notifications/notifications-list.tsx`) — client primitive for `/notifications`. Same mark-read + mark-all interactions as the bell; paginates via `usePaginated` at 10/page using the shared `PostPagination` chrome. Hosts the **All / Replies / Upvotes / Mentions** filter pill row — a kind-set lookup (`FILTER_KINDS`) maps each filter to the notification kinds it covers, the active filter narrows `items` via `useMemo`, and a filter swap snaps the page index back to 1 so the user lands on real content.
- **Icons** (`src/components/icons.tsx`) — shared `IconReply`, `IconSearch`, `IconChevronDown`, `IconChevronRight`, `IconPencil`, `IconPlus`, `IconSignOut`, `IconSpinner`, `IconLink`, `IconCheck`, `IconBookmark` (accepts a `filled` prop for the saved state), `IconBell`.
- **`topicTone(slug)`** (`src/lib/utils.ts`) — deterministic hash → 1 of 8 muted color triples (bg / text / dot).
- **Form classNames** (`src/lib/form-classes.ts`) — `inputClassNames`, `inputClassNamesLg`, `textareaClassNamesLg` for consistent HeroUI styling. Focus state is just `border-persimmon` + `bg-surface`; the ring is themed at the HeroUI plugin level so no per-component override is needed.
- **Form limits** (`src/lib/form-limits.ts`) — `POST_TITLE`, `POST_CONTENT`, `COMMENT_CONTENT`, `TOPIC_DESCRIPTION` `{ min, max }` constants. Imported by both server actions (Zod) and form components (`CharCounter`) so a number change only happens in one place.
- **`usePaginated`** (`src/lib/use-paginated.ts`) — shared client pagination hook returning `{ page, setPage, totalPages, paginated }`.
- **`useDraft`** (`src/lib/use-draft.ts`) — client hook that mirrors a textarea's value into `localStorage` under a `hearsay:draft:<key>` entry. Returns `{ value, setValue, clear }`. SSR-safe (initial state is always `''`; rehydration runs in a post-mount effect to keep server and first client render identical), `try/catch`-wrapped around storage access so disabled / quota-full storage degrades silently, and removes the entry on empty rather than persisting `""`.

## Architecture

- **Server Components** handle all data fetching — posts, comments, topics, suggestions, saved-posts listing, and auth resolve on the server before streaming.
- **Next 15 async dynamic APIs**: every dynamic route (`/topics/[slug]`, `/topics/[slug]/posts/[postId]`, `/u/[username]`, `/search?term=…`) receives `params` / `searchParams` as Promises and `await`s them at the top of the page. The home page (`/`) likewise treats `searchParams` as a Promise and reads `view` server-side to resolve the feed scope. The one client-component dynamic route (`/topics/[slug]/posts/new`) unwraps with `React.use(params)`.
- **Client Components** are scoped to interactivity only: form state, sort toggles (post feed AND comment threads), delete confirmation, search dropdown, modal state, vote toggling, save toggling, comment-card permalink/edit UI.
- **React 19 form hooks**: form actions use `useActionState` (renamed from `useFormState`); pending button states use `useFormStatus` from `react-dom`. The `SaveButton` uses `useOptimistic` for in-flight bookmark state — the overlay auto-reverts on action failure, so there's no manual rollback branch. The `SavedListContext.removePost` call runs *outside* `startTransition` so React schedules the urgent list mutation in the same frame as the click (a transition-scoped state update would visibly linger for a frame).
- **Server Actions** (`'use server'`) handle every mutation: `createPost`, `editPost`, `deletePost`, `createTopic`, `createComment`, `editComment`, `deleteComment`, `togglePostVote`, `toggleCommentVote`, `toggleSavedPost`, `markNotificationRead` (per-item), `markAllNotificationsRead` (bulk). All write actions go through Zod validation and `requireAuth()`; edits additionally check ownership and stamp `editedAt`. Toggle actions wrap their find/upsert in a Prisma `$transaction`. `toggleSavedPost` calls `revalidatePath('/saved')` so the bookmark page stays in sync after toggles on the feed. `createPost`, `createComment`, `togglePostVote`, and `toggleCommentVote` additionally **emit `Notification` rows inside the same transaction** (skipped for self-actions) so a successful reply / upvote / mention and its notification are atomic. `createPost` and `createComment` also scan their content for `@mentions` and emit `MENTION` rows in the same transaction, with same-recipient de-dup against the reply notification.
- **Suspense boundaries** on the post detail page stream the post, comments, author card, thread map, and related posts in parallel.
- **Request memoization** via React `cache()` deduplicates `fetchPostById`, `fetchCommentsByPostId`, `fetchUserProfileByUsername`, `fetchRecentNotifications`, `fetchUnreadNotificationCount`, and `fetchAllNotifications` when multiple components in the same render need them.
- **Soft delete** on comments preserves thread context — comments with replies become `[deleted]`; childless ones disappear entirely.
- **Vote and save queries are viewer-aware**: every post include uses `votes: { where: { userId: viewerId }, take: 1 }` and `saves: { where: { userId: viewerId }, take: 1 }` so the UI knows the viewer's vote/save state without a round-trip. Unauthenticated viewers pass an empty-string sentinel so the filter never matches.
- **Auth gating via Context modal**, not redirects: protected client buttons (upvote, save, reply, write a post, create a topic) call `useSignInPrompt().open()` instead of `router.push('/auth/signin')`, keeping the user on their current page. Server-rendered protected pages (`/saved`) still redirect with a `callbackUrl` so post-signin brings the user back.
- **URL-as-state for feed scope**: the home page reads `searchParams.view` server-side and only fetches the matching query (`fetchRecentPosts` or `fetchFollowingPosts`) — never both. `FeedNav` and `FeedNavMobile` are pure clients on the same URL: they read `useSearchParams()`, mark the active row, and link to `paths.home({ view })`. Signed-out viewers with `?view=following` are short-circuited with a server `redirect(paths.home())` so the empty-follows card never renders out of context.
- **Comment anchors are unified**: `CommentShow` wraps every recursive comment in `<div id="c-{id}" className="scroll-mt-24 comment-anchor">`, so both the sidebar thread map and the per-comment copy-link button hit the same `:target`-flash code path regardless of nesting depth.
- **Username resolution is single-pass and indexed**: `User.username` is unique-indexed so profile lookups go through `findUnique` (O(1)) rather than scanning slugified names. The GitHub OAuth `profile()` callback in `src/auth.ts` is augmented (via `declare module 'next-auth'`) so the Prisma adapter forwards `profile.login` straight into the column on first signin. An `events.signIn` hook backfills legacy rows once — but only when `username` is currently `null`, so a later GitHub rename can't silently steal an existing profile URL.
- **Turbopack in dev**: the `dev` script runs `next dev --turbopack`. Turbopack emits standard JS (no `eval()`-wrapped bundles), so CSP-strict browsers like Brave can't block client handlers. As a consequence, every `loading.tsx` that imports HeroUI's `Skeleton` declares `'use client'` — Turbopack is stricter than webpack about server/client boundary for components that use React Context.
- **Tailwind content paths cover npm's nested HeroUI layout**: `tailwind.config.ts` scans both `./node_modules/@heroui/theme/dist/**/*` and `./node_modules/@heroui/**/node_modules/@heroui/theme/dist/**/*` so modal positioning classes (`fixed`, `inset-0`, `z-50`, …) survive the production purge regardless of how npm hoists `@heroui/theme`.

## Testing

A four-layer test pyramid covers utilities, components, queries/actions, and full browser flows. **397 tests** total (+ 5 E2E).

| Layer | Framework | Runs against | Tests |
|---|---|---|---|
| Unit | Vitest + jsdom | Pure functions and hooks (`timeAgo`, `topicTone`, `stripMarkdown`, `slugifyName`, `usePaginated`, `useDraft` — incl. SSR-safe rehydration, empty-string eviction, and storage-failure tolerance, `paths`, `extractMentions` — incl. email-guard, code-fence + inline-code stripping, dedupe, GitHub username length cap, hyphen rules, `findMentionTrigger` — incl. caret-position detection, empty-query trigger on bare `@`, email guard, `@@` chain guard, leading-hyphen rejection, 39-char cap) | 74 |
| Component | Vitest + React Testing Library | Mocked NextAuth/router; covers Avatar, FormError/Button, VoteButton, SaveButton, FollowButton (auth gate, optimistic toggle, server-failure revert, Follow/Following label swap), FeedNav + FeedNavMobile (active-state derived from `?view`, follow-count chip gated by count > 0, `lg:hidden` wrapper on the mobile fallback, signed-in-only mount), SavedPostsList (unsave-removes-card), PostFeed (Top/New sort pills only, defaultSort honoured, title/subtitle overrides, custom emptyState injection, fallback PostEmpty when no override), Markdown (incl. hljs token classes on fenced blocks, `@mention` autolinks to `/u/<name>` with internal-link styling, no false-positive on emails, suppressed inside code), SignInPromptProvider, CommentCard (incl. copy-link + clipboard fallbacks), CommentShow (anchor wrapping), CommentListClient (default-new ordering, top vote-count sort with newest-first tiebreak, old reverse, parent-only scoping, empty-state pill hiding, soft-deleted exclusion from the count), NotificationsBell (badge states + 99+ cap, no auto-mark on open, per-row mark-read + decrement, explicit "Mark all read" pill, distinct verbs per kind, "in" prefix for comment-kind rows, comment-anchored deep-links vs post-only links, "See all" footer link to `/notifications`, cross-component bus decrements from list dispatches, live polling on the interval, pause-while-open + pause-while-hidden, immediate refresh on tab-visible, stop-on-unmount), NotificationsList (empty state, pagination at 10/page with prev/next state, per-row mark-read, deep-link href shape, filter pill row presence + per-kind narrowing, filter-specific empty state, page-1 snap on filter change, "Mark all read" scoping vs filtered view, bus dispatch on row + bulk mark-read), MentionTextarea (no trigger pre-`@`, dropdown opens after `@`, prefix-query in URL, email guard, Escape closes, click + Enter insert, ↑/↓ navigate, no-matches hint, portal escape from `overflow-hidden` ancestor), AuthorChip, TopicPostsEmpty (start-the-discussion CTA), CharCounter (min hint, in-range, ≥90% persimmon, over-max), draft restore-from-storage on comment + topic forms (incl. parentId scoping for nested replies), all auth-gated create forms | 197 |
| Integration | Vitest + Node + Docker Postgres | Every server action and query against a real PG schema (incl. `toggleSavedPost`, `fetchSavedPosts` with viewer scope + 100-row cap, `toggleTopicFollow` and `fetchFollowingPosts` — viewer-scoped, idempotent under repeated toggles, per-user isolation, newest-first ordering, empty result when no follows, reflects unfollow; `fetchUserProfileByUsername`, `fetchUserSuggestions` — empty-query returns recent users, prefix-match case-insensitive, 6-row cap, null-username filtering, whitespace trim + 39-char clip; notification emission across `createComment` / `togglePostVote` / `toggleCommentVote` with self-action skip + REPLY_TO_POST vs REPLY_TO_COMMENT scoping, MENTION emission across `createPost` / `createComment` with self-mention skip + unknown-user skip + dedupe + same-recipient suppression vs reply notifications, `markNotificationRead` (per-item) and `markAllNotificationsRead` (bulk) viewer-scoping and signed-out no-op, Zod min/max enforcement on `createTopic` / `createPost` / `createComment`); truncate-per-test isolation; `setViewer()` helper for auth | 116 |
| E2E | Playwright (Chromium) | Live Next.js dev server with a test-only NextAuth credentials provider gated by `PLAYWRIGHT_TEST=1` | 5 |

Run everything with `npm run test:everything` — it starts the Docker test PG, runs all Vitest projects, then Playwright. Granular scripts (`test`, `test:integration`, `test:e2e`) exist for fast iteration on a single layer.

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma          # User, Topic, Post, Comment, PostVote, CommentVote, SavedPost, Notification
│   ├── migrations/            # init → soft_delete → votes → edited_at → user_profile_fields → saved_post → notification
│   └── seed.ts                # 10 personas (with handles + spread join dates) + 12 topics (one intentionally empty to show the topic empty-state CTA) + threaded markdown content + pre-edited rows + pre-saved bookmarks
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Plus Jakarta + JetBrains Mono + Header + footer
│   │   ├── page.tsx           # Home — hero / greeting, FeedNav sidebar, post feed (reads ?view=following)
│   │   ├── loading.tsx        # Home skeleton ('use client' for HeroUI Skeleton under Turbopack)
│   │   ├── not-found.tsx      # Custom 404
│   │   ├── providers.tsx      # SessionProvider + HeroUIProvider + SignInPromptProvider
│   │   ├── globals.css        # CSS vars, animations, smooth-scroll w/ reduced-motion guard
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   │   └── search/suggestions/   # Live-suggestions route
│   │   ├── auth/signin/       # Split-screen sign-in + loading skeleton
│   │   ├── saved/             # /saved — viewer's bookmarks (auth-gated) + loading skeleton
│   │   ├── notifications/     # /notifications — paginated history (auth-gated) + loading skeleton
│   │   ├── search/            # Search page + loading skeleton
│   │   ├── topics/[slug]/
│   │   │   ├── page.tsx       # Topic show (per-topic tone hero)
│   │   │   └── posts/
│   │   │       ├── new/       # Post create form
│   │   │       └── [postId]/  # Two-column post detail + loading
│   │   └── u/[username]/      # User profile page + loading skeleton
│   ├── actions/
│   │   ├── create-post.ts / create-topic.ts / create-comment.ts
│   │   ├── edit-post.ts / edit-comment.ts
│   │   ├── delete-post.ts / delete-comment.ts
│   │   ├── toggle-post-vote.ts / toggle-comment-vote.ts
│   │   ├── toggle-saved-post.ts
│   │   ├── mark-notifications-read.ts  # markNotificationRead (per-item) + markAllNotificationsRead (bulk)
│   │   └── index.ts
│   ├── components/
│   │   ├── header.tsx              # Sticky masthead with persimmon hairline
│   │   ├── header-auth.tsx         # Avatar dropdown / Sign-in button (incl. "Notifications" + "Saved posts" entries)
│   │   ├── search-input.tsx        # Live-suggestions combobox
│   │   ├── icons.tsx               # Shared SVG icons (incl. IconBookmark, IconLink, IconCheck, IconBell)
│   │   ├── auth/
│   │   │   └── signin-prompt.tsx   # Modal context for protected actions
│   │   ├── common/
│   │   │   ├── avatar.tsx
│   │   │   ├── surface-panel.tsx
│   │   │   ├── formButton.tsx
│   │   │   ├── form-error.tsx
│   │   │   ├── delete-button.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── author-chip.tsx         # Profile-nav button safe to nest inside outer <Link>
│   │   │   └── markdown.tsx            # react-markdown wrapper (body / comment variants)
│   │   ├── posts/
│   │   │   ├── post-card.tsx / post-empty.tsx / post-pagination.tsx
│   │   │   ├── post-feed.tsx           # Top/New sort + pagination
│   │   │   ├── post-show.tsx           # Two-column detail; bookmark in action row
│   │   │   ├── post-author.tsx
│   │   │   ├── post-editable.tsx       # Inline edit form + "edited" hint
│   │   │   ├── save-button.tsx         # Bookmark toggle (optimistic + auth-gated)
│   │   │   ├── saved-list-context.tsx  # Tells the /saved list to drop a card
│   │   │   ├── saved-posts-list.tsx    # Client wrapper around /saved (pagination + empty state)
│   │   │   ├── topic-posts-empty.tsx   # Topic-page empty-state CTA (start the discussion)
│   │   │   ├── thread-map.tsx / related-posts.tsx
│   │   │   └── *-loading.tsx, *-skeleton.tsx
│   │   ├── comments/
│   │   │   ├── comment-list.tsx        # Server fetcher → hands off to client
│   │   │   ├── comment-list-client.tsx # Sort pill (Top/New/Old) + recursive render
│   │   │   ├── comment-show.tsx        # Wraps every comment in a #c-{id} anchor
│   │   │   ├── comment-card.tsx        # Card with collapse rail, inline edit, copy-link button
│   │   │   ├── comment-create-form.tsx
│   │   │   ├── comment-edit-form.tsx
│   │   │   └── comment-list-loading.tsx
│   │   ├── topics/
│   │   │   ├── topic-list.tsx
│   │   │   └── topic-create-form.tsx
│   │   ├── feed-nav/
│   │   │   ├── feed-nav.tsx            # Sidebar "Your feed" scope nav (Everywhere / Following + follow-count chip)
│   │   │   └── feed-nav-mobile.tsx     # lg:hidden horizontal scope pills above the feed
│   │   ├── notifications/
│   │   │   ├── notifications.tsx       # Server fetch + viewer gate (bell)
│   │   │   ├── notifications-bell.tsx  # Client bell + dropdown + per-row mark-read + "See all"
│   │   │   └── notifications-list.tsx  # /notifications history list + pagination
│   │   └── votes/
│   │       └── vote-button.tsx         # Optimistic toggle + modal gate
│   ├── db/
│   │   ├── index.ts                    # Prisma singleton
│   │   └── queries/
│   │       ├── posts.ts                # by-id (cached), by-topic, search, recent, related — viewer-aware votes + saves include
│   │       ├── comments.ts             # by-post (cached)
│   │       ├── users.ts                # profile-by-username (cached, indexed lookup)
│   │       ├── saved-posts.ts          # fetchSavedPosts(userId) — SAVED_POSTS_LIMIT = 100
│   │       ├── notifications.ts        # recent (cap 20) + unread count + full history, all cached
│   │       └── search-suggestions.ts
│   ├── lib/
│   │   ├── utils.ts                    # timeAgo(), stripMarkdown(), topicTone(), slugifyName()
│   │   ├── server-utils.ts             # requireAuth(), getViewerId()
│   │   ├── form-classes.ts             # Shared HeroUI input/textarea classes
│   │   ├── form-limits.ts              # Shared min/max bounds (single source for Zod + CharCounter)
│   │   ├── use-paginated.ts            # Client pagination hook
│   │   ├── use-draft.ts                # localStorage-backed textarea autosave hook
│   │   ├── mentions.ts                 # MENTION regex + extractMentions(content)
│   │   ├── remark-mentions.ts          # mdast plugin that rewrites @name → /u/<name> links
│   │   └── types.ts                    # FormState, ActionResult
│   ├── auth.ts                         # NextAuth v5 config (GitHub profile.login → User.username + events.signIn backfill + test creds)
│   └── paths.ts                        # Type-safe URL builder (home, topicShow, postShow, postCreate, userProfile, savedPosts, notifications)
├── tests/
│   ├── setup.ts                        # jsdom + react form-hook stubs
│   ├── unit/                           # Pure-function tests (incl. slugifyName)
│   ├── components/                     # RTL component tests (incl. save-button, comment-card, comment-show, author-chip)
│   ├── integration/                    # Real-PG queries + actions (incl. actions-saved, queries-saved-posts)
│   │   ├── setup.ts                    # Schema push + truncate-per-test
│   │   └── factories.ts                # makeUser/Topic/Post/Comment helpers
│   └── e2e/
│       ├── global-setup.ts             # Seed minimal browse data
│       ├── browse.spec.ts
│       └── search.spec.ts
├── docker-compose.test.yml             # Postgres 16-alpine on :54329 (tmpfs)
├── playwright.config.ts
├── vitest.config.ts                    # Projects: unit + integration
├── tailwind.config.ts                  # Design tokens + HeroUI focus = persimmon override
└── next.config.mjs
```

## Getting Started

### Prerequisites

- Node.js 18.18+ (Next.js 15 minimum; 20 recommended)
- A PostgreSQL database (free Neon plan works)
- A GitHub OAuth app ([create one](https://github.com/settings/developers))
  - Homepage URL: `http://localhost:3000`
  - Callback URL: `http://localhost:3000/api/auth/callback/github`
- Docker (only for running integration + E2E tests)

### Setup

```bash
git clone https://github.com/mohamedzeina/hearsay.git
cd hearsay
npm install
```

Create `.env.local` — see [Environment Variables](#environment-variables) below.

Set up the database:

```bash
npx prisma migrate dev
npx prisma db seed   # creates 10 personas + topics + posts + comments + votes + bookmarks
```

Run the dev server:

```bash
npm run dev          # next dev --turbopack
```

Open [http://localhost:3000](http://localhost:3000).

### Running tests

```bash
npm test                 # fast: unit + component tests
npm run test:db:up       # start Docker test Postgres
npm run test:integration # queries + actions against real PG
npm run test:e2e         # Playwright browser flows
npm run test:everything  # the whole pyramid in one command
```

## Environment Variables

### Development / production (`.env.local`)

| Variable | Description | Where to get it |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | [Neon](https://neon.tech) or any Postgres provider |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | [GitHub Developer Settings](https://github.com/settings/developers) |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret | Same |
| `AUTH_SECRET` | Random secret for NextAuth session signing | `openssl rand -base64 32` |
| `NEXT_PUBLIC_NOTIFICATIONS_POLL_MS` | _Optional_, dev convenience. Override the bell's 60s polling cadence (min `1000`). Set to e.g. `3000` to watch the loop fire without sitting around. | — |

### Testing (`.env.test`)

Copy `.env.test.example` → `.env.test` (gitignored). Defaults work out of the box with `npm run test:db:up`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Points at `localhost:54329` — the Docker test PG |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Dummy values; sessions aren't signed in test |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Dummy values; the test-only credentials provider replaces GitHub |
| `PLAYWRIGHT_TEST` | Set to `1` by `playwright.config.ts` to swap NextAuth into the credentials provider |

## Scripts

```bash
# Dev
npm run dev                # next dev --turbopack — starts dev server on :3000 with Turbopack
npm run build              # prisma generate + next build
npm run start              # Start the production server
npm run lint               # next lint

# Tests
npm test                   # Unit + component (Vitest, jsdom) — ~1.5s
npm run test:watch         # Same, in watch mode
npm run test:integration   # Server actions + queries vs real PG — ~5s
npm run test:e2e           # Playwright browser flows — ~15s
npm run test:e2e:ui        # Playwright inspector
npm run test:coverage      # Coverage report (v8)
npm run test:everything    # All of the above + brings up Docker

# Database
npm run test:db:up         # Start Docker test Postgres
npm run test:db:down       # Stop and clean up Docker test Postgres
npx prisma db seed         # Reseed the dev database from prisma/seed.ts
```
