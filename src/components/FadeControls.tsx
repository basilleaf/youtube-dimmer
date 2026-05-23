import { useEffect, useRef, useState } from 'react'
import type { FadeTimer } from '../lib/fadeTimer'
import { FADE_DELAY_MS } from '../lib/fadeTimer'

interface Props {
  timerRef: React.MutableRefObject<FadeTimer>
  fadeDurationMs: number
  onDurationChange: (ms: number) => void
  onReset: () => void
}

type DurationUnit = 'minutes' | 'hours'

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s'
  const totalSec = Math.round(ms / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const totalMin = Math.round(ms / 60_000)
  if (totalMin < 60) return `${totalMin}m`
  const h = Math.floor(ms / 3_600_000)
  const m = Math.round((ms % 3_600_000) / 60_000)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function getStatusText(timer: FadeTimer, fadeDurationMs: number): string {
  const state = timer.getFadeState(fadeDurationMs)
  if (state === 'idle') return 'Waiting for video to start'
  if (state === 'complete') return 'Complete'
  if (state === 'delaying') {
    const remaining = Math.max(0, FADE_DELAY_MS - timer.getElapsedMs())
    return `Waiting ${formatDuration(remaining)} · then fading over ${formatDuration(fadeDurationMs)}`
  }
  // fading
  const progress = timer.getProgress(fadeDurationMs)
  const remaining = (1 - progress) * fadeDurationMs
  return `Fading · ${Math.round(progress * 100)}% · ${formatDuration(remaining)} left`
}

export function FadeControls({ timerRef, fadeDurationMs, onDurationChange, onReset }: Props) {
  const sliderRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const rafIdRef = useRef(0)

  const initialHours = fadeDurationMs / 3_600_000
  const [unit, setUnit] = useState<DurationUnit>('hours')
  const [inputNum, setInputNum] = useState(initialHours)

  // Reassigned every render so the rAF callback always uses the latest props.
  const scheduleTickRef = useRef<() => void>()
  scheduleTickRef.current = () => {
    const timer = timerRef.current
    const state = timer.getFadeState(fadeDurationMs)
    const progress = timer.getProgress(fadeDurationMs)

    if (sliderRef.current) {
      sliderRef.current.value = String(Math.round(progress * 100))
      sliderRef.current.disabled = state === 'idle' || state === 'delaying'
    }
    if (statusRef.current) {
      statusRef.current.textContent = getStatusText(timer, fadeDurationMs)
    }

    rafIdRef.current = requestAnimationFrame(scheduleTickRef.current!)
  }

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(scheduleTickRef.current!)
    return () => cancelAnimationFrame(rafIdRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleNumChange(e: React.ChangeEvent<HTMLInputElement>) {
    const n = e.target.valueAsNumber
    setInputNum(n)
    if (isNaN(n) || n <= 0) return
    const ms = unit === 'hours' ? n * 3_600_000 : n * 60_000
    onDurationChange(Math.max(60_000, Math.min(86_400_000, ms)))
  }

  function handleUnitChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newUnit = e.target.value as DurationUnit
    // Re-express the current ms value in the new unit (duration doesn't change)
    const ms = unit === 'hours' ? inputNum * 3_600_000 : inputNum * 60_000
    setInputNum(newUnit === 'hours' ? ms / 3_600_000 : ms / 60_000)
    setUnit(newUnit)
  }

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    timerRef.current.seekTo(e.target.valueAsNumber / 100, fadeDurationMs)
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #3f3f46',
    background: '#18181b',
    color: '#f4f4f5',
    fontSize: '14px',
    outline: 'none',
  }

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Duration picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '14px', color: '#a1a1aa' }}>Fade over</span>
        <input
          type="number"
          value={inputNum}
          min={unit === 'hours' ? 1 : 1}
          max={unit === 'hours' ? 24 : 1440}
          step={unit === 'hours' ? 1 : 5}
          onChange={handleNumChange}
          style={{ ...inputStyle, width: '68px' }}
        />
        <select value={unit} onChange={handleUnitChange} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="hours">hours</option>
          <option value="minutes">minutes</option>
        </select>
      </div>

      {/* Status line */}
      <p ref={statusRef} style={{ margin: '0 0 8px', fontSize: '13px', color: '#71717a' }}>
        Waiting for video to start
      </p>

      {/* Progress slider */}
      <input
        ref={sliderRef}
        type="range"
        min={0}
        max={100}
        defaultValue={0}
        disabled
        onChange={handleSliderChange}
        style={{ width: '100%', marginBottom: '12px', cursor: 'pointer', accentColor: '#52525b' }}
      />

      {/* Reset */}
      <button
        onClick={onReset}
        style={{
          padding: '6px 14px',
          borderRadius: '6px',
          border: '1px solid #3f3f46',
          background: 'transparent',
          color: '#a1a1aa',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        ↺ Reset
      </button>
    </div>
  )
}
