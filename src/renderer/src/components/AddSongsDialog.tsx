import { useDeferredValue, useMemo, useState } from 'react'
import type { Track } from '../../../shared/library'
import type { Playlist } from '../../../shared/playlists'
import { formatCount } from '../format'
import { searchIndex, searchTracks } from '../search'
import Cover from './Cover'
import { CheckIcon, PlusIcon, SearchIcon } from './icons'
import { Modal } from './Modal'
import { usePlaylists } from './PlaylistsProvider'

type Props = {
  playlist: Playlist
  tracks: Track[]
  onClose: () => void
}

function AddSongsDialog({ playlist, tracks, onClose }: Props): React.JSX.Element {
  const playlists = usePlaylists()
  const current = playlists.list?.find((item) => item.id === playlist.id) ?? playlist
  const inPlaylist = useMemo(() => new Set(current.trackIds), [current.trackIds])
  const [query, setQuery] = useState('')
  const search = useDeferredValue(query)
  const index = useMemo(() => searchIndex(tracks), [tracks])
  const results = useMemo(() => searchTracks(tracks, index, search), [tracks, index, search])

  return (
    <Modal title={`Add songs to ${current.name}`} onClose={onClose} className="picker">
      <label className="search-field">
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search songs, artists, albums"
          autoFocus
        />
      </label>

      <div className="picker-list">
        {results.map((track) => {
          const added = inPlaylist.has(track.id)
          return (
            <div key={track.id} className="picker-row">
              <Cover id={track.coverId} />
              <span className="song-text">
                <span className="song-title">{track.title}</span>
                <span className="song-artist">
                  {track.artist} · {track.album}
                </span>
              </span>
              <button
                type="button"
                className={`pick-btn ${added ? 'added' : ''}`}
                title={added ? 'Remove from playlist' : 'Add to playlist'}
                onClick={() =>
                  added
                    ? playlists.removeTracks(current, [track.id])
                    : playlists.addTracks(current, [track.id])
                }
              >
                {added ? <CheckIcon /> : <PlusIcon />}
              </button>
            </div>
          )
        })}
        {results.length === 0 && (
          <p className="picker-empty muted">
            {tracks.length === 0 ? 'Your library is empty.' : `Nothing matches “${query.trim()}”.`}
          </p>
        )}
      </div>

      <div className="modal-actions">
        <span className="picker-count muted">
          {formatCount(current.trackIds.length, 'song')} in this playlist
        </span>
        <button type="button" className="primary-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  )
}

export default AddSongsDialog
