export type FadeState = 'idle' | 'delaying' | 'fading' | 'complete'

export interface FadeConfig {
  durationMs: number
}
