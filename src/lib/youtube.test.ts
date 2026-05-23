import { extractVideoId } from './youtube'

const VALID_ID = 'jfKfPfyJRdk'

describe('extractVideoId', () => {
  it('returns a raw 11-char video ID unchanged', () => {
    expect(extractVideoId(VALID_ID)).toBe(VALID_ID)
  })

  it('handles IDs with underscores and dashes', () => {
    expect(extractVideoId('_dQw4w9WgXc')).toBe('_dQw4w9WgXc')
  })

  it('extracts ID from full youtube.com/watch URL', () => {
    expect(extractVideoId(`https://www.youtube.com/watch?v=${VALID_ID}`)).toBe(VALID_ID)
  })

  it('extracts ID from URL with extra params', () => {
    expect(extractVideoId(`https://www.youtube.com/watch?v=${VALID_ID}&t=120s&si=abc`)).toBe(VALID_ID)
  })

  it('extracts ID from youtu.be short URL', () => {
    expect(extractVideoId(`https://youtu.be/${VALID_ID}`)).toBe(VALID_ID)
  })

  it('extracts ID from youtu.be URL with query params', () => {
    expect(extractVideoId(`https://youtu.be/${VALID_ID}?t=30`)).toBe(VALID_ID)
  })

  it('trims leading and trailing whitespace', () => {
    expect(extractVideoId(`  ${VALID_ID}  `)).toBe(VALID_ID)
  })

  it('returns null for empty string', () => {
    expect(extractVideoId('')).toBeNull()
  })

  it('returns null for whitespace-only string', () => {
    expect(extractVideoId('   ')).toBeNull()
  })

  it('returns null for a string shorter than 11 chars', () => {
    expect(extractVideoId('abc')).toBeNull()
  })

  it('returns null for a string longer than 11 chars that is not a URL', () => {
    expect(extractVideoId('notavalidvideoidstring')).toBeNull()
  })

  it('returns null for a non-YouTube URL', () => {
    expect(extractVideoId(`https://example.com/watch?v=${VALID_ID}`)).toBeNull()
  })

  it('returns null for a youtube.com URL with no v param', () => {
    expect(extractVideoId('https://www.youtube.com/feed/trending')).toBeNull()
  })

  it('returns null for a youtu.be URL with no path', () => {
    expect(extractVideoId('https://youtu.be/')).toBeNull()
  })
})
