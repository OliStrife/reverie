import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Playlist } from '../../../shared/playlists'
import { ConfirmDialog, NameDialog } from './Modal'

export type Playlists = {
  list: Playlist[] | null
  create: (trackIds?: string[]) => Promise<Playlist | null>
  rename: (playlist: Playlist) => void
  remove: (playlist: Playlist) => Promise<boolean>
  addTracks: (playlist: Playlist, trackIds: string[]) => Promise<void>
  removeTracks: (playlist: Playlist, trackIds: string[]) => Promise<void>
  reorder: (playlist: Playlist, trackIds: string[]) => Promise<void>
  setCover: (playlist: Playlist, image: File | null) => Promise<void>
}

type Dialog =
  | { kind: 'create'; trackIds: string[]; resolve: (playlist: Playlist | null) => void }
  | { kind: 'rename'; playlist: Playlist }
  | { kind: 'delete'; playlist: Playlist; resolve: (deleted: boolean) => void }

const PlaylistsContext = createContext<Playlists | null>(null)

export function usePlaylists(): Playlists {
  const playlists = useContext(PlaylistsContext)
  if (!playlists) throw new Error('usePlaylists needs a PlaylistsProvider')
  return playlists
}

const songs = (count: number): string => `${count} ${count === 1 ? 'song' : 'songs'}`

const COVER_SIZE = 640

const squareCover = async (image: File): Promise<Uint8Array> => {
  const bitmap = await createImageBitmap(image)
  const side = Math.min(bitmap.width, bitmap.height)
  const size = Math.min(COVER_SIZE, side)
  const canvas = new OffscreenCanvas(size, size)
  const context = canvas.getContext('2d')!
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size
  )
  bitmap.close()
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 })
  return new Uint8Array(await blob.arrayBuffer())
}

function PlaylistsProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [list, setList] = useState<Playlist[] | null>(null)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const reorders = useRef(0)

  useEffect(() => {
    window.api.getPlaylists().then(setList)
  }, [])

  const notify = useCallback((text: string) => {
    clearTimeout(toastTimer.current)
    setToast({ text, key: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }, [])

  const value = useMemo<Playlists>(
    () => ({
      list,
      create: (trackIds = []) =>
        new Promise((resolve) => setDialog({ kind: 'create', trackIds, resolve })),
      rename: (playlist) => setDialog({ kind: 'rename', playlist }),
      remove: (playlist) =>
        new Promise((resolve) => setDialog({ kind: 'delete', playlist, resolve })),
      addTracks: async (playlist, trackIds) => {
        const before = playlist.trackIds.length
        const next = await window.api.addToPlaylist(playlist.id, trackIds)
        setList(next)
        const added = (next.find((p) => p.id === playlist.id)?.trackIds.length ?? before) - before
        notify(
          added > 0
            ? `Added ${trackIds.length > 1 ? `${songs(added)} ` : ''}to ${playlist.name}`
            : `Already in ${playlist.name}`
        )
      },
      removeTracks: async (playlist, trackIds) => {
        setList(await window.api.removeFromPlaylist(playlist.id, trackIds))
        notify(`Removed from ${playlist.name}`)
      },
      reorder: async (playlist, trackIds) => {
        const turn = ++reorders.current
        setList((current) =>
          current
            ? current.map((item) => (item.id === playlist.id ? { ...item, trackIds } : item))
            : current
        )
        const saved = await window.api.reorderPlaylist(playlist.id, trackIds)
        if (turn === reorders.current) setList(saved)
      },
      setCover: async (playlist, image) => {
        let jpeg: Uint8Array | null = null
        if (image) {
          try {
            jpeg = await squareCover(image)
          } catch {
            notify(`Couldn't open ${image.name}`)
            return
          }
        }
        setList(await window.api.setPlaylistCover(playlist.id, jpeg))
      }
    }),
    [list, notify]
  )

  const closeDialog = (): void => {
    if (dialog?.kind === 'create') dialog.resolve(null)
    if (dialog?.kind === 'delete') dialog.resolve(false)
    setDialog(null)
  }

  return (
    <PlaylistsContext.Provider value={value}>
      {children}

      {dialog?.kind === 'create' && (
        <NameDialog
          title="New playlist"
          submitLabel="Create"
          onClose={closeDialog}
          onSubmit={async (name) => {
            const { playlists, created } = await window.api.createPlaylist(name, dialog.trackIds)
            setList(playlists)
            setDialog(null)
            dialog.resolve(created)
            if (created && dialog.trackIds.length > 0) notify(`Added to ${created.name}`)
          }}
        />
      )}

      {dialog?.kind === 'rename' && (
        <NameDialog
          title="Rename playlist"
          submitLabel="Save"
          initialName={dialog.playlist.name}
          onClose={closeDialog}
          onSubmit={async (name) => {
            setList(await window.api.renamePlaylist(dialog.playlist.id, name))
            setDialog(null)
          }}
        />
      )}

      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title="Delete playlist?"
          message={`“${dialog.playlist.name}” will be deleted. The songs stay in your library.`}
          confirmLabel="Delete"
          onClose={closeDialog}
          onConfirm={async () => {
            setList(await window.api.deletePlaylist(dialog.playlist.id))
            setDialog(null)
            dialog.resolve(true)
          }}
        />
      )}

      {toast &&
        createPortal(
          <div key={toast.key} className="toast glass-card" role="status">
            {toast.text}
          </div>,
          document.body
        )}
    </PlaylistsContext.Provider>
  )
}

export default PlaylistsProvider
