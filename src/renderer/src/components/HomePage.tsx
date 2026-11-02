import type { Track } from '../../../shared/library'
import type { Playlist } from '../../../shared/playlists'
import type { Page } from '../types'
import { formatCount } from '../format'
import { FolderIcon, PlusIcon } from './icons'
import { useLibrary } from './LibraryProvider'
import PlayButton from './PlayButton'
import PlaylistCover from './PlaylistCover'
import { usePlaylists } from './PlaylistsProvider'

const greeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

type TileProps = {
  playlist?: Playlist
  name: string
  tracks: Track[]
  sourceKey: string
  onOpen: () => void
}

function Tile({ playlist, name, tracks, sourceKey, onOpen }: TileProps): React.JSX.Element {
  return (
    <div className="tile">
      <button type="button" className="tile-link" onClick={onOpen}>
        <PlaylistCover playlist={playlist} className="tile-cover" />
        <span className="tile-name">{name}</span>
        <span className="tile-meta">{formatCount(tracks.length, 'song')}</span>
      </button>
      {tracks.length > 0 && (
        <PlayButton
          tracks={tracks}
          source={{ key: sourceKey, label: name }}
          className="tile-play"
        />
      )}
    </div>
  )
}

type Props = {
  folders: string[] | null
  onNavigate: (page: Page) => void
  onAddFolder: () => void
}

function HomePage({ folders, onNavigate, onAddFolder }: Props): React.JSX.Element {
  const playlists = usePlaylists()
  const { tracks, tracksById } = useLibrary()

  const createPlaylist = async (): Promise<void> => {
    const created = await playlists.create()
    if (created) onNavigate({ name: 'playlist', id: created.id })
  }

  return (
    <section className="page">
      <h1 className="page-title">{greeting()}</h1>

      {folders && folders.length === 0 && (
        <div className="glass-card empty home-connect">
          <span className="empty-icon">
            <FolderIcon />
          </span>
          <h2>Connect your music</h2>
          <p>Add a folder with music, then gather your songs into playlists.</p>
          <button type="button" className="primary-btn" onClick={onAddFolder}>
            Add folder
          </button>
        </div>
      )}

      <div className="section-row">
        <h2 className="section-title">Playlists</h2>
        <button type="button" className="secondary-btn" onClick={createPlaylist}>
          <PlusIcon />
          New playlist
        </button>
      </div>

      <div className="tile-grid">
        <Tile
          name="All songs"
          tracks={tracks ?? []}
          sourceKey="songs"
          onOpen={() => onNavigate({ name: 'songs' })}
        />

        {playlists.list?.map((playlist) => (
          <Tile
            key={playlist.id}
            playlist={playlist}
            name={playlist.name}
            tracks={playlist.trackIds
              .map((id) => tracksById.get(id))
              .filter((track): track is Track => track !== undefined)}
            sourceKey={`playlist:${playlist.id}`}
            onOpen={() => onNavigate({ name: 'playlist', id: playlist.id })}
          />
        ))}
      </div>
    </section>
  )
}

export default HomePage
