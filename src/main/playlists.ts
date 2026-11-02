import { app, ipcMain } from 'electron'
import { createHash, randomUUID } from 'crypto'
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  COVER_ID,
  MAX_PLAYLIST_NAME,
  type CreatePlaylistResult,
  type Playlist
} from '../shared/playlists'
import { readJson, writeJson } from './jsonFile'
import { playlistCoversDir } from './media'

const MAX_COVER_BYTES = 4 * 1024 * 1024

const playlistsFile = (): string => join(app.getPath('userData'), 'playlists.json')

const FILE_VERSION = 2

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isPlaylist = (value: unknown): value is Playlist => {
  const item = value as Partial<Playlist> | null
  return (
    typeof item?.id === 'string' &&
    typeof item.name === 'string' &&
    isStringArray(item.trackIds) &&
    typeof item.createdAt === 'number'
  )
}

const cleanName = (name: unknown): string | null => {
  if (typeof name !== 'string') return null
  const trimmed = name.trim().slice(0, MAX_PLAYLIST_NAME)
  return trimmed || null
}

let playlists: Playlist[] | null = null

const save = (next: Playlist[]): Playlist[] => {
  playlists = next
  writeJson(playlistsFile(), { version: FILE_VERSION, playlists: next })
  return next
}

const getPlaylists = (): Playlist[] => {
  if (playlists) return playlists
  const saved = readJson(playlistsFile()) as { version?: number; playlists?: unknown[] } | null
  const loaded = (saved?.playlists ?? []).filter(isPlaylist).map((playlist) => ({
    ...playlist,
    coverId:
      typeof playlist.coverId === 'string' && COVER_ID.test(playlist.coverId)
        ? playlist.coverId
        : null
  }))
  if (!saved || (saved.version ?? 1) >= FILE_VERSION) {
    playlists = loaded
    return playlists
  }
  copyFileSync(playlistsFile(), join(app.getPath('userData'), 'playlists.v1.json'))
  return save(
    loaded.map((playlist) => ({ ...playlist, trackIds: [...playlist.trackIds].reverse() }))
  )
}

const update = (id: unknown, change: (playlist: Playlist) => Playlist): Playlist[] =>
  save(getPlaylists().map((playlist) => (playlist.id === id ? change(playlist) : playlist)))

const coverFile = (coverId: string): string => join(playlistCoversDir(), `${coverId}.jpg`)

const isJpeg = (bytes: Uint8Array): boolean =>
  bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff

const forgetCover = (coverId: string | null, list: Playlist[]): void => {
  if (coverId && !list.some((playlist) => playlist.coverId === coverId)) {
    rmSync(coverFile(coverId), { force: true })
  }
}

export const registerPlaylistHandlers = (): void => {
  ipcMain.handle('playlists:get', () => getPlaylists())

  ipcMain.handle('playlists:create', (_, name: unknown, trackIds: unknown) => {
    const clean = cleanName(name)
    if (!clean) return { playlists: getPlaylists(), created: null } satisfies CreatePlaylistResult
    const created: Playlist = {
      id: randomUUID(),
      name: clean,
      trackIds: isStringArray(trackIds) ? [...new Set(trackIds)] : [],
      coverId: null,
      createdAt: Date.now()
    }
    return { playlists: save([...getPlaylists(), created]), created } satisfies CreatePlaylistResult
  })

  ipcMain.handle('playlists:rename', (_, id: unknown, name: unknown) => {
    const clean = cleanName(name)
    return clean ? update(id, (playlist) => ({ ...playlist, name: clean })) : getPlaylists()
  })

  ipcMain.handle('playlists:delete', (_, id: unknown) => {
    const deleted = getPlaylists().find((playlist) => playlist.id === id)
    const next = save(getPlaylists().filter((playlist) => playlist.id !== id))
    forgetCover(deleted?.coverId ?? null, next)
    return next
  })

  ipcMain.handle('playlists:cover', (_, id: unknown, bytes: unknown) => {
    const playlist = getPlaylists().find((item) => item.id === id)
    if (!playlist) return getPlaylists()
    let coverId: string | null = null
    if (bytes !== null) {
      if (!(bytes instanceof Uint8Array) || bytes.length > MAX_COVER_BYTES || !isJpeg(bytes)) {
        return getPlaylists()
      }
      coverId = createHash('sha1').update(bytes).digest('hex').slice(0, 16)
      mkdirSync(playlistCoversDir(), { recursive: true })
      writeFileSync(coverFile(coverId), bytes)
    }
    const next = update(id, (item) => ({ ...item, coverId }))
    if (playlist.coverId !== coverId) forgetCover(playlist.coverId, next)
    return next
  })

  ipcMain.handle('playlists:add', (_, id: unknown, trackIds: unknown) => {
    if (!isStringArray(trackIds)) return getPlaylists()
    return update(id, (playlist) => {
      const added = [...new Set(trackIds)].filter((trackId) => !playlist.trackIds.includes(trackId))
      return { ...playlist, trackIds: [...added, ...playlist.trackIds] }
    })
  })

  ipcMain.handle('playlists:reorder', (_, id: unknown, trackIds: unknown) => {
    if (!isStringArray(trackIds)) return getPlaylists()
    return update(id, (playlist) => {
      const current = new Set(playlist.trackIds)
      const same =
        trackIds.length === playlist.trackIds.length &&
        new Set(trackIds).size === trackIds.length &&
        trackIds.every((trackId) => current.has(trackId))
      return same ? { ...playlist, trackIds: [...trackIds] } : playlist
    })
  })

  ipcMain.handle('playlists:remove', (_, id: unknown, trackIds: unknown) => {
    if (!isStringArray(trackIds)) return getPlaylists()
    return update(id, (playlist) => ({
      ...playlist,
      trackIds: playlist.trackIds.filter((trackId) => !trackIds.includes(trackId))
    }))
  })
}
