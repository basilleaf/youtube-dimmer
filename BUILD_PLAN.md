# Build Plan — YouTube Slow Fade Player

Discrete steps, each shippable and testable before moving to the next.
Reference `PRD.md` for full feature details and `CLAUDE.md` for architecture rules.

---

## [x] Step 0 — Vitest setup

**Goal**: Testing infrastructure in place before any logic is written.

- Install and configure Vitest (`npm install -D vitest`)
- Add `test` and `test:watch` scripts to `package.json`
- Verify with a single smoke test that the test runner works

**Done when**: `npm run test` runs without errors.

---

## [x] Step 1 — Scaffold & looping video

**Goal**: A page that loads a YouTube video and loops it forever.

- Vite + React + TypeScript project is already initialized
- Install `bezier-easing` (`npm install bezier-easing`)
- Set up Tailwind CSS
- Create `src/lib/youtube.ts` with:
  - `extractVideoId(input: string): string | null` — handles full URLs, short URLs, raw IDs
  - `loadYouTubeAPI(): Promise<void>` — singleton script loader, resolves on `onYouTubeIframeAPIReady`
- Create `src/types/youtube.d.ts` — declare `window.YT` global types
- Create `YouTubePlayer.tsx`:
  - Renders a `div#yt-player` target
  - On mount: calls `loadYouTubeAPI()`, then `new YT.Player()`
  - Player params: `autoplay: 1, controls: 1, rel: 0, fs: 0, enablejsapi: 1`
  - On `PlayerState.ENDED`: `seekTo(0)` + `playVideo()` to loop
  - Accepts a `videoId` prop
- `App.tsx`: hardcode a default video ID, render `<YouTubePlayer>`

**Done when**: video plays and seamlessly loops.

---

## [x] Step 2 — Video URL input + shareable URLs

**Goal**: User can load any YouTube video, and the active video is always in the URL.

- Add a URL/ID text input and "Load" button above the player
- Wire to `extractVideoId()` — show an inline error if parsing fails
- On load: call `player.loadVideoById(videoId)` if player already exists,
  otherwise initialize with the new ID
- On page load: check `window.location.search` for `?v=VIDEO_ID`; if present,
  load that video and populate the input field with it
- If no `?v=` param on load: fall back to the default hardcoded video ID
- After any successful video load: call `history.replaceState()` to update the
  URL to `?v=VIDEO_ID` — no page reload, just URL sync
- Pre-fill input with the default video ID when no param is present

**Done when**: loading a video updates the URL, refreshing the page reloads that
video, and sharing the URL opens the same video.

---

## [x] Step 3 — Custom fullscreen (with overlay div in place)

**Goal**: Fullscreen works via our wrapper div so the overlay will travel with it.

- Wrap the iframe in `div#player-wrap` (position: relative, 16:9 aspect ratio)
- Add `div#fade-overlay` inside the wrapper:
  - `position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none`
- Add `#fullscreen-btn` inside the wrapper (position: absolute, bottom-right):
  - On click: `requestFullscreen()` on `#player-wrap` (NOT the iframe)
  - Toggles between maximize/minimize icon
  - Fades in on hover, hidden at rest
- Handle `fullscreenchange` + `webkitfullscreenchange` events
- Add CSS for fullscreen wrapper sizing:
  ```css
  #player-wrap:fullscreen,
  #player-wrap:-webkit-full-screen {
    width: 100vw;
    height: 100vh;
    aspect-ratio: unset;
  }
  ```

**Done when**: clicking the custom button enters fullscreen with the overlay div
visually present (set opacity to 0.3 temporarily to verify it's there), YouTube's
native fullscreen button is gone.

---

## [ ] Step 4 — Fade timer logic

**Goal**: Wall-clock fade timer, auto-starts with video, includes 10-min delay before darkening.

- Create `src/lib/fadeTimer.ts`:
  - Export `FADE_DELAY_MS = 10 * 60 * 1000` — hardcoded delay constant
  - `start()` — records `fadeStartTime = Date.now()`
  - `reset()` — clears timer, snaps overlay to 0
  - `getProgress(fadeDurationMs): number` — returns 0–1 based on elapsed time minus delay
    - Returns 0 during the delay period
    - Returns 0–1 once fade is active
  - `seekTo(progress: number)` — allows the slider to jump the fade position
- Create `src/types/fade.ts`:
  ```ts
  type FadeState = 'idle' | 'delaying' | 'fading' | 'complete'
  interface FadeConfig {
    durationMs: number  // how long the actual fade takes (not including delay)
  }
  ```
- No easing lib — linear is `elapsed / durationMs`
- Wire a `requestAnimationFrame` loop that sets `overlay.style.opacity` each frame
- Fade auto-starts when `PlayerState.PLAYING` fires — no manual start button
- Handle `visibilitychange`: recalculate from wall clock on tab return

**Done when**: video plays, nothing happens for 10 seconds (reduce delay temporarily
for testing), then overlay begins fading in.

**Tests**: `fadeTimer.test.ts` — delay period returns 0, correct progress during fade, `seekTo()` jumps position, `reset()` clears state, wall-clock recalculation on tab return.

---

## [ ] Step 5 — Fade controls UI

**Goal**: Minimal UI to set duration, show progress, and allow manual override.

- Create `FadeControls.tsx`:
  - **Fade duration**: number input + unit toggle (minutes / hours)
  - **Progress slider**: single-handle range input, 0–100
    - Updates in real time to reflect current fade position
    - Draggable — on change, call `seekTo()` to jump the fade
    - Disabled / inactive during the 10-min delay period
  - **Reset** button — resets fade and restarts delay
  - No Start button — fade is automatic
- Status line above the slider: "Waiting 8m · then fading over 6h" or "Fading · 37% · 3h 46m left" or "Complete"

**Done when**: duration picker works, slider tracks fade in real time, dragging the
slider jumps the overlay opacity, Reset works.

---

## [ ] Step 6 — Status bar

**Goal**: User can see what's happening at a glance.

- Create `StatusBar.tsx`, rendered below the player:
  - Player state pill: Loading / Playing / Paused / Buffering
  - Video time: `1:23:45 / 3:00:00` (polled from `player.getCurrentTime()` / `getDuration()`)
  - Loop count: `Loop 3`
  - Fade state: `2h 14m elapsed · 3h 46m remaining` (or "Idle" / "Complete")
  - Overlay opacity: `37%`
- Poll video time on a 1s interval (not rAF — no need for 60fps here)
- Format durations as `Xh Ym` for long durations, `M:SS` for video time

**Done when**: status bar reflects live state accurately, including during fullscreen.

---

## [ ] Step 7 — Polish & edge cases

- Graceful handling if `requestFullscreen` is unavailable (hide the button)
- Error state if YouTube video fails to load (private/deleted video)
- Prevent fade controls from being jarring if settings change mid-fade
  (recalculate opacity smoothly from current position)
- Verify overlay and fullscreen button render correctly on mobile (touch passthrough)
- Final visual polish: spacing, typography, dark theme to match the ambient use case
