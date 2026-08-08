import { useCallback, useRef, useState } from 'react'

export type SoundCue =
  | 'intro'
  | 'select'
  | 'reveal'
  | 'ring'
  | 'counter'
  | 'deal'
  | 'hold'
  | 'reject'
  | 'win'
  | 'lose'

export function useGameAudio() {
  const [muted, setMuted] = useState(false)
  const contextRef = useRef<AudioContext | null>(null)

  const play = useCallback(
    (cue: SoundCue) => {
      if (muted || typeof window === 'undefined') return

      const context = contextRef.current ?? new AudioContext()
      contextRef.current = context
      void context.resume()
      const now = context.currentTime

      const tone = (
        frequency: number,
        start: number,
        duration: number,
        volume = 0.07,
        type: OscillatorType = 'sine',
        endFrequency?: number,
      ) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = type
        oscillator.frequency.setValueAtTime(frequency, now + start)
        if (endFrequency) {
          oscillator.frequency.exponentialRampToValueAtTime(
            endFrequency,
            now + start + duration,
          )
        }
        gain.gain.setValueAtTime(0.0001, now + start)
        gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.018)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(now + start)
        oscillator.stop(now + start + duration + 0.02)
      }

      const noise = (start: number, duration: number, volume = 0.045) => {
        const frameCount = Math.max(1, Math.floor(context.sampleRate * duration))
        const buffer = context.createBuffer(1, frameCount, context.sampleRate)
        const data = buffer.getChannelData(0)
        for (let index = 0; index < data.length; index += 1) {
          data[index] = Math.random() * 2 - 1
        }
        const source = context.createBufferSource()
        const filter = context.createBiquadFilter()
        const gain = context.createGain()
        source.buffer = buffer
        filter.type = 'bandpass'
        filter.frequency.value = 920
        filter.Q.value = 0.8
        gain.gain.setValueAtTime(volume, now + start)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
        source.connect(filter)
        filter.connect(gain)
        gain.connect(context.destination)
        source.start(now + start)
      }

      if (cue === 'intro') {
        ;[196, 247, 294, 392, 494].forEach((frequency, index) =>
          tone(frequency, index * 0.11, 0.42, 0.065, index === 4 ? 'sine' : 'triangle'),
        )
        tone(98, 0, 0.85, 0.055, 'sine')
      } else if (cue === 'select') {
        tone(330, 0, 0.1, 0.07, 'triangle', 440)
        tone(660, 0.07, 0.16, 0.045)
      } else if (cue === 'reveal') {
        noise(0, 0.28, 0.06)
        tone(640, 0, 0.3, 0.04, 'sawtooth', 110)
        tone(86, 0.22, 0.24, 0.1, 'sine')
      } else if (cue === 'ring') {
        ;[0, 0.16, 0.62, 0.78].forEach((start) => {
          tone(880, start, 0.11, 0.05, 'sine')
          tone(1100, start, 0.11, 0.035, 'sine')
        })
      } else if (cue === 'counter') {
        tone(280, 0, 0.16, 0.055, 'triangle', 420)
        tone(520, 0.12, 0.22, 0.06, 'triangle', 680)
      } else if (cue === 'deal' || cue === 'win') {
        ;[262, 330, 392, 523, 659].forEach((frequency, index) =>
          tone(frequency, index * 0.09, 0.46, 0.075, 'triangle'),
        )
        tone(1047, 0.42, 0.62, 0.055, 'sine')
      } else if (cue === 'hold') {
        tone(260, 0, 0.34, 0.075, 'sawtooth', 120)
        tone(110, 0.2, 0.28, 0.07, 'sine')
      } else if (cue === 'reject' || cue === 'lose') {
        tone(180, 0, 0.3, 0.09, 'square', 92)
        tone(120, 0.2, 0.36, 0.06, 'sawtooth', 72)
      }
    },
    [muted],
  )

  return { muted, play, setMuted }
}
