import {
  ipcMain,
  nativeImage,
  type BrowserWindow,
  type IpcMainEvent,
  type NativeImage
} from 'electron'
import type { PlaybackState, PlayerCommand } from '../shared/player'

type Point = [number, number]
type Shape = Point[]

const ICON_SIZE = 16
const SCALES = [1, 1.25, 1.5, 2]
const VIEW_FROM = 4
const VIEW_SIZE = 16
const SAMPLES = 4

const rect = (x: number, y: number, width: number, height: number): Shape => [
  [x, y],
  [x + width, y],
  [x + width, y + height],
  [x, y + height]
]

const SHAPES: Record<'previous' | 'next' | 'play' | 'pause', Shape[]> = {
  previous: [
    [
      [18, 6],
      [18, 18],
      [9, 12]
    ],
    rect(5, 6, 2, 12)
  ],
  next: [
    [
      [6, 6],
      [15, 12],
      [6, 18]
    ],
    rect(17, 6, 2, 12)
  ],
  play: [
    [
      [8, 5],
      [19, 12],
      [8, 19]
    ]
  ],
  pause: [rect(6, 5, 4, 14), rect(14, 5, 4, 14)]
}

const inside = (shape: Shape, x: number, y: number): boolean => {
  let sign = 0
  for (let i = 0; i < shape.length; i++) {
    const [ax, ay] = shape[i]
    const [bx, by] = shape[(i + 1) % shape.length]
    const cross = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax))
    if (cross === 0) continue
    if (sign !== 0 && cross !== sign) return false
    sign = cross
  }
  return true
}

const draw = (shapes: Shape[]): NativeImage => {
  const image = nativeImage.createEmpty()
  for (const scale of SCALES) {
    const size = Math.round(ICON_SIZE * scale)
    const pixels = Buffer.alloc(size * size * 4)
    for (let py = 0; py < size; py++) {
      for (let px = 0; px < size; px++) {
        let hits = 0
        for (let sy = 0; sy < SAMPLES; sy++) {
          for (let sx = 0; sx < SAMPLES; sx++) {
            const x = VIEW_FROM + ((px + (sx + 0.5) / SAMPLES) / size) * VIEW_SIZE
            const y = VIEW_FROM + ((py + (sy + 0.5) / SAMPLES) / size) * VIEW_SIZE
            if (shapes.some((shape) => inside(shape, x, y))) hits++
          }
        }
        const alpha = Math.round((hits / SAMPLES ** 2) * 255)
        const offset = (py * size + px) * 4
        pixels.fill(alpha, offset, offset + 4)
      }
    }
    image.addRepresentation({ scaleFactor: scale, width: size, height: size, buffer: pixels })
  }
  return image
}

const isPlaybackState = (value: unknown): value is PlaybackState => {
  const state = value as Partial<PlaybackState> | null
  return typeof state?.playing === 'boolean' && typeof state.hasTrack === 'boolean'
}

export const registerThumbar = (window: BrowserWindow): void => {
  const icons = {
    previous: draw(SHAPES.previous),
    next: draw(SHAPES.next),
    play: draw(SHAPES.play),
    pause: draw(SHAPES.pause)
  }
  let state: PlaybackState = { playing: false, hasTrack: false }

  const send = (command: PlayerCommand): void => {
    if (!window.isDestroyed()) window.webContents.send('player:command', command)
  }

  const update = (): void => {
    if (window.isDestroyed() || !window.isVisible()) return
    const flags = state.hasTrack ? [] : ['disabled']
    window.setThumbarButtons([
      { tooltip: 'Previous', icon: icons.previous, flags, click: () => send('previous') },
      {
        tooltip: state.playing ? 'Pause' : 'Play',
        icon: state.playing ? icons.pause : icons.play,
        flags,
        click: () => send('toggle')
      },
      { tooltip: 'Next', icon: icons.next, flags, click: () => send('next') }
    ])
  }

  const onState = (event: IpcMainEvent, value: unknown): void => {
    if (event.sender !== window.webContents || !isPlaybackState(value)) return
    state = { playing: value.playing, hasTrack: value.hasTrack }
    update()
  }

  ipcMain.on('player:state', onState)
  window.on('show', update)
  window.on('closed', () => ipcMain.removeListener('player:state', onState))
}
