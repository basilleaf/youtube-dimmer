import { useEffect, useRef } from 'react'
import { loadYouTubeAPI } from '../lib/youtube'

interface Props {
  videoId: string
  onLoopCountChange?: (count: number) => void
}

export function YouTubePlayer({ videoId, onLoopCountChange }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const loopCountRef = useRef(0)

  // Keep callback in a ref so the player event handler never goes stale
  const onLoopCountChangeRef = useRef(onLoopCountChange)
  onLoopCountChangeRef.current = onLoopCountChange

  // Keep videoId in a ref so the async API-load callback gets the latest value
  const videoIdRef = useRef(videoId)
  videoIdRef.current = videoId

  // Create the player once on mount; clean up on unmount
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

  // When videoId prop changes after initial mount, load the new video without
  // destroying the player. If the player isn't ready yet, the API-load callback
  // above will use videoIdRef.current (the latest value) anyway.
  useEffect(() => {
    if (!playerRef.current) return
    loopCountRef.current = 0
    playerRef.current.loadVideoById(videoId)
  }, [videoId])

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
      <div ref={wrapperRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}
