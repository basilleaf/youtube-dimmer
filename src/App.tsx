import { YouTubePlayer } from './components/YouTubePlayer'

// "Me at the Zoo" — first YouTube video ever, always available
const DEFAULT_VIDEO_ID = 'jNQXAC9IVRw'

function App() {
  return (
    <main style={{
      minHeight: '100svh',
      background: '#09090b',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '896px' }}>
        <YouTubePlayer videoId={DEFAULT_VIDEO_ID} />
      </div>
    </main>
  )
}

export default App
