export type Rgb = [number, number, number]

export const RED_PALETTE: Rgb[] = [
  [255, 59, 74],
  [190, 18, 60],
  [255, 110, 70]
]

const SAMPLE = 32
const HUE_BUCKETS = 12
const COLORS = 3

const toHsl = ([r, g, b]: Rgb): [number, number, number] => {
  const [red, green, blue] = [r / 255, g / 255, b / 255]
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const light = (max + min) / 2
  if (max === min) return [0, 0, light]
  const d = max - min
  const sat = light > 0.5 ? d / (2 - max - min) : d / (max + min)
  const hue =
    max === red
      ? (green - blue) / d + (green < blue ? 6 : 0)
      : max === green
        ? (blue - red) / d + 2
        : (red - green) / d + 4
  return [hue / 6, sat, light]
}

const toRgb = (h: number, s: number, l: number): Rgb => {
  const k = (n: number): number => (n + h * 12) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number): number => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

const asGlow = (color: Rgb): Rgb => {
  const [h, s, l] = toHsl(color)
  return toRgb(h, Math.max(s, 0.7), Math.min(0.55, Math.max(0.42, l)))
}

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })

export type CoverColors = {
  glow: Rgb[]
  average: Rgb
}

export const RED_COLORS: CoverColors = { glow: RED_PALETTE, average: [255, 90, 101] }

const extract = async (url: string): Promise<CoverColors> => {
  const image = await loadImage(url)
  const canvas = new OffscreenCanvas(SAMPLE, SAMPLE)
  const context = canvas.getContext('2d')!
  context.drawImage(image, 0, 0, SAMPLE, SAMPLE)
  const pixels = context.getImageData(0, 0, SAMPLE, SAMPLE).data

  const buckets = Array.from({ length: HUE_BUCKETS }, () => ({ r: 0, g: 0, b: 0, weight: 0 }))
  const sum: Rgb = [0, 0, 0]
  for (let i = 0; i < pixels.length; i += 4) {
    const rgb: Rgb = [pixels[i], pixels[i + 1], pixels[i + 2]]
    sum[0] += rgb[0]
    sum[1] += rgb[1]
    sum[2] += rgb[2]
    const [h, s, l] = toHsl(rgb)
    if (s < 0.25 || l < 0.12 || l > 0.9) continue
    const weight = s * (1 - Math.abs(l - 0.5))
    const bucket = buckets[Math.floor(h * HUE_BUCKETS) % HUE_BUCKETS]
    bucket.r += rgb[0] * weight
    bucket.g += rgb[1] * weight
    bucket.b += rgb[2] * weight
    bucket.weight += weight
  }

  const found = buckets
    .filter((bucket) => bucket.weight > 1.5)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, COLORS)
    .map((bucket): Rgb =>
      asGlow([bucket.r / bucket.weight, bucket.g / bucket.weight, bucket.b / bucket.weight])
    )
  const count = pixels.length / 4
  return {
    glow: [...found, ...RED_PALETTE].slice(0, COLORS),
    average: [sum[0] / count, sum[1] / count, sum[2] / count]
  }
}

const cache = new Map<string, Promise<CoverColors>>()
const ready = new Map<string, CoverColors>()

export const coverColors = (url: string): Promise<CoverColors> => {
  let colors = cache.get(url)
  if (!colors) {
    colors = extract(url).catch(() => RED_COLORS)
    colors.then((found) => ready.set(url, found))
    cache.set(url, colors)
  }
  return colors
}

export const knownColors = (url: string): CoverColors | undefined => ready.get(url)

export const tintFrom = (average: Rgb): Rgb => {
  const [h, s] = toHsl(average)
  return toRgb(h, s < 0.05 ? 0 : Math.min(0.55, 0.1 + s * 1.4), 0.7)
}
