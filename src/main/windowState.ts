import { app, screen, type BrowserWindow, type Rectangle } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

type WindowState = { bounds: Rectangle; maximized: boolean }

export const DEFAULT_SIZE = { width: 1280, height: 820 }
export const MIN_SIZE = { width: 900, height: 600 }
const SCREEN_MARGIN = 80

const stateFile = (): string => join(app.getPath('userData'), 'window-state.json')

const readState = (): WindowState | null => {
  try {
    return JSON.parse(readFileSync(stateFile(), 'utf8')) as WindowState
  } catch {
    return null
  }
}

const isVisible = (bounds: Rectangle): boolean => {
  const area = screen.getDisplayMatching(bounds).workArea
  const overlapX =
    Math.min(bounds.x + bounds.width, area.x + area.width) - Math.max(bounds.x, area.x)
  const overlapY =
    Math.min(bounds.y + bounds.height, area.y + area.height) - Math.max(bounds.y, area.y)
  return overlapX >= 120 && overlapY >= 80
}

export const initialState = (): { bounds: Partial<Rectangle>; maximized: boolean } => {
  const saved = readState()
  if (saved?.bounds && isVisible(saved.bounds)) {
    return {
      bounds: {
        ...saved.bounds,
        width: Math.max(MIN_SIZE.width, saved.bounds.width),
        height: Math.max(MIN_SIZE.height, saved.bounds.height)
      },
      maximized: saved.maximized
    }
  }
  const area = screen.getPrimaryDisplay().workArea
  return {
    bounds: {
      width: Math.max(MIN_SIZE.width, Math.min(DEFAULT_SIZE.width, area.width - SCREEN_MARGIN)),
      height: Math.max(MIN_SIZE.height, Math.min(DEFAULT_SIZE.height, area.height - SCREEN_MARGIN))
    },
    maximized: false
  }
}

export const trackState = (window: BrowserWindow): void => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const save = (): void => {
    clearTimeout(timer)
    if (window.isDestroyed() || window.isMinimized()) return
    const state: WindowState = { bounds: window.getNormalBounds(), maximized: window.isMaximized() }
    try {
      writeFileSync(stateFile(), JSON.stringify(state))
    } catch {
      return
    }
  }
  const schedule = (): void => {
    clearTimeout(timer)
    timer = setTimeout(save, 500)
  }
  window.on('resize', schedule)
  window.on('move', schedule)
  window.on('maximize', save)
  window.on('unmaximize', save)
  window.on('close', save)
}
