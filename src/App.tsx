import { useRef, useState } from 'react'
import { YouTubePlayer } from './components/YouTubePlayer'
import { FadeControls } from './components/FadeControls'
import { extractVideoId } from './lib/youtube'
import { FadeTimer, DEFAULT_FADE_DURATION_MS } from './lib/fadeTimer'

const DEFAULT_VIDEO_ID = 'jNQXAC9IVRw'

function getInitialVideoId(): string {
  const v = new URLSearchParams(window.location.search).get('v')
  return (v && extractVideoId(v)) ?? DEFAULT_VIDEO_ID
}

function App() {
  const [videoId, setVideoId] = useState(getInitialVideoId)
  const [inputValue, setInputValue] = useState(videoId)
  const [error, setError] = useState<string | null>(null)
  const [fadeDurationMs, setFadeDurationMs] = useState(DEFAULT_FADE_DURATION_MS)
  const timerRef = useRef(new FadeTimer())

  function loadVideo() {
    const id = extractVideoId(inputValue)
    if (!id) {
      setError('Invalid YouTube URL or video ID')
      return
    }
    setError(null)
    setVideoId(id)
    setInputValue(id)
    history.replaceState(null, '', `?v=${id}`)
  }

  function handleReset() {
    timerRef.current.reset()
  }

  return (
    <main style={{
      minHeight: '100svh',
      background: '#09090b',
      color: '#f4f4f5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '896px' }}>

        {/* URL / ID input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: error ? '6px' : '12px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && loadVideo()}
            placeholder="YouTube URL or video ID"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${error ? '#ef4444' : '#3f3f46'}`,
              background: '#18181b',
              color: '#f4f4f5',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={loadVideo}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#3f3f46',
              color: '#f4f4f5',
              fontSize: '14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Load
          </button>
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: '13px', margin: '0 0 10px' }}>
            {error}
          </p>
        )}

        <YouTubePlayer
          videoId={videoId}
          timerRef={timerRef}
          fadeDurationMs={fadeDurationMs}
        />

        <FadeControls
          timerRef={timerRef}
          fadeDurationMs={fadeDurationMs}
          onDurationChange={setFadeDurationMs}
          onReset={handleReset}
        />

      </div>
    </main>
  )
}

export default App
