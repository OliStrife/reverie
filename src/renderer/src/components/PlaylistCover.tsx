import type { Playlist } from '../../../shared/playlists'
import { playlistCoverUrl, songCoverUrl } from '../media'
import { WaveIcon } from './icons'
import { useLibrary } from './LibraryProvider'

const MOSAIC = 4

const hash = (seed: string): number =>
  [...seed].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7)

const gradient = (seed: string): string => {
  const value = hash(seed)
  const hue = 335 + (value % 35)
  const deep = hue + 5 + ((value >>> 8) % 15)
  const angle = 120 + ((value >>> 16) % 90)
  return `linear-gradient(${angle}deg, hsl(${hue % 360} 78% 54%), hsl(${deep % 360} 72% 18%))`
}

type Props = {
  playlist?: Playlist
  className?: string
  single?: boolean
}

function PlaylistCover({ playlist, className = '', single = false }: Props): React.JSX.Element {
  const { tracksById } = useLibrary()

  if (!playlist) {
    return (
      <span className={`playlist-cover all-songs ${className}`}>
        <WaveIcon />
      </span>
    )
  }

  if (playlist.coverId) {
    return (
      <span className={`playlist-cover ${className}`}>
        <img src={playlistCoverUrl(playlist.coverId)} alt="" draggable={false} />
      </span>
    )
  }

  const covers: string[] = []
  for (const id of playlist.trackIds) {
    const coverId = tracksById.get(id)?.coverId
    if (coverId && !covers.includes(coverId)) covers.push(coverId)
    if (covers.length === MOSAIC) break
  }

  if (covers.length === MOSAIC && !single) {
    return (
      <span className={`playlist-cover mosaic ${className}`}>
        {covers.map((coverId) => (
          <img key={coverId} src={songCoverUrl(coverId)} alt="" draggable={false} />
        ))}
      </span>
    )
  }

  if (covers.length > 0) {
    return (
      <span className={`playlist-cover ${className}`}>
        <img src={songCoverUrl(covers[0])} alt="" draggable={false} />
      </span>
    )
  }

  return (
    <span className={`playlist-cover ${className}`} style={{ background: gradient(playlist.id) }}>
      <span className="playlist-initial">{[...playlist.name.trim()][0]?.toUpperCase()}</span>
    </span>
  )
}

export default PlaylistCover
