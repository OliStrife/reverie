import { useDeferredValue, useMemo, useState } from 'react'
import type { Track } from '../../../shared/library'
import { searchIndex, searchTracks } from '../search'

export type TrackSearch = {
  query: string
  setQuery: (query: string) => void
  search: string
  results: Track[]
}

export function useTrackSearch(tracks: Track[]): TrackSearch {
  const [query, setQuery] = useState('')
  const search = useDeferredValue(query).trim()
  const index = useMemo(() => searchIndex(tracks), [tracks])
  const results = useMemo(() => searchTracks(tracks, index, search), [tracks, index, search])
  return { query, setQuery, search, results }
}
