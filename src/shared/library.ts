export type Track = {
  id: string
  path: string
  title: string
  artist: string
  album: string
  year: number | null
  trackNo: number | null
  duration: number | null
  coverId: string | null
  size: number
  mtime: number
  addedAt: number
}

export type ScanProgress = {
  total: number
  done: number
}

export type LibraryState = {
  tracks: Track[]
  scan: ScanProgress | null
}

export const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.m4a', '.aac', '.ogg', '.opus', '.wav']
