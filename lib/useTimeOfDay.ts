import { useMemo } from 'react'

export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night'

export interface TimeAtmosphere {
  period: TimePeriod
  heroTag: string
  subtext: string
}

export function useTimeOfDay(): TimeAtmosphere {
  return useMemo(() => {
    const h = typeof window !== 'undefined' ? new Date().getHours() : 14
    if (h >= 6 && h < 11) return {
      period: 'morning',
      heroTag: 'Good morning — your match is waiting',
      subtext: 'Start your morning with intention.',
    }
    if (h >= 17 && h < 21) return {
      period: 'evening',
      heroTag: 'Tonight could change everything',
      subtext: 'The evening is when connections deepen.',
    }
    if (h >= 21 || h < 6) return {
      period: 'night',
      heroTag: 'The best matches happen at night',
      subtext: 'Something about the quiet makes it real.',
    }
    return {
      period: 'afternoon',
      heroTag: 'AI-Powered Dating That Actually Works',
      subtext: 'No more wasted dates. No more mismatched connections.',
    }
  }, [])
}
