import type { Track } from '../../shared/library'

export const normalize = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export const searchIndex = (tracks: Track[]): string[] =>
  tracks.map((track) => normalize(`${track.title} ${track.artist} ${track.album}`))

export const searchTracks = (tracks: Track[], index: string[], query: string): Track[] => {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return tracks
  return tracks.filter((_, i) => words.every((word) => index[i].includes(word)))
}
