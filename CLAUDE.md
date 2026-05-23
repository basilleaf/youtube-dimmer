# CLAUDE.md — YouTube Slow Fade Player

## Project Overview

A single-page ambient video app. The user loads a YouTube video, it loops indefinitely,
and a black overlay slowly fades in over a user-defined duration (e.g. 6 hours) — completely
independent of how long the video is or how many times it loops.

See `PRD.md` for full feature spec.

## Stack

- **Vite** + **React** + **TypeScript** (no backend, no SSR)
- **Tailwind CSS** for styling
- **YouTube IFrame Player API** (loaded dynamically via script tag, not an npm package)
- **bezier-easing** for easing curves (`npm install bezier-easing`)
- No router needed — single page

## Project Structure

```
src/
  App.tsx                  # root, holds all state
  components/
    YouTubePlayer.tsx      # iframe + overlay div + custom fullscreen button
    FadeControls.tsx       # duration input, sliders, easing, start/pause/reset
    StatusBar.tsx          # elapsed, remaining, opacity %, loop count
  lib/
    easing.ts              # bezier easing curve helpers
    youtube.ts             # extractVideoId(), YT API loader util
    fadeTimer.ts           # wall-clock fade timer logic (Date.now() based)
  types/
    fade.ts                # FadeConfig, FadeState types
    youtube.d.ts           # YT global type declarations
```

## Key Architectural Rules

### Two independent timelines — this is the core concept
- **Video timeline**: YouTube player loops the video. Has nothing to do with fade.
- **Fade timeline**: Driven by `Date.now()` wall-clock elapsed time, started explicitly by the user.
  - Do NOT use `player.getCurrentTime()` to drive the fade.
  - Do NOT reset the fade when the video loops.

### Fade timer must use wall-clock math
```ts
const elapsed = Date.now() - fadeStartTime
const progress = Math.min(1, elapsed / fadeDurationMs)
```
Use `requestAnimationFrame` for the animation loop. On tab visibility change
(`visibilitychange`), recalculate elapsed from wall-clock on resume — do not
accumulate frame deltas or the timer will drift when the tab is backgrounded.

### Fullscreen: always fullscreen the wrapper div, never the iframe
YouTube's native fullscreen button is disabled via `fs: 0` player param.
We provide a custom fullscreen button that calls `requestFullscreen()` on
`#player-wrap` (the container div), not on the iframe. This ensures the
`#fade-overlay` div travels into fullscreen with the player.

```
#player-wrap  ← requestFullscreen() called here
  ├── iframe  (YouTube player)
  ├── #fade-overlay  (pointer-events: none, stays on top in fullscreen)
  └── #fullscreen-btn  (hover-visible, toggles fs on/off)
```

Handle both `fullscreenchange` and `webkitfullscreenchange`.

In fullscreen, override wrapper sizing:
```css
#player-wrap:fullscreen,
#player-wrap:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
  aspect-ratio: unset;
}
```

### URL param — video ID is always in the URL
Use `?v=VIDEO_ID` as the single query param. On load, read it with
`new URLSearchParams(window.location.search).get('v')`. On video change,
sync with `history.replaceState(null, '', '?v=' + videoId)`. No router needed.

### YouTube IFrame API loading
The YT API must be loaded via a `<script>` tag (not npm). Use a singleton loader
utility that appends the script once and resolves a promise when
`window.onYouTubeIframeAPIReady` fires. Guard against calling it multiple times.

### overlay pointer-events
The fade overlay must have `pointer-events: none` at all times so YouTube
controls remain fully clickable beneath it, even when opacity is high.

## YouTube Player Params

```ts
playerVars: {
  autoplay: 1,
  controls: 1,
  modestbranding: 1,
  rel: 0,
  enablejsapi: 1,
  fs: 0,        // disables native fullscreen button — we provide our own
}
```

On `PlayerState.ENDED`: call `player.seekTo(0)` then `player.playVideo()` to loop.

## Testing

- **Vitest** for unit tests
- Test files colocated: `src/lib/fadeTimer.test.ts`, `src/lib/youtube.test.ts`, etc.
- Key things to test:
  - `extractVideoId()` — all URL formats + invalid input
  - `fadeTimer` — delay period, progress calculation, seekTo, reset, wall-clock drift on tab return
  - `getProgress()` — returns 0 during delay, correct 0–1 during fade, clamps at 1 when complete

```bash
npm run test        # run tests
npm run test:watch  # watch mode
```

## Commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run preview  # preview production build
```

## Do Not

- Do not use Next.js, SSR, or any server-side features
- Do not use a YouTube npm wrapper — use the IFrame API directly
- Do not drive fade opacity from video playback position
- Do not call `requestFullscreen()` on the iframe element
- Do not add a router — this is a single page
- Do not store state in localStorage (not needed for v1)
- Do not add opacity range controls, easing options, or loop toggles in v1 — keep the UI minimal
- Do not add a "Start fade" button — fade auto-starts with the video (after FADE_DELAY_MS)
- Do not make the fade delay or easing configurable via UI — they are code constants
