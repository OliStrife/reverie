import type { Bands } from './scene'

const BAND_RANGES: Record<keyof Bands, [number, number]> = {
  bass: [35, 140],
  lowMid: [140, 500],
  mid: [500, 2000],
  high: [2000, 9000]
}
const BANDS = Object.keys(BAND_RANGES) as (keyof Bands)[]

const KICK_RANGE: [number, number] = [35, 160]
const SILENCE = 0.06
const KICK_FACTOR = 2
const KICK_MIN_FLUX = 0.02
const KICK_GAP_MS = 250
const FLUX_STEP = 1 / 60

const ease = (dt: number, rate: number): number => 1 - Math.exp(-dt * rate)
const clamp = (value: number): number => Math.min(1, Math.max(0, value))

const binRange = ([from, to]: [number, number], binHz: number, count: number): [number, number] => [
  Math.max(1, Math.floor(from / binHz)),
  Math.min(count - 1, Math.ceil(to / binHz))
]

const average = (bins: Uint8Array, [from, to]: [number, number]): number => {
  let sum = 0
  for (let i = from; i <= to; i++) sum += bins[i]
  return sum / (to - from + 1) / 255
}

export class Listener {
  bands: Bands = { bass: 0, lowMid: 0, mid: 0, high: 0 }
  kick = 0
  kicks = 0

  private stats = Object.fromEntries(
    BANDS.map((band) => [band, { mean: 0.5, variance: 0.01 }])
  ) as Record<keyof Bands, { mean: number; variance: number }>
  private previousLow: Float32Array | null = null
  private fluxAverage = 0
  private fluxClock = 0
  private lastKick = -Infinity
  private kickTarget = 0

  update(bins: Uint8Array | null, sampleRate: number, dt: number, now: number): void {
    const binHz = sampleRate / 2 / (bins?.length ?? 1024)

    for (const band of BANDS) {
      let target = 0
      if (bins) {
        const value = average(bins, binRange(BAND_RANGES[band], binHz, bins.length))
        const stat = this.stats[band]
        stat.mean += (value - stat.mean) * ease(dt, 0.8)
        stat.variance += ((value - stat.mean) ** 2 - stat.variance) * ease(dt, 0.8)
        const swing = 0.5 + (value - stat.mean) / (3 * Math.sqrt(stat.variance) + 0.03)
        target = value < SILENCE ? 0 : clamp(swing) * (0.55 + 0.45 * value)
      }
      const rate = target > this.bands[band] ? 7 : 3
      this.bands[band] += (target - this.bands[band]) * ease(dt, rate)
    }

    this.fluxClock += dt
    if (bins && this.fluxClock >= FLUX_STEP) {
      this.fluxClock = 0
      const [from, to] = binRange(KICK_RANGE, binHz, bins.length)
      const low = Float32Array.from(bins.subarray(from, to + 1), (value) => value / 255)
      if (this.previousLow?.length === low.length) {
        let flux = 0
        for (let i = 0; i < low.length; i++) flux += Math.max(0, low[i] - this.previousLow[i])
        flux /= low.length
        if (
          flux > this.fluxAverage * KICK_FACTOR + KICK_MIN_FLUX &&
          now - this.lastKick > KICK_GAP_MS
        ) {
          this.kickTarget = 1
          this.kicks++
          this.lastKick = now
        }
        this.fluxAverage += (flux - this.fluxAverage) * 0.08
      }
      this.previousLow = low
    }
    if (!bins) this.previousLow = null
    this.kick += (this.kickTarget - this.kick) * ease(dt, 14)
    this.kickTarget *= Math.exp(-dt * 4)
  }
}
