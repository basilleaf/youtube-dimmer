import { FadeTimer, FADE_DELAY_MS } from './fadeTimer'

const DURATION_MS = 60 * 60 * 1000 // 1 hour

describe('FadeTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 0 before start() is called', () => {
    const timer = new FadeTimer()
    expect(timer.getProgress(DURATION_MS)).toBe(0)
  })

  it('returns 0 during the delay period', () => {
    const timer = new FadeTimer()
    timer.start()
    vi.advanceTimersByTime(FADE_DELAY_MS - 1)
    expect(timer.getProgress(DURATION_MS)).toBe(0)
  })

  it('returns 0 at the exact boundary of the delay', () => {
    const timer = new FadeTimer()
    timer.start()
    vi.advanceTimersByTime(FADE_DELAY_MS)
    expect(timer.getProgress(DURATION_MS)).toBe(0)
  })

  it('returns correct progress during the fade', () => {
    const timer = new FadeTimer()
    timer.start()
    vi.advanceTimersByTime(FADE_DELAY_MS + DURATION_MS / 2)
    expect(timer.getProgress(DURATION_MS)).toBeCloseTo(0.5)
  })

  it('clamps progress at 1 when the fade is complete', () => {
    const timer = new FadeTimer()
    timer.start()
    vi.advanceTimersByTime(FADE_DELAY_MS + DURATION_MS + 5000)
    expect(timer.getProgress(DURATION_MS)).toBe(1)
  })

  it('start() is idempotent — calling it twice does not reset the timer', () => {
    const timer = new FadeTimer()
    timer.start()
    vi.advanceTimersByTime(FADE_DELAY_MS + DURATION_MS / 2)
    timer.start()
    expect(timer.getProgress(DURATION_MS)).toBeCloseTo(0.5)
  })

  it('seekTo() jumps the fade to the given position', () => {
    const timer = new FadeTimer()
    timer.start()
    timer.seekTo(0.75, DURATION_MS)
    expect(timer.getProgress(DURATION_MS)).toBeCloseTo(0.75)
  })

  it('seekTo() works even before start() is called', () => {
    const timer = new FadeTimer()
    timer.seekTo(0.5, DURATION_MS)
    expect(timer.getProgress(DURATION_MS)).toBeCloseTo(0.5)
  })

  it('reset() clears state so getProgress() returns 0', () => {
    const timer = new FadeTimer()
    timer.start()
    vi.advanceTimersByTime(FADE_DELAY_MS + DURATION_MS / 2)
    timer.reset()
    expect(timer.getProgress(DURATION_MS)).toBe(0)
  })

  it('recalculates from wall clock on tab return — no drift', () => {
    // getProgress always uses Date.now() - startTime, so elapsed time
    // accumulated while the tab is hidden is automatically accounted for.
    const timer = new FadeTimer()
    timer.start()
    vi.advanceTimersByTime(FADE_DELAY_MS + DURATION_MS * 0.4)
    // Simulate tab hidden for another 10% of the duration
    vi.advanceTimersByTime(DURATION_MS * 0.1)
    // On tab return, getProgress recalculates from wall clock
    expect(timer.getProgress(DURATION_MS)).toBeCloseTo(0.5)
  })
})
