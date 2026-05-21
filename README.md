# Hearsay

> *All opinions welcome. Even yours.*

A community discussion platform where every voice gets a thread — topics, posts, nested comments, upvotes, live search. Built with Next.js 14 App Router, Postgres, and a hand-tuned warm-modern design system.

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
- **Reddit-style sign-in modal** instead of redirects. Clicking any protected action (upvote, reply, write a post, create a topic) opens a centered modal with a single "Continue with GitHub" button and a contextual reason ("Sign in to upvote.", "Sign in to start a topic.", …). Loading state on the GitHub button — the persimmon wash slides up and the label switches to "Connecting to GitHub…" with a spinner.

### Topics
- Create topics via a centered modal (Cancel + Create-topic footer bar, autofocus, slug-pattern validation `^[a-z-]+$`)
- Topic chips colored deterministically via `topicTone(slug)` — a hash of the slug maps to one of 8 muted palettes (terracotta, sage, plum, teal, mustard, periwinkle, rust, dusty rose). The same topic always renders in the same color across the entire app.
- Topic show page hero is washed in the topic's own tone with a soft radial bloom
- Sidebar list sorted by post count with hover-lift chips

### Posts
- Create posts inside a topic with title + content (large-variant Tailwind/NextUI inputs)
- Per-topic-tone color band across the top of the post card
- Big serif headline, author avatar with ring, mono timestamp, hairline divider, generous-leading body
- Top/New sort tabs as a pill segmented control (star + clock icons); Top sorts by upvote count
- 5-per-page pagination via a shared `usePaginated` hook
- Full-text search across title and content
- Owner-only delete with two-stage inline confirm (no browser dialogs)
- **Owner-only inline edit**: a small pencil button appears next to the title; clicking swaps the title and body for a validated form ("Tidy up · not rewrite"). Saves stamp `editedAt`; a muted "edited Xm ago" pip appears in the meta row.
- Empty state cards with persimmon-soft icon halo

### User profiles
- `/u/[username]` route with a decorated header (avatar, name, `@username`, joined-on month, two-up stats), the user's 20 most-recent posts (reusing `PostCard`), and a sticky "Recent replies" sidebar that backlinks each comment to its source post via `paths.postShow(...) + '#c-{id}'`
- **Indexed `User.username` lookup** — `@unique` Postgres index, O(1) `db.user.findUnique({ where: { username } })`; no slug-scanning
- **GitHub login → Hearsay username** wired in the `profile()` callback on `src/auth.ts` — new signins land at `/u/<github-login>` automatically
- **`slugifyName` fallback** for legacy rows that pre-date the `username` column (rare path; mostly cosmetic)
- **Clickable author attribution everywhere**: `AuthorChip` (new client primitive) inside `<Link>`-wrapped cards like `PostCard`, plus direct Next `<Link>` wrapping in `CommentCard`, `PostAuthor`, and `PostEditable`. All four resolve `user.username` first, slugify the name as a fallback.

### Comments
- Threaded replies (nested via `parentId`)
- Each comment is its own bordered card with an avatar column
- **Collapse rail**: the thin column between avatar and replies is a clickable pill that toggles a "+ show replies" footer for the subtree
- Soft delete for comments with children — renders `[comment deleted]` to preserve thread context; childless deletes hide entirely
- Instant client UI on delete; counts in the header exclude soft-deleted comments
- **Owner-only inline edit**: pencil button alongside Delete swaps the markdown body for a Textarea form; saves stamp `editedAt` and surface a "edited Xm ago" hint next to the timestamp
- **Per-comment permalink**: every comment — top-level or nested — wraps in an `id="c-{id}"` anchor with the `comment-anchor` class. A "Link" button (with `IconLink` / `IconCheck` swap) on every card copies `<post-url>#c-{id}` via `navigator.clipboard.writeText`, flips to "Copied" for 1.5s, and swallows clipboard failures silently. Loading the URL with that hash smooth-scrolls to the comment and triggers the existing 1.8s persimmon `:target` flash. `html { scroll-behavior: smooth }` is set globally with a `prefers-reduced-motion` opt-out.

### Markdown rendering
- Post bodies and comments render through `react-markdown` + `remark-gfm`
- Restricted allowlist: **bold, italic, links, ordered/unordered lists, inline + fenced code, blockquotes, tables**; raw HTML and images are dropped
- External links auto-set `target="_blank" rel="noopener noreferrer nofollow"`
- Code blocks use the cream-2 / mono stack; inline code gets a softer pill
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
- Route-level loading skeletons for `/`, `/search`, `/auth/signin`, `/topics/[slug]`, and `/topics/[slug]/posts/[postId]`
- Subtle animations: `.rise` (fade + slide-up), `.dot-live` (persimmon glow pulse), `.ink-link` (hover underline reveal), `:target` flash on anchor arrival, bouncy logo period on hover, rotating `+` glyph on the topic-create trigger
- Global smooth scroll for hash-jumps (used by the thread map and comment permalinks); disabled under `prefers-reduced-motion`
- All animations honor `prefers-reduced-motion`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript 5 (strict) |
| Database | PostgreSQL (Neon) via Prisma 5.11 |
| Auth | NextAuth v5 (beta 3) + GitHub OAuth + Prisma adapter |
| UI | NextUI 2.2 + Tailwind CSS 3.3 |
| Fonts | Plus Jakarta Sans + JetBrains Mono (`next/font/google`) |
| Validation | Zod 3.22 |
| Motion | Framer Motion |
| Markdown | react-markdown 10 + remark-gfm 4 (restricted allowlist) |
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

Three semantic shadows: `shadow-soft` (1px lift), `shadow-lift` (4-12px), `shadow-lift-lg` (modals).

CSS custom properties are exposed in `globals.css` (e.g. `--nav-h: 4rem` so the header height has a single source of truth that sidebars can offset from with `top-[calc(var(--nav-h)+2rem)]`).

### Primitives

- **`Avatar`** (`src/components/common/avatar.tsx`) — single component covering image and fallback-initial variants. Sizes `xs`/`sm`/`md`/`lg`, optional `tone` for topic-colored backgrounds, configurable ring.
- **`SurfacePanel`** (`src/components/common/surface-panel.tsx`) — polymorphic card with `as` (section/article/aside) and `size` (md = `rounded-2xl` sidebars, lg = `rounded-3xl` content). Single source of truth for bordered surfaces.
- **`PostCard`** (`src/components/posts/post-card.tsx`) — shared by feed, topic list, and search; reveals a persimmon left rail on hover.
- **`VoteButton`** (`src/components/votes/vote-button.tsx`) — optimistic upvote toggle with auth-gate via signin modal.
- **`SignInPromptProvider`** (`src/components/auth/signin-prompt.tsx`) — Context-based modal trigger. Any client component calls `useSignInPrompt().open(reason)` to surface the auth modal without losing the user's place.
- **`FormButton`** — ink pill with built-in `useFormStatus()` spinner and "Working…" state.
- **`FormError`** — accessible `role="alert"` error banner.
- **`DeleteButton`** — trash icon → inline persimmon "Are you sure?" pill with Yes/Cancel.
- **`Markdown`** (`src/components/common/markdown.tsx`) — `react-markdown` + `remark-gfm` wrapper with `body` and `comment` variants. Strict allowlist; no raw HTML; external links auto-set `target="_blank" rel="noopener noreferrer nofollow"`.
- **`AuthorChip`** (`src/components/common/author-chip.tsx`) — client primitive that's safe to render inside an outer `<Link>` (renders as `<button>`, intercepts clicks, navigates via `router.push`). Resolves `user.username` → falls back to `slugifyName(user.name)` → renders inert text if both are missing.
- **Icons** (`src/components/icons.tsx`) — shared `IconReply`, `IconSearch`, `IconChevronDown`, `IconChevronRight`, `IconPencil`, `IconPlus`, `IconSignOut`, `IconSpinner`, `IconLink` (permalink button), `IconCheck` ("Copied" affordance).
- **`topicTone(slug)`** (`src/lib/utils.ts`) — deterministic hash → 1 of 8 muted color triples (bg / text / dot).
- **Form classNames** (`src/lib/form-classes.ts`) — `inputClassNames`, `inputClassNamesLg`, `textareaClassNamesLg` for consistent NextUI styling.
- **`usePaginated`** (`src/lib/use-paginated.ts`) — shared client pagination hook returning `{ page, setPage, totalPages, paginated }`.

## Architecture

- **Server Components** handle all data fetching — posts, comments, topics, suggestions, and auth resolve on the server before streaming.
- **Client Components** are scoped to interactivity only: form state, sort toggles, delete confirmation, search dropdown, modal state, vote toggling, comment-card permalink/edit UI.
- **Server Actions** (`'use server'`) handle every mutation: `createPost`, `editPost`, `deletePost`, `createTopic`, `createComment`, `editComment`, `deleteComment`, `togglePostVote`, `toggleCommentVote`. All write actions go through Zod validation and `requireAuth()`; edits additionally check ownership and stamp `editedAt`.
- **Suspense boundaries** on the post detail page stream the post, comments, author card, thread map, and related posts in parallel.
- **Request memoization** via React `cache()` deduplicates `fetchPostById` and `fetchCommentsByPostId` when multiple components in the same render need them.
- **Soft delete** on comments preserves thread context — comments with replies become `[deleted]`; childless ones disappear entirely.
- **Vote queries are viewer-aware**: every post/comment include uses `votes: { where: { userId: viewerId }, take: 1 }` so the UI knows the viewer's vote state without a round-trip. Unauthenticated viewers pass an empty-string sentinel so the filter never matches.
- **Auth gating via Context modal**, not redirects: protected client buttons (upvote, reply, write a post, create a topic) call `useSignInPrompt().open()` instead of `router.push('/auth/signin')`, keeping the user on their current page.
- **Comment anchors are unified**: `CommentShow` wraps every recursive comment in `<div id="c-{id}" className="scroll-mt-24 comment-anchor">`, so both the sidebar thread map and the per-comment copy-link button hit the same `:target`-flash code path regardless of nesting depth.
- **Username resolution is single-pass and indexed**: `User.username` is unique-indexed so profile lookups go through `findUnique` (O(1)) rather than scanning slugified names. The GitHub OAuth `profile()` callback in `src/auth.ts` is augmented (via `declare module 'next-auth'`) so the Prisma adapter forwards `profile.login` straight into the column on first signin. `slugifyName` is only used as a fallback for legacy rows that pre-date the column.

## Testing

A four-layer test pyramid covers utilities, components, queries/actions, and full browser flows. **189 tests** total.

| Layer | Framework | Runs against | Tests |
|---|---|---|---|
| Unit | Vitest + jsdom | Pure functions (`timeAgo`, `topicTone`, `stripMarkdown`, `slugifyName`, `usePaginated`, `paths`) | 41 |
| Component | Vitest + React Testing Library | Mocked NextAuth/router; covers Avatar, FormError/Button, VoteButton, Markdown, SignInPromptProvider, CommentCard (incl. copy-link + clipboard fallbacks), CommentShow (anchor wrapping), AuthorChip (profile navigation), all auth-gated create forms | 77 |
| Integration | Vitest + Node + Docker Postgres | Every server action and query against a real PG schema (incl. `fetchUserProfileByUsername`); truncate-per-test isolation; `setViewer()` helper for auth | 66 |
| E2E | Playwright (Chromium) | Live Next.js dev server with a test-only NextAuth credentials provider gated by `PLAYWRIGHT_TEST=1` | 5 |

Run everything with `npm run test:everything` — it starts the Docker test PG, runs all Vitest projects, then Playwright. Granular scripts (`test`, `test:integration`, `test:e2e`) exist for fast iteration on a single layer.

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma          # User (+ username/createdAt), Topic, Post, Comment, PostVote, CommentVote
│   ├── migrations/            # init → add_comment_soft_delete → add_votes → add_edited_at → add_user_profile_fields
│   └── seed.ts                # 10 personas (with handles + spread join dates) + 11 topics + threaded markdown content + pre-edited rows
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Plus Jakarta + JetBrains Mono + Header + footer
│   │   ├── page.tsx           # Home — hero, signed-in greeting, post feed, sidebar
│   │   ├── loading.tsx        # Home skeleton
│   │   ├── not-found.tsx      # Custom 404
│   │   ├── providers.tsx      # SessionProvider + NextUI + SignInPromptProvider
│   │   ├── globals.css        # CSS vars, animations, smooth-scroll w/ reduced-motion guard
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   │   └── search/suggestions/   # Live-suggestions route
│   │   ├── auth/signin/       # Split-screen sign-in + loading skeleton
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
│   │   └── index.ts
│   ├── components/
│   │   ├── header.tsx              # Sticky masthead with persimmon hairline
│   │   ├── headerAuth.tsx          # Avatar dropdown / Sign-in button
│   │   ├── search-input.tsx        # Live-suggestions combobox
│   │   ├── icons.tsx               # Shared SVG icons (incl. IconLink, IconCheck)
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
│   │   │   ├── post-show.tsx / post-author.tsx
│   │   │   ├── post-editable.tsx       # Inline edit form + "edited" hint
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
│   │       ├── posts.ts                # by-id (cached), by-topic, search, recent, related
│   │       ├── comments.ts             # by-post (cached)
│   │       ├── users.ts                # profile-by-username (cached, indexed lookup)
│   │       └── search-suggestions.ts
│   ├── lib/
│   │   ├── utils.ts                    # timeAgo(), stripMarkdown(), topicTone(), slugifyName()
│   │   ├── server-utils.ts             # requireAuth(), getViewerId()
│   │   ├── form-classes.ts             # Shared NextUI input/textarea classes
│   │   ├── use-paginated.ts            # Client pagination hook
│   │   └── types.ts                    # FormState, ActionResult
│   ├── auth.ts                         # NextAuth v5 config (GitHub profile.login → User.username + test creds)
│   └── paths.ts                        # Type-safe URL builder (topicShow, postShow, postCreate, userProfile)
├── tests/
│   ├── setup.ts                        # jsdom + react-dom form-hook stubs
│   ├── unit/                           # Pure-function tests (incl. slugifyName)
│   ├── components/                     # RTL component tests (incl. comment-card, comment-show, author-chip)
│   ├── integration/                    # Real-PG queries + actions
│   │   ├── setup.ts                    # Schema push + truncate-per-test
│   │   └── factories.ts                # makeUser/Topic/Post/Comment helpers
│   └── e2e/
│       ├── global-setup.ts             # Seed minimal browse data
│       ├── browse.spec.ts
│       └── search.spec.ts
├── docker-compose.test.yml             # Postgres 16-alpine on :54329 (tmpfs)
├── playwright.config.ts
├── vitest.config.ts                    # Projects: unit + integration
├── tailwind.config.ts                  # Design tokens
└── next.config.mjs
```

## Getting Started

### Prerequisites

- Node.js 18+
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
npx prisma db seed   # creates 10 personas + topics + posts + comments + votes
```

Run the dev server:

```bash
npm run dev
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
npm run dev                # Start the dev server on :3000
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
