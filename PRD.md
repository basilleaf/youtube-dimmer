# PRD: YouTube Slow Fade Player

## Overview

A single-page web app that plays a YouTube video on loop while independently fading the screen to black over a user-defined "fade duration" (e.g. 6 hours). The video loop cycle and the fade timeline are completely decoupled — the video might be 3 hours long and loop twice while the screen fades to black once over 6 hours.

Primary use case: ambient/background video (lo-fi, nature, fireplace, etc.) that gradually dims to black so the user doesn't need to manually turn off the screen.

---

## Core Concept: Two Independent Timelines

| Timeline | What it controls |
|---|---|
| **Video timeline** | The YouTube video — loops indefinitely, independent of fade |
| **Fade timeline** | The black overlay opacity — goes from start opacity → end opacity over `fadeDuration`, based on wall-clock time, not video position |

The fade is driven by `Date.now()` (elapsed real time since the user hit play/start), not by `player.getCurrentTime()`. This is the key architectural distinction from a naive implementation.

---

## Tech Stack

- **Framework**: Vite + React + TypeScript — no SSR, no backend, purely client-side
- **YouTube**: YouTube IFrame Player API (`youtube.com/iframe_api`) loaded via dynamic script tag — not an npm package
- **Styling**: Tailwind CSS — keep it minimal, this is a fullscreen ambient tool
- **Deployment**: Vercel (just point at the Vite build output, `dist/`)

---

## Features

### 1. Video Input & Shareable URLs

The active video ID is always reflected in the URL as a `?v=` query param, making every loaded video bookmarkable and shareable.

- Text input accepting:
  - Full YouTube URLs (`https://www.youtube.com/watch?v=...`)
  - Short URLs (`https://youtu.be/...`)
  - Raw video IDs (11-character string)
- "Load" button parses the ID, loads the player, and updates the URL via `history.replaceState()` — no page reload
- On page load: read `?v=` from `window.location.search`; if present, load that video immediately
- If no `?v=` param on load: pre-fill input with a default video ID and load it
- URL updates any time the user loads a new video, so the current state is always shareable

### 2. YouTube Player
- Embedded via YouTube IFrame API
- Player params:
  - `fs: 0` — **hide YouTube's native fullscreen button** (we replace it with our own)
  - `controls: 1` — show native play/pause/scrub controls
  - `rel: 0` — no related videos
  - `modestbranding: 1`
  - `enablejsapi: 1`
- On `ENDED` state: seek to 0 and call `playVideo()` to loop
- Track loop count for display

### 3. Fade Overlay
- A `<div>` absolutely positioned over the player, `pointer-events: none`, `background: #000`
- Opacity driven by elapsed real time, NOT video position:

```
elapsed = Date.now() - fadeStartTime
progress = clamp(elapsed / fadeDurationMs, 0, 1)
easedProgress = applyEasingCurve(progress)
opacity = startOpacity + (endOpacity - startOpacity) * easedProgress
```

- Update on `requestAnimationFrame` loop (not setInterval) for smooth animation
- Overlay must remain visible in fullscreen (see Fullscreen section)

### 4. Fade Controls

Intentionally minimal. The app does one thing: fade to black over a set time.

- **Fade duration**: number input + unit toggle (minutes / hours). Range: 1 min to 24 hours.
- **Reset** button — resets fade back to beginning (re-starts the 10-min delay)
- No "Start fade" button — fade starts automatically when the video starts playing

Fade is always: 0% opacity → 100% opacity (fully black), linear.

**10-minute delay**: fade does not begin immediately on video play. There is a hardcoded
10-minute flat period before darkening starts. This is a constant in the code, not a UI control.

```ts
const FADE_DELAY_MS = 10 * 60 * 1000 // 10 minutes, hardcoded
```

### 5. Fullscreen — Custom Implementation

**This is the most important technical constraint.**

YouTube's native fullscreen button (`fs` param) is disabled. We provide our own fullscreen button that calls `requestFullscreen()` on the **wrapper div** (not the iframe), so the overlay div is included in the fullscreen context.

```
#player-wrap (fullscreened)
  ├── #yt-iframe
  ├── #fade-overlay  ← stays on top in fullscreen
  └── #fullscreen-btn
```

- Button appears on hover over the player (opacity transition)
- Icon toggles between maximize / minimize
- Button must work in fullscreen too (to exit)
- Handle both `fullscreenchange` and `webkitfullscreenchange` events
- In fullscreen, the wrapper should fill the viewport: use `:fullscreen` and `:-webkit-full-screen` CSS selectors to set `width: 100vw; height: 100vh`

```css
#player-wrap:fullscreen,
#player-wrap:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
  aspect-ratio: unset;
}
```

### 6. Fade State & Progress Slider

The fade progress slider serves dual purpose: status display and manual override.

- Single-handle range slider spanning the full fade duration
- Handle position reflects current fade progress in real time
- **Draggable**: user can drag to jump the fade to any point (go darker sooner, or back earlier)
- Dragging does not affect video playback — only the fade overlay opacity and internal elapsed time
- During the 10-minute pre-fade delay, slider sits at 0 and is effectively inactive
- **Reset** button snaps overlay back to 0%, restarts the 10-min delay clock

### 7. Status Bar (below player)
Display:
- Player state (Loading / Playing / Paused / Buffering)
- Video time: `1:23:45 / 3:00:00`
- Loop count: `Loop 3`
- Fade progress: `2h 14m elapsed · 3h 46m remaining`
- Overlay opacity: `37%`

---

## UI Layout

```
┌─────────────────────────────────────┐
│  [ YouTube URL input      ] [Load]  │
├─────────────────────────────────────┤
│                                     │
│         YouTube Player              │
│         (16:9 aspect ratio)         │
│                          [⛶]       │  ← custom fullscreen btn, hover only
├─────────────────────────────────────┤
│  ● Playing  1:23:45/3:00:00  Loop 3 │
│  Waiting 8m · then fading over 6h   │  ← or "Fading · 37% · 3h 46m left"
├─────────────────────────────────────┤
│  Fade over: [  6  ] [hours ▾]       │
│  [━━━━●━━━━━━━━━━━━━━━━━━━━━━]      │  ← draggable progress slider
│  [↺ Reset]                          │
└─────────────────────────────────────┘
```

---

## Easing

Linear only. `opacity = elapsed / fadeDurationMs`. No bezier-easing dependency needed.

---

## Fade Timer Logic (pseudocode)

```js
let fadeStartTime = null      // Date.now() when fade started
let fadePausedAt = null       // elapsed ms when paused
let fadeState = 'idle'        // 'idle' | 'running' | 'paused' | 'complete'

function startFade() {
  fadeStartTime = Date.now()
  fadePausedAt = null
  fadeState = 'running'
  requestAnimationFrame(tick)
}

function pauseFade() {
  fadePausedAt = Date.now() - fadeStartTime
  fadeState = 'paused'
}

function resumeFade() {
  fadeStartTime = Date.now() - fadePausedAt
  fadeState = 'running'
  requestAnimationFrame(tick)
}

function resetFade() {
  fadeState = 'idle'
  overlay.style.opacity = startOpacity
}

function tick() {
  if (fadeState !== 'running') return
  const elapsed = Date.now() - fadeStartTime
  const progress = Math.min(1, elapsed / fadeDurationMs)
  const eased = curves[selectedCurve](progress)
  const opacity = startOpacity + (endOpacity - startOpacity) * eased
  overlay.style.opacity = opacity
  updateStatusBar(elapsed, opacity)
  if (progress < 1) requestAnimationFrame(tick)
  else fadeState = 'complete'
}
```

---

## Edge Cases

- **Page visibility**: When the tab is hidden (`visibilitychange`), the `rAF` loop stops. On return, recalculate elapsed from wall-clock time — don't drift.
- **Very long durations**: fadeDurationMs can be up to 86,400,000ms (24h). Use `Date.now()` math, not accumulated frame deltas, to avoid drift.
- **Video not started yet**: Fade timeline should only start when user explicitly clicks "Start fade", not on video load.
- **Fullscreen API unavailability**: Some browsers/contexts don't support it — show a graceful message or hide the button.
- **Mobile**: Touch events pass through `pointer-events: none` overlay correctly; test that YouTube controls remain tappable.

---

## File Structure (Next.js)

```
/app
  page.tsx           ← main UI
  layout.tsx
/components
  YouTubePlayer.tsx  ← iframe + overlay + fullscreen logic
  FadeControls.tsx   ← sliders, duration input, start/pause/reset
  StatusBar.tsx      ← elapsed, opacity, loop count display
/lib
  easing.ts          ← bezier easing curves
  youtube.ts         ← extractVideoId(), YT API loader
/types
  fade.ts            ← FadeState, FadeConfig types
```

---

## Out of Scope (v1)

- Opacity range controls (start/end opacity)
- Easing curve selection (hardcoded linear; ease-in is a likely v2 addition, change the constant in code)
- Loop toggle (always loops)
- Configurable fade delay (hardcoded 10 min; change `FADE_DELAY_MS` in code)
- Scheduled start time ("start fading at 10pm")
- Audio fade (separate from visual)
- Saving/persisting settings across sessions
- Mobile app
