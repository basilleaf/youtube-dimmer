declare namespace YT {
  interface PlayerVars {
    autoplay?: 0 | 1
    controls?: 0 | 1 | 2
    enablejsapi?: 0 | 1
    fs?: 0 | 1
    modestbranding?: 0 | 1
    rel?: 0 | 1
  }

  interface PlayerEvent {
    target: Player
  }

  interface OnStateChangeEvent extends PlayerEvent {
    data: number
  }

  interface OnErrorEvent extends PlayerEvent {
    data: number
  }

  interface Events {
    onReady?: (event: PlayerEvent) => void
    onStateChange?: (event: OnStateChangeEvent) => void
    onError?: (event: OnErrorEvent) => void
  }

  interface PlayerOptions {
    videoId?: string
    width?: number | string
    height?: number | string
    playerVars?: PlayerVars
    events?: Events
  }

  const PlayerState: {
    readonly UNSTARTED: -1
    readonly ENDED: 0
    readonly PLAYING: 1
    readonly PAUSED: 2
    readonly BUFFERING: 3
    readonly CUED: 5
  }

  class Player {
    constructor(elementOrId: string | HTMLElement, options: PlayerOptions)
    playVideo(): void
    pauseVideo(): void
    stopVideo(): void
    seekTo(seconds: number, allowSeekAhead?: boolean): void
    loadVideoById(videoId: string, startSeconds?: number): void
    cueVideoById(videoId: string, startSeconds?: number): void
    getPlayerState(): number
    getCurrentTime(): number
    getDuration(): number
    destroy(): void
  }
}

interface Window {
  YT?: {
    Player: typeof YT.Player
    PlayerState: typeof YT.PlayerState
  }
  onYouTubeIframeAPIReady?: () => void
}
