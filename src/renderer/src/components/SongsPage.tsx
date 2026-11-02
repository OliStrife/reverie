import { useMemo } from 'react'
import type { ScanProgress, Track } from '../../../shared/library'
import { formatCount, formatTotal } from '../format'
import { useTrackSearch } from '../hooks/useTrackSearch'
import { FolderIcon, WaveIcon } from './icons'
import PageToolbar from './PageToolbar'
import PlayButton from './PlayButton'
import type { QueueSource } from './PlayerProvider'
import { addToPlaylistItems } from './playlistMenu'
import { usePlaylists } from './PlaylistsProvider'
import SearchEmpty from './SearchEmpty'
import SongList from './SongList'

const ALL_SONGS: QueueSource = { key: 'songs', label: 'All songs' }
const NO_TRACKS: Track[] = []

type Props = {
  folders: string[] | null
  tracks: Track[] | null
  scan: ScanProgress | null
  onBack: () => void
  onAddFolder: () => void
  onOpenSettings: () => void
}

function SongsPage({
  folders,
  tracks: sorted,
  scan,
  onBack,
  onAddFolder,
  onOpenSettings
}: Props): React.JSX.Element {
  const playlists = usePlaylists()
  const search = useTrackSearch(sorted ?? NO_TRACKS)
  const { results } = search
  const totalSeconds = useMemo(
    () => results.reduce((sum, track) => sum + (track.duration ?? 0), 0),
    [results]
  )
  const hasSongs = sorted !== null && sorted.length > 0

  const body = (): React.JSX.Element | null => {
    if (folders === null || sorted === null) return null

    if (folders.length === 0) {
      return (
        <>
          <h1 className="page-title">Songs</h1>
          <div className="glass-card empty">
            <span className="empty-icon">
              <FolderIcon />
            </span>
            <h2>Your library is empty</h2>
            <p>
              Add a folder with music and Reverie will pick up titles, artists and covers on its
              own.
            </p>
            <button type="button" className="primary-btn" onClick={onAddFolder}>
              Add folder
            </button>
          </div>
        </>
      )
    }

    if (sorted.length === 0) {
      return (
        <>
          <h1 className="page-title">Songs</h1>
          {scan ? (
            <div className="glass-card empty">
              <span className="empty-icon busy">
                <WaveIcon />
              </span>
              <h2>{scan.total === 0 ? 'Looking for music…' : 'Reading your music'}</h2>
              {scan.total > 0 && (
                <>
                  <div className="scan-bar">
                    <div
                      className="scan-fill"
                      style={{ width: `${(scan.done / scan.total) * 100}%` }}
                    />
                  </div>
                  <p>
                    {scan.done.toLocaleString('en-US')} of {formatCount(scan.total, 'file')}
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="glass-card empty">
              <span className="empty-icon">
                <FolderIcon />
              </span>
              <h2>No music found</h2>
              <p>
                Reverie looks for MP3, FLAC, M4A, AAC, OGG, Opus and WAV files in your folders and
                everything inside them.
              </p>
              <button type="button" className="primary-btn" onClick={onOpenSettings}>
                Manage folders
              </button>
            </div>
          )}
        </>
      )
    }

    const source: QueueSource = search.search
      ? { key: `songs:${search.search}`, label: `Songs matching “${search.search}”` }
      : ALL_SONGS

    return (
      <>
        <header className="page-head with-play">
          <PlayButton tracks={results} source={source} className="large" />
          <div>
            <h1 className="page-title">Songs</h1>
            <p className="page-meta">
              {search.search
                ? `${results.length.toLocaleString('en-US')} of ${formatCount(sorted.length, 'song')}`
                : formatCount(sorted.length, 'song')}
              {results.length > 0 && ` · ${formatTotal(totalSeconds)}`}
              {scan && (
                <span className="scan-status">
                  {' '}
                  · Updating
                  {scan.total > 0 &&
                    ` ${scan.done.toLocaleString('en-US')} of ${scan.total.toLocaleString('en-US')}`}
                </span>
              )}
            </p>
          </div>
        </header>
        <SongList
          tracks={results}
          source={source}
          menuFor={(track) => addToPlaylistItems(track, playlists)}
          empty={<SearchEmpty search={search} />}
        />
      </>
    )
  }

  return (
    <section className="page">
      <PageToolbar
        onBack={onBack}
        search={hasSongs ? search : undefined}
        placeholder="Search songs, artists, albums"
      />
      {body()}
    </section>
  )
}

export default SongsPage
