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
        videoId,
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
              onLoopCountChange?.(loopCountRef.current)
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
  }, [videoId, onLoopCountChange])

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
      <div
        ref={wrapperRef}
        style={{ position: 'absolute', inset: 0 }}
      />
    </div>
  )
}
