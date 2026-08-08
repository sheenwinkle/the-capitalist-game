import { useCallback, useRef, useState } from 'react'

export type SoundCue =
  | 'transition'
  | 'round'
  | 'select'
  | 'reveal'
  | 'eliminate'
  | 'offerPrompt'
  | 'deal'
  | 'noDeal'
  | 'finalReveal'
  | 'champion'
  | 'clown'

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
        volume = 0.06,
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
        oscillator.stop(now + start + duration + 0.03)
      }

      const noise = (
        start: number,
        duration: number,
        volume = 0.04,
        frequency = 900,
      ) => {
        const frames = Math.max(1, Math.floor(context.sampleRate * duration))
        const buffer = context.createBuffer(1, frames, context.sampleRate)
        const data = buffer.getChannelData(0)
        for (let index = 0; index < data.length; index += 1) {
          data[index] = Math.random() * 2 - 1
        }
        const source = context.createBufferSource()
        const filter = context.createBiquadFilter()
        const gain = context.createGain()
        source.buffer = buffer
        filter.type = 'bandpass'
        filter.frequency.value = frequency
        filter.Q.value = 0.8
        gain.gain.setValueAtTime(volume, now + start)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)
        source.connect(filter)
        filter.connect(gain)
        gain.connect(context.destination)
        source.start(now + start)
      }

      if (cue === 'transition') {
        noise(0, 0.42, 0.055, 1250)
        tone(130, 0, 0.42, 0.045, 'sawtooth', 520)
        tone(620, 0.3, 0.18, 0.035, 'triangle')
      } else if (cue === 'round') {
        ;[196, 247, 294, 392, 494, 587].forEach((frequency, index) => {
          tone(frequency, index * 0.085, 0.34, 0.065, 'triangle')
        })
        tone(98, 0, 0.72, 0.07, 'sine')
        noise(0.42, 0.22, 0.035, 1800)
      } else if (cue === 'select') {
        tone(320, 0, 0.12, 0.07, 'triangle', 520)
        tone(760, 0.1, 0.2, 0.05, 'sine')
      } else if (cue === 'reveal') {
        noise(0, 0.3, 0.065, 1200)
        tone(720, 0, 0.34, 0.055, 'sawtooth', 130)
        tone(98, 0.25, 0.35, 0.11, 'sine')
        tone(392, 0.42, 0.45, 0.06, 'triangle')
      } else if (cue === 'eliminate') {
        tone(420, 0, 0.14, 0.08, 'square', 270)
        tone(250, 0.12, 0.22, 0.08, 'sawtooth', 92)
        noise(0.18, 0.22, 0.055, 420)
      } else if (cue === 'offerPrompt') {
        ;[0, 0.16, 0.58, 0.74].forEach((start) => {
          tone(820, start, 0.11, 0.055, 'sine')
          tone(1080, start, 0.11, 0.04, 'sine')
        })
        tone(82, 0.9, 0.6, 0.07, 'sine')
      } else if (cue === 'deal') {
        noise(0, 0.16, 0.04, 1900)
        ;[262, 330, 392, 523].forEach((frequency, index) => {
          tone(frequency, index * 0.1, 0.42, 0.075, 'triangle')
        })
      } else if (cue === 'noDeal') {
        tone(310, 0, 0.22, 0.08, 'sawtooth', 105)
        tone(92, 0.17, 0.34, 0.09, 'sine')
        noise(0.18, 0.2, 0.035, 520)
      } else if (cue === 'finalReveal') {
        noise(0, 0.48, 0.06, 1350)
        tone(110, 0, 0.7, 0.08, 'sine')
        tone(220, 0.26, 0.52, 0.06, 'triangle', 660)
        tone(880, 0.65, 0.5, 0.055, 'sine')
      } else if (cue === 'champion') {
        const notes = [196, 262, 330, 392, 523, 659, 784, 1047]
        notes.forEach((frequency, index) => {
          tone(frequency, index * 0.13, 0.52, 0.07, 'triangle')
          if (index % 2 === 0) noise(index * 0.13, 0.08, 0.03, 110)
        })
        tone(131, 0, 1.45, 0.06, 'sawtooth')
        tone(523, 1.05, 0.9, 0.075, 'sine')
      } else if (cue === 'clown') {
        tone(330, 0, 0.2, 0.08, 'square', 190)
        tone(180, 0.18, 0.34, 0.09, 'sawtooth', 72)
        tone(520, 0.56, 0.18, 0.075, 'square', 390)
        tone(140, 0.75, 0.46, 0.07, 'sine', 64)
      }
    },
    [muted],
  )

  return { muted, play, setMuted }
}
