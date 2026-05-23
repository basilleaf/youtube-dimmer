import { useEffect, useRef, useState } from 'react'
import { loadYouTubeAPI } from '../lib/youtube'

interface Props {
  videoId: string
  onLoopCountChange?: (count: number) => void
}

const fsAvailable =
  typeof document !== 'undefined' &&
  ('requestFullscreen' in document.documentElement ||
    'webkitRequestFullscreen' in document.documentElement)

function enterFullscreen(el: HTMLElement) {
  if (el.requestFullscreen) {
    el.requestFullscreen()
  } else {
    (el as HTMLElement & { webkitRequestFullscreen(): void }).webkitRequestFullscreen()
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else {
    (document as Document & { webkitExitFullscreen(): void }).webkitExitFullscreen()
  }
}

function isFullscreenEl(el: HTMLElement | null) {
  return (
    document.fullscreenElement === el ||
    (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement === el
  )
}

export function YouTubePlayer({ videoId, onLoopCountChange }: Props) {
  const playerWrapRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const loopCountRef = useRef(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const onLoopCountChangeRef = useRef(onLoopCountChange)
  onLoopCountChangeRef.current = onLoopCountChange

  const videoIdRef = useRef(videoId)
  videoIdRef.current = videoId

  // Create the player once on mount
  useEffect(() => {
    const container = wrapperRef.current
    if (!container) return
    let cancelled = false

    loadYouTubeAPI().then(() => {
      if (cancelled || !container.isConnected) return

      const target = document.createElement('div')
      container.innerHTML = ''
      container.appendChild(target)

      playerRef.current = new window.YT!.Player(target, {
        videoId: videoIdRef.current,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          fs: 0,
        },
        events: {
          onStateChange(event) {
            if (event.data === window.YT!.PlayerState.ENDED) {
              loopCountRef.current += 1
              onLoopCountChangeRef.current?.(loopCountRef.current)
              event.target.seekTo(0, true)
              event.target.playVideo()
            }
          },
        },
      })
    })

    return () => {
      cancelled = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load new video without recreating the player
  useEffect(() => {
    if (!playerRef.current) return
    loopCountRef.current = 0
    playerRef.current.loadVideoById(videoId)
  }, [videoId])

  // Track fullscreen state
  useEffect(() => {
    function handleChange() {
      setIsFullscreen(isFullscreenEl(playerWrapRef.current))
    }
    document.addEventListener('fullscreenchange', handleChange)
    document.addEventListener('webkitfullscreenchange', handleChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleChange)
      document.removeEventListener('webkitfullscreenchange', handleChange)
    }
  }, [])

  function toggleFullscreen() {
    if (!playerWrapRef.current) return
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen(playerWrapRef.current)
    }
  }

  return (
    <div
      ref={playerWrapRef}
      id="player-wrap"
      style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}
    >
      {/* YT iframe target — replaced by iframe on mount */}
      <div ref={wrapperRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Fade overlay — opacity 0.3 temporarily; driven by fade timer in Step 4 */}
      <div
        id="fade-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background: '#000',
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Custom fullscreen button */}
      {fsAvailable && (
        <button
          id="fullscreen-btn"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            zIndex: 2,
            background: 'rgba(0,0,0,0.6)',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            padding: '6px 7px',
            cursor: 'pointer',
            lineHeight: 0,
          }}
        >
          {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
        </button>
      )}
    </div>
  )
}

function ExpandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

function CompressIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="10" y1="14" x2="3" y2="21" />
      <line x1="21" y1="3" x2="14" y2="10" />
    </svg>
  )
}
