# Hearsay

> *All opinions welcome. Even yours.*

A community discussion platform where every voice gets a thread — topics, posts, nested comments, upvotes, bookmarks, live search. Built with Next.js 15 App Router on React 19, Postgres, and a hand-tuned warm-modern design system.

**Live:** [hearsay-community.vercel.app](https://hearsay-community.vercel.app)

## Table of Contents

- [Features](#features)
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
- **Empty-state CTA** — when a topic has zero posts, the main column swaps the post list for a dashed `TopicPostsEmpty` card: persimmon-soft icon halo with `IconReply`, "Start the discussion in #[slug]" headline, a friendly nudge ("Drop the first one — a question, a hot take, or a half-formed thought."), and an embedded `PostCreateForm` button so the first post is one click away. The mobile-only top form is hidden in this state so the CTA reads as the single focal point.
- Sidebar list sorted by post count with hover-lift chips

### Posts
- Create posts inside a topic with title + content (large-variant HeroUI inputs)
- Per-topic-tone color band across the top of the post card
- Big serif headline, author avatar with ring, mono timestamp, hairline divider, generous-leading body
- Top/New sort tabs as a pill segmented control (star + clock icons); Top sorts by upvote count
- 5-per-page pagination via a shared `usePaginated` hook
- Full-text search across title and content
- Owner-only delete with two-stage inline confirm (no browser dialogs)
- **Owner-only inline edit**: a small pencil button appears next to the title; clicking swaps the title and body for a validated form ("Tidy up · not rewrite"). Saves stamp `editedAt`; a muted "edited Xm ago" pip appears in the meta row.
- Empty state cards with persimmon-soft icon halo

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

### Markdown rendering
- Post bodies and comments render through `react-markdown` + `remark-gfm` + `rehype-highlight`
- Restricted allowlist: **bold, italic, links, ordered/unordered lists, inline + fenced code, blockquotes, tables**; raw HTML and images are dropped
- External links auto-set `target="_blank" rel="noopener noreferrer nofollow"`
- Code blocks use the cream-2 / mono stack; inline code gets a softer pill
- **Syntax highlighting** on fenced code blocks via `rehype-highlight` (highlight.js). Language is taken from the fence tag (` ```js `, ` ```json `, ` ```bash `), with `detect: true` falling back to auto-detection for unlanguaged blocks. Themed in `globals.css` with `.hljs-*` token classes mapped to the brand palette — keywords/tags/titles in persimmon-deep, strings/built-ins/types in teal, numbers/literals in persimmon, comments in ink-3 italic, params/variables in ink-2. Inline code keeps the pill style untouched (selectors are scoped to `.hljs`).
- Two prose variants: `body` (generous leading, used on post show) and `comment` (tighter, zero-margin paragraphs)
- Post card previews use `stripMarkdown()` so the line-clamped excerpt doesn't show raw syntax

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
- **`DeleteButton`** — trash icon → inline persimmon "Are you sure?" pill with Yes/Cancel.
- **`Markdown`** (`src/components/common/markdown.tsx`) — `react-markdown` + `remark-gfm` + `rehype-highlight` wrapper with `body` and `comment` variants. Strict allowlist; no raw HTML; external links auto-set `target="_blank" rel="noopener noreferrer nofollow"`. Highlight tokens themed in `globals.css` to the cream-and-persimmon palette.
- **`AuthorChip`** (`src/components/common/author-chip.tsx`) — client primitive that's safe to render inside an outer `<Link>` (renders as `<button>`, intercepts clicks, navigates via `router.push`). Resolves `user.username` → falls back to `slugifyName(user.name)` → renders inert text if both are missing.
- **Icons** (`src/components/icons.tsx`) — shared `IconReply`, `IconSearch`, `IconChevronDown`, `IconChevronRight`, `IconPencil`, `IconPlus`, `IconSignOut`, `IconSpinner`, `IconLink`, `IconCheck`, `IconBookmark` (accepts a `filled` prop for the saved state).
- **`topicTone(slug)`** (`src/lib/utils.ts`) — deterministic hash → 1 of 8 muted color triples (bg / text / dot).
- **Form classNames** (`src/lib/form-classes.ts`) — `inputClassNames`, `inputClassNamesLg`, `textareaClassNamesLg` for consistent HeroUI styling. Focus state is just `border-persimmon` + `bg-surface`; the ring is themed at the HeroUI plugin level so no per-component override is needed.
- **`usePaginated`** (`src/lib/use-paginated.ts`) — shared client pagination hook returning `{ page, setPage, totalPages, paginated }`.

## Architecture

- **Server Components** handle all data fetching — posts, comments, topics, suggestions, saved-posts listing, and auth resolve on the server before streaming.
- **Next 15 async dynamic APIs**: every dynamic route (`/topics/[slug]`, `/topics/[slug]/posts/[postId]`, `/u/[username]`, `/search?term=…`) receives `params` / `searchParams` as Promises and `await`s them at the top of the page. The one client-component dynamic route (`/topics/[slug]/posts/new`) unwraps with `React.use(params)`.
- **Client Components** are scoped to interactivity only: form state, sort toggles, delete confirmation, search dropdown, modal state, vote toggling, save toggling, comment-card permalink/edit UI.
- **React 19 form hooks**: form actions use `useActionState` (renamed from `useFormState`); pending button states use `useFormStatus` from `react-dom`. The `SaveButton` uses `useOptimistic` for in-flight bookmark state — the overlay auto-reverts on action failure, so there's no manual rollback branch. The `SavedListContext.removePost` call runs *outside* `startTransition` so React schedules the urgent list mutation in the same frame as the click (a transition-scoped state update would visibly linger for a frame).
- **Server Actions** (`'use server'`) handle every mutation: `createPost`, `editPost`, `deletePost`, `createTopic`, `createComment`, `editComment`, `deleteComment`, `togglePostVote`, `toggleCommentVote`, `toggleSavedPost`. All write actions go through Zod validation and `requireAuth()`; edits additionally check ownership and stamp `editedAt`. Toggle actions wrap their find/upsert in a Prisma `$transaction`. `toggleSavedPost` calls `revalidatePath('/saved')` so the bookmark page stays in sync after toggles on the feed.
- **Suspense boundaries** on the post detail page stream the post, comments, author card, thread map, and related posts in parallel.
- **Request memoization** via React `cache()` deduplicates `fetchPostById`, `fetchCommentsByPostId`, and `fetchUserProfileByUsername` when multiple components in the same render need them.
- **Soft delete** on comments preserves thread context — comments with replies become `[deleted]`; childless ones disappear entirely.
- **Vote and save queries are viewer-aware**: every post include uses `votes: { where: { userId: viewerId }, take: 1 }` and `saves: { where: { userId: viewerId }, take: 1 }` so the UI knows the viewer's vote/save state without a round-trip. Unauthenticated viewers pass an empty-string sentinel so the filter never matches.
- **Auth gating via Context modal**, not redirects: protected client buttons (upvote, save, reply, write a post, create a topic) call `useSignInPrompt().open()` instead of `router.push('/auth/signin')`, keeping the user on their current page. Server-rendered protected pages (`/saved`) still redirect with a `callbackUrl` so post-signin brings the user back.
- **Comment anchors are unified**: `CommentShow` wraps every recursive comment in `<div id="c-{id}" className="scroll-mt-24 comment-anchor">`, so both the sidebar thread map and the per-comment copy-link button hit the same `:target`-flash code path regardless of nesting depth.
- **Username resolution is single-pass and indexed**: `User.username` is unique-indexed so profile lookups go through `findUnique` (O(1)) rather than scanning slugified names. The GitHub OAuth `profile()` callback in `src/auth.ts` is augmented (via `declare module 'next-auth'`) so the Prisma adapter forwards `profile.login` straight into the column on first signin. An `events.signIn` hook backfills legacy rows once — but only when `username` is currently `null`, so a later GitHub rename can't silently steal an existing profile URL.
- **Turbopack in dev**: the `dev` script runs `next dev --turbopack`. Turbopack emits standard JS (no `eval()`-wrapped bundles), so CSP-strict browsers like Brave can't block client handlers. As a consequence, every `loading.tsx` that imports HeroUI's `Skeleton` declares `'use client'` — Turbopack is stricter than webpack about server/client boundary for components that use React Context.
- **Tailwind content paths cover npm's nested HeroUI layout**: `tailwind.config.ts` scans both `./node_modules/@heroui/theme/dist/**/*` and `./node_modules/@heroui/**/node_modules/@heroui/theme/dist/**/*` so modal positioning classes (`fixed`, `inset-0`, `z-50`, …) survive the production purge regardless of how npm hoists `@heroui/theme`.

## Testing

A four-layer test pyramid covers utilities, components, queries/actions, and full browser flows. **221 tests** total (+ 5 E2E).

| Layer | Framework | Runs against | Tests |
|---|---|---|---|
| Unit | Vitest + jsdom | Pure functions (`timeAgo`, `topicTone`, `stripMarkdown`, `slugifyName`, `usePaginated`, `paths`) | 41 |
| Component | Vitest + React Testing Library | Mocked NextAuth/router; covers Avatar, FormError/Button, VoteButton, SaveButton, SavedPostsList (unsave-removes-card), Markdown (incl. hljs token classes on fenced blocks), SignInPromptProvider, CommentCard (incl. copy-link + clipboard fallbacks), CommentShow (anchor wrapping), AuthorChip, TopicPostsEmpty (start-the-discussion CTA), all auth-gated create forms | 93 |
| Integration | Vitest + Node + Docker Postgres | Every server action and query against a real PG schema (incl. `toggleSavedPost`, `fetchSavedPosts` with viewer scope + 100-row cap, `fetchUserProfileByUsername`); truncate-per-test isolation; `setViewer()` helper for auth | 75 |
| E2E | Playwright (Chromium) | Live Next.js dev server with a test-only NextAuth credentials provider gated by `PLAYWRIGHT_TEST=1` | 5 |

Run everything with `npm run test:everything` — it starts the Docker test PG, runs all Vitest projects, then Playwright. Granular scripts (`test`, `test:integration`, `test:e2e`) exist for fast iteration on a single layer.

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma          # User, Topic, Post, Comment, PostVote, CommentVote, SavedPost
│   ├── migrations/            # init → soft_delete → votes → edited_at → user_profile_fields → saved_post
│   └── seed.ts                # 10 personas (with handles + spread join dates) + 12 topics (one intentionally empty to show the topic empty-state CTA) + threaded markdown content + pre-edited rows + pre-saved bookmarks
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Plus Jakarta + JetBrains Mono + Header + footer
│   │   ├── page.tsx           # Home — hero, signed-in greeting, post feed, sidebar
│   │   ├── loading.tsx        # Home skeleton ('use client' for HeroUI Skeleton under Turbopack)
│   │   ├── not-found.tsx      # Custom 404
│   │   ├── providers.tsx      # SessionProvider + HeroUIProvider + SignInPromptProvider
│   │   ├── globals.css        # CSS vars, animations, smooth-scroll w/ reduced-motion guard
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   │   └── search/suggestions/   # Live-suggestions route
│   │   ├── auth/signin/       # Split-screen sign-in + loading skeleton
│   │   ├── saved/             # /saved — viewer's bookmarks (auth-gated) + loading skeleton
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
│   │   └── index.ts
│   ├── components/
│   │   ├── header.tsx              # Sticky masthead with persimmon hairline
│   │   ├── headerAuth.tsx          # Avatar dropdown / Sign-in button (incl. "Saved posts" entry)
│   │   ├── search-input.tsx        # Live-suggestions combobox
│   │   ├── icons.tsx               # Shared SVG icons (incl. IconBookmark, IconLink, IconCheck)
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
│   │   │   ├── comment-list.tsx
│   │   │   ├── comment-show.tsx        # Wraps every comment in a #c-{id} anchor
│   │   │   ├── comment-card.tsx        # Card with collapse rail, inline edit, copy-link button
│   │   │   ├── comment-create-form.tsx
│   │   │   ├── comment-edit-form.tsx
│   │   │   └── comment-list-loading.tsx
│   │   ├── topics/
│   │   │   ├── topic-list.tsx
│   │   │   └── topic-create-form.tsx
│   │   └── votes/
│   │       └── vote-button.tsx         # Optimistic toggle + modal gate
│   ├── db/
│   │   ├── index.ts                    # Prisma singleton
│   │   └── queries/
│   │       ├── posts.ts                # by-id (cached), by-topic, search, recent, related — viewer-aware votes + saves include
│   │       ├── comments.ts             # by-post (cached)
│   │       ├── users.ts                # profile-by-username (cached, indexed lookup)
│   │       ├── saved-posts.ts          # fetchSavedPosts(userId) — SAVED_POSTS_LIMIT = 100
│   │       └── search-suggestions.ts
│   ├── lib/
│   │   ├── utils.ts                    # timeAgo(), stripMarkdown(), topicTone(), slugifyName()
│   │   ├── server-utils.ts             # requireAuth(), getViewerId()
│   │   ├── form-classes.ts             # Shared HeroUI input/textarea classes
│   │   ├── use-paginated.ts            # Client pagination hook
│   │   └── types.ts                    # FormState, ActionResult
│   ├── auth.ts                         # NextAuth v5 config (GitHub profile.login → User.username + events.signIn backfill + test creds)
│   └── paths.ts                        # Type-safe URL builder (topicShow, postShow, postCreate, userProfile, savedPosts)
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
