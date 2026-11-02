import type { Rgb } from './palette'

export type Bands = { bass: number; lowMid: number; mid: number; high: number }

export type Frame = {
  dt: number
  bands: Bands
  kick: number
  level: number
  palette: Rgb[]
}

type Hue = 'red' | 'deep' | 'cover' | 'coverAlt'

const RED: Rgb = [255, 59, 74]
const DEEP: Rgb = [150, 12, 30]
const COVER_TINT = 0.12

type Light = {
  band: keyof Bands
  size: number
  reach: [number, number]
  speed: [number, number]
  phase: [number, number]
  hue: Hue
}

const LIGHTS: Light[] = [
  { band: 'bass', size: 0.6, reach: [0.3, 0.2], speed: [0.23, 0.17], phase: [0, 1.3], hue: 'red' },
  {
    band: 'bass',
    size: 0.55,
    reach: [0.34, 0.24],
    speed: [0.19, 0.27],
    phase: [2.1, 0.4],
    hue: 'cover'
  },
  {
    band: 'lowMid',
    size: 0.4,
    reach: [0.4, 0.3],
    speed: [0.31, 0.23],
    phase: [4.2, 2.8],
    hue: 'coverAlt'
  },
  {
    band: 'mid',
    size: 0.32,
    reach: [0.44, 0.32],
    speed: [0.37, 0.29],
    phase: [1.1, 5],
    hue: 'cover'
  },
  {
    band: 'mid',
    size: 0.28,
    reach: [0.42, 0.36],
    speed: [0.27, 0.41],
    phase: [3.3, 3.9],
    hue: 'deep'
  },
  {
    band: 'high',
    size: 0.18,
    reach: [0.46, 0.38],
    speed: [0.47, 0.39],
    phase: [5.5, 0.9],
    hue: 'coverAlt'
  },
  {
    band: 'high',
    size: 0.15,
    reach: [0.47, 0.41],
    speed: [0.53, 0.43],
    phase: [0.7, 2.2],
    hue: 'red'
  }
]

const SPARKS = 14
const BRIGHTNESS = 0.9

type Spark = { x: number; y: number; vx: number; vy: number; size: number; phase: number }

const mix = ([r, g, b]: Rgb, [r2, g2, b2]: Rgb, amount: number): Rgb => [
  r + (r2 - r) * amount,
  g + (g2 - g) * amount,
  b + (b2 - b) * amount
]

const glow = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  [r, g, b]: Rgb,
  alpha: number
): void => {
  if (alpha <= 0.002 || radius <= 0) return
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
  gradient.addColorStop(0.45, `rgba(${r},${g},${b},${alpha * 0.4})`)
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
  context.fillStyle = gradient
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

export class Scene {
  private time = 0
  private sparks: Spark[] = Array.from({ length: SPARKS }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.04,
    vy: -0.01 - Math.random() * 0.03,
    size: 0.012 + Math.random() * 0.02,
    phase: Math.random() * Math.PI * 2
  }))

  draw(context: CanvasRenderingContext2D, width: number, height: number, frame: Frame): void {
    context.globalCompositeOperation = 'source-over'
    context.clearRect(0, 0, width, height)
    if (frame.level < 0.003) return
    context.globalCompositeOperation = 'screen'

    const { bands, kick, dt } = frame
    const level = frame.level * BRIGHTNESS
    const cover = mix(frame.palette[0] ?? RED, RED, COVER_TINT)
    const hues: Record<Hue, Rgb> = {
      red: RED,
      deep: DEEP,
      cover,
      coverAlt: mix(frame.palette[1] ?? DEEP, RED, COVER_TINT)
    }
    const unit = Math.min(width, height)
    const energy = bands.bass * 0.45 + bands.lowMid * 0.25 + bands.mid * 0.2 + bands.high * 0.1
    this.time += dt * (0.2 + energy * 1.1 + kick * 0.6)

    for (const light of LIGHTS) {
      const value = bands[light.band]
      const punch = light.band === 'bass' ? kick * 0.18 : kick * 0.06
      const x =
        width * (0.5 + light.reach[0] * Math.sin(this.time * light.speed[0] + light.phase[0]))
      const y =
        height * (0.48 + light.reach[1] * Math.cos(this.time * light.speed[1] + light.phase[1]))
      const radius = unit * light.size * (0.75 + value * 0.5 + punch)
      const alpha = (0.05 + value * 0.24 + punch * 0.5) * level
      glow(context, x, y, radius, hues[light.hue], alpha)
    }

    for (const [index, spark] of this.sparks.entries()) {
      const drift = 0.4 + energy * 1.2
      spark.x = (spark.x + spark.vx * dt * drift + 1) % 1
      spark.y = (spark.y + spark.vy * dt * drift + 1) % 1
      const shimmer = 0.6 + 0.4 * Math.sin(this.time * 2.5 + spark.phase)
      const alpha = (0.03 + bands.high * 0.32) * shimmer * level
      const radius = unit * spark.size * (0.75 + bands.high * 0.5)
      const tint = mix(
        index % 3 === 0 ? RED : index % 3 === 1 ? cover : hues.coverAlt,
        [255, 255, 255],
        0.35
      )
      glow(context, spark.x * width, spark.y * height, radius, tint, alpha)
    }
  }
}
