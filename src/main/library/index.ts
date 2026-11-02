import { app, BrowserWindow, ipcMain } from 'electron'
import { readdirSync } from 'fs'
import { readFile, rename, writeFile } from 'fs/promises'
import { basename, extname, join } from 'path'
import type { Worker } from 'worker_threads'
import createScanWorker from './scanWorker?nodeWorker'
import type { ScanInput, ScanMessage } from './scanWorker'
import type { LibraryState, ScanProgress, Track } from '../../shared/library'
import { coversDir, saveSongCover } from '../media'
import { isInside } from '../paths'
import { getSettings } from '../settings'

const CACHE_VERSION = 2
const LIVE_UPDATE_MS = 300

let tracks: Track[] = []
let pathsById = new Map<string, string>()
let scan: ScanProgress | null = null
let worker: Worker | null = null
let ready: Promise<void> = Promise.resolve()

const cacheFile = (): string => join(app.getPath('userData'), 'library.json')

const loadCache = async (): Promise<Track[]> => {
  try {
    const saved = JSON.parse(await readFile(cacheFile(), 'utf8'))
    return saved.version === CACHE_VERSION && Array.isArray(saved.tracks) ? saved.tracks : []
  } catch {
    return []
  }
}

const saveCache = async (list: Track[]): Promise<void> => {
  const file = cacheFile()
  try {
    await writeFile(`${file}.tmp`, JSON.stringify({ version: CACHE_VERSION, tracks: list }))
    await rename(`${file}.tmp`, file)
  } catch (error) {
    console.error('Could not save the library cache', error)
  }
}

const savedCovers = (): string[] => {
  try {
    return readdirSync(coversDir()).map((file) => basename(file, extname(file)))
  } catch {
    return []
  }
}

const broadcast = (channel: string, payload: unknown): void => {
  for (const window of BrowserWindow.getAllWindows()) window.webContents.send(channel, payload)
}

const indexTracks = (next: Track[]): void => {
  tracks = next
  pathsById = new Map(next.map((track) => [track.id, track.path]))
}

const setTracks = (next: Track[]): void => {
  indexTracks(next)
  broadcast('library:tracks', tracks)
}

export const trackPath = (id: string): string | undefined => pathsById.get(id)

const setScan = (next: ScanProgress | null): void => {
  scan = next
  broadcast('library:scan', scan)
}

export const rescanLibrary = (): void => {
  worker?.terminate()
  worker = null
  const { folders } = getSettings()

  const kept = tracks.filter((track) => folders.some((folder) => isInside(track.path, folder)))
  if (kept.length !== tracks.length) setTracks(kept)
  if (folders.length === 0) {
    setScan(null)
    void saveCache([])
    return
  }

  const live = kept.length === 0
  const found: Track[] = []
  let lastUpdate = 0
  const current = createScanWorker({
    workerData: { folders, cached: kept, savedCovers: savedCovers() } satisfies ScanInput
  })
  worker = current
  setScan({ done: 0, total: 0 })

  current.on('message', (message: ScanMessage) => {
    if (worker !== current) return
    if (message.type === 'cover') {
      saveSongCover(message.id, message.data)
      return
    }
    if (message.type === 'progress') {
      found.push(...message.tracks)
      setScan({ done: message.done, total: message.total })
      if (live && Date.now() - lastUpdate > LIVE_UPDATE_MS) {
        lastUpdate = Date.now()
        setTracks([...found])
      }
      return
    }
    worker = null
    setTracks(found)
    setScan(null)
    void saveCache(found)
  })

  current.on('error', (error) => {
    if (worker !== current) return
    worker = null
    setScan(null)
    console.error('Library scan failed', error)
  })
}

export const startLibrary = (): void => {
  ready = loadCache().then((cached) => {
    indexTracks(cached)
    rescanLibrary()
  })
}

export const registerLibraryHandlers = (): void => {
  ipcMain.handle('library:get', async (): Promise<LibraryState> => {
    await ready
    return { tracks, scan }
  })
}
