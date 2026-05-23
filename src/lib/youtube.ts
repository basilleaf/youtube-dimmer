const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/

export function extractVideoId(input: string): string | null {
  const s = input.trim()
  if (!s) return null

  if (VIDEO_ID_RE.test(s)) return s

  try {
    const url = new URL(s)
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.slice(1)
      return VIDEO_ID_RE.test(id) ? id : null
    }
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v')
      return id && VIDEO_ID_RE.test(id) ? id : null
    }
  } catch {
    // not a URL
  }

  return null
}

let apiPromise: Promise<void> | null = null

export function loadYouTubeAPI(): Promise<void> {
  if (apiPromise) return apiPromise

  apiPromise = new Promise<void>((resolve) => {
    if (window.YT?.Player) {
      resolve()
      return
    }

    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve()
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })

  return apiPromise
}
