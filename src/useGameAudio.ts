import { useCallback, useRef, useState } from 'react'

type SoundCue = 'select' | 'open' | 'offer' | 'deal' | 'hold' | 'reject'

const CUES: Record<SoundCue, [number, number, number]> = {
  select: [220, 330, 0.08],
  open: [140, 90, 0.12],
  offer: [420, 620, 0.18],
  deal: [330, 880, 0.22],
  hold: [260, 190, 0.1],
  reject: [160, 110, 0.2],
}

export function useGameAudio() {
  const [muted, setMuted] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  const play = useCallback(
    (cue: SoundCue) => {
      if (muted || typeof window === 'undefined') return

      const AudioContextClass = window.AudioContext
      const context = audioContextRef.current ?? new AudioContextClass()
      audioContextRef.current = context

      const [startFrequency, endFrequency, duration] = CUES[cue]
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const now = context.currentTime

      oscillator.type = cue === 'deal' ? 'sine' : 'triangle'
      oscillator.frequency.setValueAtTime(startFrequency, now)
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration)
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + duration)
    },
    [muted],
  )

  return { muted, play, setMuted }
}
