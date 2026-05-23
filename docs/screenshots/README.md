# Screenshot capture guide

These six assets feed the README hero, gallery, and motion sections.
Capture them, drop them into this folder with the exact filenames, and
the README image tags resolve automatically.

## Pre-shot setup

- Sign in as the seed owner persona (Mohamed Zeina) so you see the full
  signed-in greeting, scope nav, and saved-bookmark state.
- Browser zoom **100%**. Window width **~1440px** (the lg breakpoint
  hits at 1024px, so anything above that is fine — wider is nicer).
- Hide the bookmark tooltip and any scrollbar by moving the cursor off
  the page area before taking each shot.
- For the GIF, throttle network to "Fast 3G" so the optimistic UI moments
  are visible — too fast and the reviewer can't see the toast fire.

## What to capture

| File | Mode | Shot |
|---|---|---|
| `hero-light.png` | Light | Home `/`, signed-in. Greeting strip + first 2 post cards + full sidebar (Your feed / Start something / Browse topics). Aspect ~16:10. |
| `hero-dark.png` | Dark | Same composition, theme toggle flipped. Pair against `hero-light.png` side-by-side. |
| `feature-scope-nav.png` | Light or dark | Just the **Your feed** sidebar panel, tightly cropped. Show Everywhere active + Following with the follow-count chip. ~600px wide. |
| `feature-toast.png` | Light or dark | Bottom-right of the viewport with the **Saved** toast visible (eyebrow, body, Undo button). Trigger by clicking the bookmark on any home-feed card. Crop tight, ~600×260. |
| `feature-post-detail.png` | Light or dark | A post detail page (`/topics/career/posts/<id>`) showing the markdown body (with a fenced code block if possible — pick a seed post that has one), a few threaded comments, and the right sidebar. |
| `feature-mentions.png` | Light or dark | Click the reply textarea on a post, type `@` then a letter. Capture with the portaled dropdown open showing 2-3 suggestions. Crop to just the textarea + dropdown. |
| `demo.gif` | Light → Dark | 12-18 seconds, ~1200×750. **Storyboard below.** |

## GIF storyboard (target ~15s)

1. (0-2s) Land on home `/`. Cursor moves over the **Your feed** sidebar.
2. (2-4s) Click **Following** — feed swaps in the same frame (no spinner).
3. (4-6s) Click **Everywhere** to come back. Sort pill is still on whatever
   you'd picked before (this proves sticky sort).
4. (6-8s) Click the **theme toggle** (top right). Whole page swaps to dark.
5. (8-11s) Hover and click the bookmark on a post card. Toast appears
   bottom-right with **Undo**.
6. (11-12s) Click **Undo**. Toast snap-dismisses; bookmark icon flips back.
7. (12-14s) Click a post card → land on the detail page → click back.
8. (14-15s) Home page is back. The card you just visited is faded.

## Tools (pick one)

- **macOS built-in screenshot** (`Cmd+Shift+5`) — covers PNGs and short
  videos. Use the "Record Selected Portion" button for the GIF, then
  convert with `ffmpeg -i input.mov -vf "fps=24,scale=1200:-1:flags=lanczos" -loop 0 demo.gif`.
- **CleanShot X / Kap** — Mac apps that record directly to GIF / WebM.
  Kap is free and the output is small.
- **LICEcap** — cross-platform, the OG "record screen → GIF" tool.

## File-size tips

- Keep the GIF under **5 MB** so GitHub renders it inline on the README.
  If it's bigger after `ffmpeg`, try `fps=18` or a narrower scale.
- PNGs: run them through `pngquant --quality=70-85` or
  [TinyPNG](https://tinypng.com) to shrink without visible loss.
