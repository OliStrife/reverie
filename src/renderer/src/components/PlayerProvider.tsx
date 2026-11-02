import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState
} from 'react'
import type { Track } from '../../../shared/library'
import { audio, levelFor, setOutput } from '../audio'
import { useStored } from '../hooks/useStored'
import { songCoverUrl, trackUrl } from '../media'

export type Repeat = 'off' | 'all' | 'one'

export type QueueSource = { key: string; label: string }

export type Player = {
  audio: HTMLAudioElement
  current: Track | null
  queue: Track[]
  index: number
  source: QueueSource | null
  playing: boolean
  shuffle: boolean
  repeat: Repeat
  volume: number
  muted: boolean
  play: (tracks: Track[], start: number, source: QueueSource) => void
  reorderQueue: (sourceKey: string, tracks: Track[]) => void
  toggle: () => void
  next: () => void
  previous: () => void
  skipBack: () => void
  seek: (seconds: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
}

type QueueState = {
  queue: Track[]
  original: Track[]
  index: number
  source: QueueSource | null
  shuffle: boolean
  repeat: Repeat
  loadId: number
}

type Action =
  | { type: 'play'; tracks: Track[]; start: number; source: QueueSource }
  | { type: 'reorder'; sourceKey: string; tracks: Track[] }
  | { type: 'next'; auto: boolean }
  | { type: 'skip' }
  | { type: 'previous' }
  | { type: 'shuffle' }
  | { type: 'repeat' }

const shuffled = <T,>(items: T[]): T[] => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const startingWith = (tracks: Track[], first: Track): Track[] => [
  first,
  ...shuffled(tracks.filter((track) => track.id !== first.id))
]

const NEXT_REPEAT: Record<Repeat, Repeat> = { off: 'all', all: 'one', one: 'off' }

const reducer = (state: QueueState, action: Action): QueueState => {
  switch (action.type) {
    case 'play': {
      const first = action.tracks[action.start]
      if (!first) return state
      return {
        ...state,
        original: action.tracks,
        queue: state.shuffle ? startingWith(action.tracks, first) : action.tracks,
        index: state.shuffle ? 0 : action.start,
        source: action.source,
        loadId: state.loadId + 1
      }
    }
    case 'reorder': {
      if (state.source?.key !== action.sourceKey) return state
      if (state.shuffle) return { ...state, original: action.tracks }
      const current = state.queue[state.index]
      const index = action.tracks.findIndex((track) => track.id === current?.id)
      if (index < 0) return state
      return { ...state, original: action.tracks, queue: action.tracks, index }
    }
    case 'next': {
      if (state.queue.length === 0) return state
      if (action.auto && state.repeat === 'one') return { ...state, loadId: state.loadId + 1 }
      const last = state.index >= state.queue.length - 1
      if (last && action.auto && state.repeat === 'off') return state
      return { ...state, index: last ? 0 : state.index + 1, loadId: state.loadId + 1 }
    }
    case 'skip': {
      if (state.index >= state.queue.length - 1) return state
      return { ...state, index: state.index + 1, loadId: state.loadId + 1 }
    }
    case 'previous': {
      if (state.queue.length === 0) return state
      const index = state.index > 0 ? state.index - 1 : state.queue.length - 1
      return { ...state, index, loadId: state.loadId + 1 }
    }
    case 'shuffle': {
      const current = state.queue[state.index]
      if (!current) return { ...state, shuffle: !state.shuffle }
      if (state.shuffle) {
        const index = state.original.findIndex((track) => track.id === current.id)
        return { ...state, shuffle: false, queue: state.original, index: Math.max(0, index) }
      }
      return { ...state, shuffle: true, queue: startingWith(state.original, current), index: 0 }
    }
    case 'repeat':
      return { ...state, repeat: NEXT_REPEAT[state.repeat] }
  }
}

const INITIAL: QueueState = {
  queue: [],
  original: [],
  index: -1,
  source: null,
  shuffle: false,
  repeat: 'off',
  loadId: 0
}

const RESTART_AFTER_SECONDS = 3

const APP_TITLE = 'Reverie'
const PAUSED_TITLE_DELAY_MS = 600

const carriedOverVolume = (): number => {
  try {
    const capped = Number(localStorage.getItem('player-volume'))
    if (capped > 0) return levelFor(capped / 33)
    const linear = Number(localStorage.getItem('volume'))
    return linear > 0 ? levelFor(linear) : 0.6
  } catch {
    return 0.6
  }
}

const isVolume = (value: unknown): value is number =>
  typeof value === 'number' && value >= 0 && value <= 1

const PlayerContext = createContext<Player | null>(null)

export function usePlayer(): Player {
  const player = useContext(PlayerContext)
  if (!player) throw new Error('usePlayer needs a PlayerProvider')
  return player
}

function PlayerProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const [playing, setPlaying] = useState(false)
  const [initialVolume] = useState(carriedOverVolume)
  const [volume, setVolume] = useStored('volume-level', isVolume, initialVolume)
  const [muted, setMuted] = useState(false)
  const current = state.queue[state.index] ?? null

  const loaded = useRef(0)
  useEffect(() => {
    if (!current || loaded.current === state.loadId) return
    loaded.current = state.loadId
    audio.src = trackUrl(current.id)
    audio.play().catch(() => undefined)
  }, [current, state.loadId])

  useEffect(() => {
    setOutput(volume, muted)
  }, [volume, muted])

  useEffect(() => {
    const onPlay = (): void => setPlaying(true)
    const onPause = (): void => setPlaying(false)
    const onEnded = (): void => dispatch({ type: 'next', auto: true })
    const onError = (): void => {
      if (audio.src) dispatch({ type: 'skip' })
    }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [])

  const toggle = useCallback(() => {
    if (!audio.src) return
    if (audio.paused) audio.play().catch(() => undefined)
    else audio.pause()
  }, [])

  const previous = useCallback(() => {
    if (audio.currentTime > RESTART_AFTER_SECONDS) audio.currentTime = 0
    else dispatch({ type: 'previous' })
  }, [])

  const next = useCallback(() => dispatch({ type: 'next', auto: false }), [])

  useEffect(() => {
    const session = navigator.mediaSession
    session.setActionHandler('play', () => audio.play().catch(() => undefined))
    session.setActionHandler('pause', () => audio.pause())
    session.setActionHandler('previoustrack', previous)
    session.setActionHandler('nexttrack', next)
    session.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) audio.currentTime = details.seekTime
    })
  }, [previous, next])

  useEffect(() => {
    if (!current) {
      navigator.mediaSession.metadata = null
      return
    }
    const describe = (artwork: MediaImage[]): MediaMetadata =>
      new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: current.album,
        artwork
      })
    navigator.mediaSession.metadata = describe([])
    if (!current.coverId) return
    let cancelled = false
    let url: string | null = null
    fetch(songCoverUrl(current.coverId))
      .then((response) => (response.ok ? response.blob() : Promise.reject()))
      .then((blob) => {
        if (cancelled) return
        url = URL.createObjectURL(blob)
        navigator.mediaSession.metadata = describe([
          { src: url, sizes: '600x600', type: blob.type || 'image/jpeg' }
        ])
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [current])

  useEffect(() => {
    if (playing && current) {
      document.title = `${current.title} – ${current.artist}`
      return
    }
    const timer = setTimeout(() => (document.title = APP_TITLE), PAUSED_TITLE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [playing, current])

  const hasTrack = current !== null
  useEffect(() => {
    window.api.setPlaybackState({ playing, hasTrack })
  }, [playing, hasTrack])

  useEffect(
    () =>
      window.api.onPlayerCommand((command) => {
        if (command === 'previous') previous()
        else if (command === 'next') next()
        else toggle()
      }),
    [previous, next, toggle]
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.code !== 'Space' || event.repeat) return
      const target = event.target as HTMLElement
      if (target.closest('input, textarea, button, [role="menuitem"]')) return
      event.preventDefault()
      toggle()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  const value = useMemo<Player>(
    () => ({
      audio,
      current,
      queue: state.queue,
      index: state.index,
      source: state.source,
      playing,
      shuffle: state.shuffle,
      repeat: state.repeat,
      volume,
      muted,
      play: (tracks, start, source) => dispatch({ type: 'play', tracks, start, source }),
      reorderQueue: (sourceKey, tracks) => dispatch({ type: 'reorder', sourceKey, tracks }),
      toggle,
      next,
      previous,
      skipBack: () => dispatch({ type: 'previous' }),
      seek: (seconds) => {
        if (Number.isFinite(seconds)) audio.currentTime = seconds
      },
      setVolume: (level) => {
        setVolume(Math.min(1, Math.max(0, level)))
        if (level > 0) setMuted(false)
      },
      toggleMute: () => setMuted((value) => !value),
      toggleShuffle: () => dispatch({ type: 'shuffle' }),
      cycleRepeat: () => dispatch({ type: 'repeat' })
    }),
    [current, state, playing, volume, muted, toggle, next, previous, setVolume]
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export default PlayerProvider
