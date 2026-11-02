export type Playlist = {
  id: string
  name: string
  trackIds: string[]
  coverId: string | null
  createdAt: number
}

export type CreatePlaylistResult = {
  playlists: Playlist[]
  created: Playlist | null
}

export const MAX_PLAYLIST_NAME = 100

export const COVER_ID = /^[0-9a-f]{16}$/
