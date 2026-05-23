import type { FadeState } from '../types/fade'

export const FADE_DELAY_MS = 10 * 60 * 1000
export const DEFAULT_FADE_DURATION_MS = 6 * 60 * 60 * 1000 // 6 hours

export class FadeTimer {
  private startTime: number | null = null

  start(): void {
    if (this.startTime !== null) return
    this.startTime = Date.now()
  }

  reset(): void {
    this.startTime = null
  }

  getProgress(fadeDurationMs: number): number {
    if (this.startTime === null) return 0
    const elapsed = Date.now() - this.startTime
    if (elapsed < FADE_DELAY_MS) return 0
    return Math.min(1, (elapsed - FADE_DELAY_MS) / fadeDurationMs)
  }

  getFadeState(fadeDurationMs: number): FadeState {
    if (this.startTime === null) return 'idle'
    const elapsed = Date.now() - this.startTime
    if (elapsed < FADE_DELAY_MS) return 'delaying'
    if (elapsed - FADE_DELAY_MS >= fadeDurationMs) return 'complete'
    return 'fading'
  }

  // Adjusts startTime so getProgress() returns the given progress immediately.
  // Works even if the timer hasn't been started yet.
  seekTo(progress: number, fadeDurationMs: number): void {
    const p = Math.max(0, Math.min(1, progress))
    this.startTime = Date.now() - (FADE_DELAY_MS + p * fadeDurationMs)
  }
}
