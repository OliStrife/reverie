import { useEffect, useRef } from 'react'
import { existingAnalyser, getAnalyser } from '../audio'
import { useCoverColors } from '../hooks/useCoverColors'
import type { Rgb } from '../visualizer/palette'
import { Listener } from '../visualizer/listener'
import { Scene } from '../visualizer/scene'
import { usePlayer } from './PlayerProvider'

const RESOLUTION = 1 / 3

const prefersStill = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches

const css = ([r, g, b]: Rgb): string => `rgb(${r} ${g} ${b})`

function Visualizer({ open }: { open: boolean }): React.JSX.Element {
  const { playing, current } = usePlayer()
  const canvas = useRef<HTMLCanvasElement>(null)
  const active = open && playing

  const palette = useCoverColors(current?.coverId ?? null).glow

  const latestPalette = useRef(palette)
  useEffect(() => {
    latestPalette.current = palette
  })

  const scene = useRef<Scene | null>(null)
  const listener = useRef<Listener | null>(null)
  const level = useRef(0)

  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    const panel = element?.parentElement
    if (!open) {
      panel?.style.removeProperty('--bass')
      panel?.style.removeProperty('--kick')
      return
    }
    if (!element || !context || !panel || prefersStill()) return
    scene.current ??= new Scene()
    listener.current ??= new Listener()
    const lights = scene.current
    const ears = listener.current
    const analyser = active ? getAnalyser() : existingAnalyser()
    const bins = analyser ? new Uint8Array(analyser.frequencyBinCount) : null
    let frame = 0
    let last = performance.now()

    const tick = (now: number): void => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const width = Math.max(1, Math.round(element.clientWidth * RESOLUTION))
      const height = Math.max(1, Math.round(element.clientHeight * RESOLUTION))
      if (element.width !== width || element.height !== height) {
        element.width = width
        element.height = height
      }

      const listening = active && analyser && bins
      if (listening) analyser.getByteFrequencyData(bins)
      ears.update(listening ? bins : null, analyser?.context.sampleRate ?? 48000, dt, now)
      level.current += ((active ? 1 : 0) - level.current) * (1 - Math.exp(-dt * (active ? 2 : 1.4)))

      lights.draw(context, width, height, {
        dt,
        bands: ears.bands,
        kick: ears.kick,
        level: level.current,
        palette: latestPalette.current
      })
      panel.style.setProperty('--bass', (ears.bands.bass * level.current).toFixed(3))
      panel.style.setProperty('--kick', (ears.kick * level.current).toFixed(3))

      if (!active && level.current < 0.005) return
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [open, active])

  return (
    <>
      <canvas ref={canvas} className="visualizer" aria-hidden="true" />
      <span
        className="cover-glow"
        aria-hidden="true"
        style={
          {
            '--glow-a': css(palette[0]),
            '--glow-b': css(palette[1] ?? palette[0])
          } as React.CSSProperties
        }
      />
    </>
  )
}

export default Visualizer
