import type { Track } from '../../../shared/library'
import type { MenuItem } from './ContextMenu'
import { PlusIcon } from './icons'
import PlaylistCover from './PlaylistCover'
import type { Playlists } from './PlaylistsProvider'

export const addToPlaylistItems = (track: Track, playlists: Playlists): MenuItem[] => {
  const list = playlists.list ?? []
  return [
    { heading: 'Add to playlist' },
    {
      label: 'New playlist…',
      icon: <PlusIcon />,
      onSelect: () => void playlists.create([track.id])
    },
    ...(list.length > 0 ? [{ separator: true } as const] : []),
    ...list.map((playlist): MenuItem => {
      const inside = playlist.trackIds.includes(track.id)
      return {
        label: playlist.name,
        icon: <PlaylistCover playlist={playlist} className="tiny" single />,
        checked: inside,
        onSelect: () =>
          void (inside
            ? playlists.removeTracks(playlist, [track.id])
            : playlists.addTracks(playlist, [track.id]))
      }
    })
  ]
}
