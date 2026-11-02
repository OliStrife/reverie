import { createHash } from 'node:crypto'
import { readdir, stat } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { parentPort, workerData } from 'node:worker_threads'
import { parseFile } from 'music-metadata'
import { AUDIO_EXTENSIONS, type Track } from '../../shared/library'

export type ScanInput = {
  folders: string[]
  cached: Track[]
  savedCovers: string[]
}

export type ScanMessage =
  | { type: 'progress'; done: number; total: number; tracks: Track[] }
  | { type: 'cover'; id: string; data: Uint8Array }
  | { type: 'done' }

type FileInfo = { size: number; mtime: number; birthtime: number }

const REPORT_EVERY_MS = 200
const PARALLEL_READS = 4

const walk = async (dir: string, files: string[]): Promise<void> => {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await walk(path, files)
    else if (entry.isFile() && AUDIO_EXTENSIONS.includes(extname(entry.name).toLowerCase())) {
      files.push(path)
    }
  }
}

const shortHash = (data: string | Uint8Array): string =>
  createHash('sha1').update(data).digest('hex').slice(0, 16)

const trackId = (path: string): string => shortHash(path.toLowerCase())

let savedCovers = new Set<string>()

const coverOf = (picture: { data: Uint8Array } | undefined): string | null => {
  if (!picture || picture.data.length === 0) return null
  const id = shortHash(picture.data)
  if (!savedCovers.has(id)) {
    savedCovers.add(id)
    parentPort!.postMessage({ type: 'cover', id, data: picture.data.slice() } as ScanMessage)
  }
  return id
}

const fromFileName = (path: string): { title: string; artist: string | null } => {
  const name = basename(path, extname(path)).replace(/_/g, ' ').trim()
  const [artist, ...rest] = name.split(' - ')
  return rest.length > 0
    ? { title: rest.join(' - ').trim(), artist: artist.trim() }
    : { title: name, artist: null }
}

const readTrack = async (path: string, info: FileInfo, addedAt: number): Promise<Track> => {
  const meta = await parseFile(path, {
    duration: false,
    skipPostHeaders: true
  }).catch(() => null)
  const tags = meta?.common
  const name = fromFileName(path)
  return {
    id: trackId(path),
    path,
    title: tags?.title?.trim() || name.title,
    artist: tags?.artist?.trim() || tags?.albumartist?.trim() || name.artist || 'Unknown artist',
    album: tags?.album?.trim() || basename(dirname(path)),
    year: tags?.year ?? null,
    trackNo: tags?.track.no ?? null,
    duration: meta?.format.duration ?? null,
    coverId: coverOf(tags?.picture?.[0]),
    size: info.size,
    mtime: info.mtime,
    addedAt
  }
}

const scanFile = async (path: string, cached: Track | undefined): Promise<Track | null> => {
  let info: FileInfo
  try {
    const stats = await stat(path)
    info = {
      size: stats.size,
      mtime: Math.round(stats.mtimeMs),
      birthtime: Math.round(stats.birthtimeMs || stats.mtimeMs)
    }
  } catch {
    return null
  }
  const unchanged = cached && cached.size === info.size && cached.mtime === info.mtime
  if (unchanged && (cached.coverId === null || savedCovers.has(cached.coverId))) return cached
  return readTrack(path, info, cached?.addedAt ?? info.birthtime)
}

const run = async ({ folders, cached, savedCovers: saved }: ScanInput): Promise<void> => {
  const port = parentPort!
  savedCovers = new Set(saved)
  const known = new Map(cached.map((track) => [track.path, track]))
  const files: string[] = []
  for (const folder of folders) await walk(folder, files)

  let done = 0
  let batch: Track[] = []
  let lastReport = 0
  const report = (force: boolean): void => {
    if (!force && Date.now() - lastReport < REPORT_EVERY_MS) return
    lastReport = Date.now()
    port.postMessage({ type: 'progress', done, total: files.length, tracks: batch } as ScanMessage)
    batch = []
  }
  report(true)

  let next = 0
  const reader = async (): Promise<void> => {
    while (next < files.length) {
      const path = files[next++]
      const track = await scanFile(path, known.get(path))
      if (track) batch.push(track)
      done++
      report(false)
    }
  }
  await Promise.all(Array.from({ length: PARALLEL_READS }, reader))
  report(true)
  port.postMessage({ type: 'done' } as ScanMessage)
}

run(workerData as ScanInput)
