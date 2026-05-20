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
- Top/New sort tabs as a pill segmented control (star + clock icons); **Top now sorts by upvote count** (was comment count)
- 5-per-page pagination via a shared `usePaginated` hook
- Full-text search across title and content
- Owner-only delete with two-stage inline confirm (no browser dialogs)
- Empty state cards with persimmon-soft icon halo

### Comments
- Threaded replies (nested via `parentId`)
- Each comment is its own bordered card with an avatar column
- **Collapse rail**: the thin column between avatar and replies is a clickable pill that toggles a "+ show replies" footer for the subtree
- Soft delete for comments with children — renders `[comment deleted]` to preserve thread context; childless deletes hide entirely
- Instant client UI on delete; counts in the header exclude soft-deleted comments

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
  - **Thread map** — numbered list (01, 02, …) of top-level comments. Click a row → anchor jumps to that comment via `#c-{id}`, with a **persimmon `:target` flash** as arrival feedback (1.8s box-shadow fade)
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
- **Icons** (`src/components/icons.tsx`) — shared `IconReply`, `IconSearch`, `IconChevronDown`, `IconChevronRight`, `IconPencil`, `IconPlus`, `IconSignOut`, `IconSpinner`.
- **`topicTone(slug)`** (`src/lib/utils.ts`) — deterministic hash → 1 of 8 muted color triples (bg / text / dot).
- **Form classNames** (`src/lib/form-classes.ts`) — `inputClassNames`, `inputClassNamesLg`, `textareaClassNamesLg` for consistent NextUI styling.
- **`usePaginated`** (`src/lib/use-paginated.ts`) — shared client pagination hook returning `{ page, setPage, totalPages, paginated }`.

## Architecture

- **Server Components** handle all data fetching — posts, comments, topics, suggestions, and auth resolve on the server before streaming.
- **Client Components** are scoped to interactivity only: form state, sort toggles, delete confirmation, search dropdown, modal state, vote toggling.
- **Server Actions** (`'use server'`) handle every mutation: `createPost`, `createTopic`, `createComment`, `deletePost`, `deleteComment`, `togglePostVote`, `toggleCommentVote`. All write actions go through Zod validation and `requireAuth()`.
- **Suspense boundaries** on the post detail page stream the post, comments, author card, thread map, and related posts in parallel.
- **Request memoization** via React `cache()` deduplicates `fetchPostById` and `fetchCommentsByPostId` when multiple components in the same render need them.
- **Soft delete** on comments preserves thread context — comments with replies become `[deleted]`; childless ones disappear entirely.
- **Vote queries are viewer-aware**: every post/comment include uses `votes: { where: { userId: viewerId }, take: 1 }` so the UI knows the viewer's vote state without a round-trip. Unauthenticated viewers pass an empty-string sentinel so the filter never matches.
- **Auth gating via Context modal**, not redirects: protected client buttons (upvote, reply, write a post, create a topic) call `useSignInPrompt().open()` instead of `router.push('/auth/signin')`, keeping the user on their current page.

## Testing

A four-layer test pyramid covers utilities, components, queries/actions, and full browser flows. **130 tests** total.

| Layer | Framework | Runs against | Tests |
|---|---|---|---|
| Unit | Vitest + jsdom | Pure functions (`timeAgo`, `topicTone`, `usePaginated`, `paths`) | 23 |
| Component | Vitest + React Testing Library | Mocked NextAuth/router; covers Avatar, FormError/Button, VoteButton, SignInPromptProvider, all auth-gated create forms | 51 |
| Integration | Vitest + Node + Docker Postgres | Every server action and query against a real PG schema; truncate-per-test isolation; `setViewer()` helper for auth | 51 |
| E2E | Playwright (Chromium) | Live Next.js dev server with a test-only NextAuth credentials provider gated by `PLAYWRIGHT_TEST=1` | 5 |

Run everything with `npm run test:everything` — it starts the Docker test PG, runs all Vitest projects, then Playwright. Granular scripts (`test`, `test:integration`, `test:e2e`) exist for fast iteration on a single layer.

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma          # User, Topic, Post, Comment, PostVote, CommentVote
│   └── seed.ts                # 10 personas + DiceBear avatars + nested threads
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Plus Jakarta + JetBrains Mono + Header + footer
│   │   ├── page.tsx           # Home — hero, signed-in greeting, post feed, sidebar
│   │   ├── loading.tsx        # Home skeleton
│   │   ├── not-found.tsx      # Custom 404
│   │   ├── providers.tsx      # SessionProvider + NextUI + SignInPromptProvider
│   │   ├── globals.css        # CSS vars, animations
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   │   └── search/suggestions/   # Live-suggestions route
│   │   ├── auth/signin/       # Split-screen sign-in + loading skeleton
│   │   ├── search/            # Search page + loading skeleton
│   │   └── topics/[slug]/
│   │       ├── page.tsx       # Topic show (per-topic tone hero)
│   │       └── posts/
│   │           ├── new/       # Post create form
│   │           └── [postId]/  # Two-column post detail + loading
│   ├── actions/
│   │   ├── create-post.ts / create-topic.ts / create-comment.ts
│   │   ├── delete-post.ts / delete-comment.ts
│   │   ├── toggle-post-vote.ts / toggle-comment-vote.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── header.tsx              # Sticky masthead with persimmon hairline
│   │   ├── headerAuth.tsx          # Avatar dropdown / Sign-in button
│   │   ├── search-input.tsx        # Live-suggestions combobox
│   │   ├── icons.tsx               # Shared SVG icons
│   │   ├── auth/
│   │   │   └── signin-prompt.tsx   # Modal context for protected actions
│   │   ├── common/
│   │   │   ├── avatar.tsx
│   │   │   ├── surface-panel.tsx
│   │   │   ├── formButton.tsx
│   │   │   ├── form-error.tsx
│   │   │   ├── delete-button.tsx
│   │   │   └── breadcrumb.tsx
│   │   ├── posts/
│   │   │   ├── post-card.tsx / post-empty.tsx / post-pagination.tsx
│   │   │   ├── post-feed.tsx           # Top/New sort + pagination
│   │   │   ├── post-show.tsx / post-author.tsx
│   │   │   ├── thread-map.tsx / related-posts.tsx
│   │   │   └── *-loading.tsx, *-skeleton.tsx
│   │   ├── comments/
│   │   │   ├── comment-list.tsx / comment-show.tsx
│   │   │   ├── comment-card.tsx        # Card with collapse rail
│   │   │   ├── comment-create-form.tsx
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
│   │       └── search-suggestions.ts
│   ├── lib/
│   │   ├── utils.ts                    # timeAgo(), topicTone(), TOPIC_PALETTE
│   │   ├── server-utils.ts             # requireAuth(), getViewerId()
│   │   ├── form-classes.ts             # Shared NextUI input/textarea classes
│   │   ├── use-paginated.ts            # Client pagination hook
│   │   └── types.ts                    # FormState, ActionResult
│   ├── auth.ts                         # NextAuth v5 config (GitHub + test creds)
│   └── paths.ts                        # Type-safe URL builder
├── tests/
│   ├── setup.ts                        # jsdom + react-dom form-hook stubs
│   ├── unit/                           # Pure-function tests
│   ├── components/                     # RTL component tests
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
