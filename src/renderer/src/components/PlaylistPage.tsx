import { useMemo, useRef, useState } from 'react'
import type { Track } from '../../../shared/library'
import type { Playlist } from '../../../shared/playlists'
import { formatCount, formatTotal } from '../format'
import { useTrackSearch } from '../hooks/useTrackSearch'
import AddSongsDialog from './AddSongsDialog'
import ContextMenu, { type MenuItem } from './ContextMenu'
import { ImageIcon, MinusIcon, MoreIcon, PencilIcon, PlusIcon, TrashIcon } from './icons'
import PageToolbar from './PageToolbar'
import PlayButton from './PlayButton'
import { usePlayer, type QueueSource } from './PlayerProvider'
import PlaylistCover from './PlaylistCover'
import { addToPlaylistItems } from './playlistMenu'
import { usePlaylists } from './PlaylistsProvider'
import SearchEmpty from './SearchEmpty'
import SongList from './SongList'

type Props = {
  playlist: Playlist
  tracksById: Map<string, Track>
  allTracks: Track[]
  onBack: () => void
  onDeleted: () => void
}

function PlaylistPage({
  playlist,
  tracksById,
  allTracks,
  onBack,
  onDeleted
}: Props): React.JSX.Element {
  const playlists = usePlaylists()
  const { reorderQueue } = usePlayer()
  const [picking, setPicking] = useState(false)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const coverInput = useRef<HTMLInputElement>(null)

  const tracks = useMemo(
    () =>
      playlist.trackIds
        .map((id) => tracksById.get(id))
        .filter((track): track is Track => track !== undefined),
    [playlist.trackIds, tracksById]
  )
  const search = useTrackSearch(tracks)
  const { results } = search
  const source: QueueSource = search.search
    ? {
        key: `playlist:${playlist.id}:${search.search}`,
        label: `${playlist.name} · “${search.search}”`
      }
    : { key: `playlist:${playlist.id}`, label: playlist.name }
  const missing = playlist.trackIds.length - tracks.length
  const totalSeconds = results.reduce((sum, track) => sum + (track.duration ?? 0), 0)

  const reorder =
    search.query || search.search || results.length < 2
      ? undefined
      : (from: number, to: number): void => {
          const moved = [...results]
          moved.splice(to, 0, ...moved.splice(from, 1))
          const shown = new Set(results.map((track) => track.id))
          let next = 0
          const trackIds = playlist.trackIds.map((id) => (shown.has(id) ? moved[next++].id : id))
          void playlists.reorder(playlist, trackIds)
          reorderQueue(source.key, moved)
        }

  const menuFor = (track: Track): MenuItem[] => [
    ...addToPlaylistItems(track, playlists),
    { separator: true },
    {
      label: 'Remove from this playlist',
      icon: <MinusIcon />,
      danger: true,
      onSelect: () => void playlists.removeTracks(playlist, [track.id])
    }
  ]

  const playlistMenu: MenuItem[] = [
    { label: 'Rename', icon: <PencilIcon />, onSelect: () => playlists.rename(playlist) },
    { label: 'Choose cover…', icon: <ImageIcon />, onSelect: () => coverInput.current?.click() },
    ...(playlist.coverId
      ? [
          {
            label: 'Remove cover',
            icon: <MinusIcon />,
            onSelect: () => void playlists.setCover(playlist, null)
          }
        ]
      : []),
    { separator: true },
    {
      label: 'Delete playlist',
      icon: <TrashIcon />,
      danger: true,
      onSelect: async () => {
        if (await playlists.remove(playlist)) onDeleted()
      }
    }
  ]

  return (
    <section className="page">
      <PageToolbar
        onBack={onBack}
        search={tracks.length > 0 ? search : undefined}
        placeholder={`Search in ${playlist.name}`}
      />
      <header className="playlist-hero">
        <button
          type="button"
          className="hero-cover-btn"
          title="Choose cover"
          onClick={() => coverInput.current?.click()}
        >
          <PlaylistCover playlist={playlist} className="hero-cover" />
          <span className="cover-edit">
            <ImageIcon />
            Choose cover
          </span>
        </button>
        <input
          ref={coverInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const image = event.target.files?.[0]
            event.target.value = ''
            if (image) void playlists.setCover(playlist, image)
          }}
        />
        <div className="hero-info">
          <p className="eyebrow">Playlist</p>
          <h1 className="hero-title">{playlist.name}</h1>
          <p className="page-meta">
            {search.search
              ? `${results.length} of ${formatCount(tracks.length, 'song')}`
              : formatCount(tracks.length, 'song')}
            {results.length > 0 && ` · ${formatTotal(totalSeconds)}`}
            {missing > 0 && (
              <span title="Their files were moved, deleted or are in a folder that isn't connected right now.">
                {' '}
                · {missing} not found
              </span>
            )}
          </p>
          <div className="hero-actions">
            <PlayButton tracks={results} source={source} className="large" />
            <button type="button" className="primary-btn" onClick={() => setPicking(true)}>
              <PlusIcon />
              Add songs
            </button>
            <button
              type="button"
              className="round-btn"
              title="More"
              onClick={(event) => {
                const button = event.currentTarget.getBoundingClientRect()
                setMenu({ x: button.left, y: button.bottom + 6 })
              }}
            >
              <MoreIcon />
            </button>
          </div>
        </div>
      </header>

      {tracks.length > 0 ? (
        <SongList
          tracks={results}
          source={source}
          menuFor={menuFor}
          empty={<SearchEmpty search={search} />}
          onReorder={reorder}
        />
      ) : (
        <div className="glass-card empty">
          <h2>This playlist is empty</h2>
          <p>Find songs in your library and add them here.</p>
          <button type="button" className="primary-btn" onClick={() => setPicking(true)}>
            Add songs
          </button>
        </div>
      )}

      {picking && (
        <AddSongsDialog playlist={playlist} tracks={allTracks} onClose={() => setPicking(false)} />
      )}
      {menu && (
        <ContextMenu x={menu.x} y={menu.y} items={playlistMenu} onClose={() => setMenu(null)} />
      )}
    </section>
  )
}

export default PlaylistPage
