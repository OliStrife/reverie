import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { AddFoldersResult } from '../shared/folders'
import type { LibraryState, ScanProgress, Track } from '../shared/library'
import type { PlaybackState, PlayerCommand } from '../shared/player'
import type { CreatePlaylistResult, Playlist } from '../shared/playlists'

const subscribe = <T>(channel: string, callback: (value: T) => void): (() => void) => {
  const listener = (_: IpcRendererEvent, value: T): void => callback(value)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api = {
  getFolders: (): Promise<string[]> => ipcRenderer.invoke('folders:get'),
  addFolders: (): Promise<AddFoldersResult> => ipcRenderer.invoke('folders:add'),
  removeFolder: (folder: string): Promise<string[]> => ipcRenderer.invoke('folders:remove', folder),
  showFolder: (folder: string): Promise<void> => ipcRenderer.invoke('folders:show', folder),
  getLibrary: (): Promise<LibraryState> => ipcRenderer.invoke('library:get'),
  onTracks: (callback: (tracks: Track[]) => void) => subscribe('library:tracks', callback),
  onScan: (callback: (scan: ScanProgress | null) => void) => subscribe('library:scan', callback),
  getLyrics: (trackId: string): Promise<string | null> =>
    ipcRenderer.invoke('library:lyrics', trackId),
  getPlaylists: (): Promise<Playlist[]> => ipcRenderer.invoke('playlists:get'),
  createPlaylist: (name: string, trackIds: string[] = []): Promise<CreatePlaylistResult> =>
    ipcRenderer.invoke('playlists:create', name, trackIds),
  renamePlaylist: (id: string, name: string): Promise<Playlist[]> =>
    ipcRenderer.invoke('playlists:rename', id, name),
  deletePlaylist: (id: string): Promise<Playlist[]> => ipcRenderer.invoke('playlists:delete', id),
  addToPlaylist: (id: string, trackIds: string[]): Promise<Playlist[]> =>
    ipcRenderer.invoke('playlists:add', id, trackIds),
  removeFromPlaylist: (id: string, trackIds: string[]): Promise<Playlist[]> =>
    ipcRenderer.invoke('playlists:remove', id, trackIds),
  reorderPlaylist: (id: string, trackIds: string[]): Promise<Playlist[]> =>
    ipcRenderer.invoke('playlists:reorder', id, trackIds),
  setPlaylistCover: (id: string, jpeg: Uint8Array | null): Promise<Playlist[]> =>
    ipcRenderer.invoke('playlists:cover', id, jpeg),
  setPlaybackState: (state: PlaybackState): void => ipcRenderer.send('player:state', state),
  onPlayerCommand: (callback: (command: PlayerCommand) => void) =>
    subscribe('player:command', callback)
}

export type Api = typeof api

contextBridge.exposeInMainWorld('api', api)
