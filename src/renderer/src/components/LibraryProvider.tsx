import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ScanProgress, Track } from '../../../shared/library'

export type Library = {
  tracks: Track[] | null
  tracksById: Map<string, Track>
  scan: ScanProgress | null
}

const LibraryContext = createContext<Library | null>(null)

export function useLibrary(): Library {
  const library = useContext(LibraryContext)
  if (!library) throw new Error('useLibrary needs a LibraryProvider')
  return library
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
const byTitle = (a: Track, b: Track): number =>
  collator.compare(a.title, b.title) || collator.compare(a.artist, b.artist)

function LibraryProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [tracks, setTracks] = useState<Track[] | null>(null)
  const [scan, setScan] = useState<ScanProgress | null>(null)

  useEffect(() => {
    const offTracks = window.api.onTracks(setTracks)
    const offScan = window.api.onScan(setScan)
    window.api.getLibrary().then((state) => {
      setTracks(state.tracks)
      setScan(state.scan)
    })
    return () => {
      offTracks()
      offScan()
    }
  }, [])

  const value = useMemo<Library>(
    () => ({
      tracks: tracks ? [...tracks].sort(byTitle) : null,
      tracksById: new Map((tracks ?? []).map((track) => [track.id, track])),
      scan
    }),
    [tracks, scan]
  )

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export default LibraryProvider
