import { useCallback, useEffect, useRef, useState } from 'react'
import { formatDuration } from '../format'
import { useCoverColors } from '../hooks/useCoverColors'
import { useCoverTilt } from '../hooks/useCoverTilt'
import { useIdle } from '../hooks/useIdle'
import { useLyrics } from '../hooks/useLyrics'
import { useQueueSwipe } from '../hooks/useQueueSwipe'
import { usePlaybackTime } from '../hooks/usePlaybackTime'
import { useStored } from '../hooks/useStored'
import { useSwipeToClose } from '../hooks/useSwipeToClose'
import ContextMenu from './ContextMenu'
import Cover from './Cover'
import CoverBackdrop from './CoverBackdrop'
import {
  AddedIcon,
  AddIcon,
  ChevronDownIcon,
  LyricsIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  VolumeIcon
} from './icons'
import { usePlayer, type Repeat } from './PlayerProvider'
import LyricsPanel from './LyricsPanel'
import { addToPlaylistItems } from './playlistMenu'
import { usePlaylists } from './PlaylistsProvider'
import QueueCards from './QueueCards'
import Slider from './Slider'
import Visualizer from './Visualizer'
import { tintFrom, type Rgb } from '../visualizer/palette'

const POSTER_AFTER_MS = 5_000

type Mode = 'classic' | 'advanced'

const MODES: { mode: Mode; label: string }[] = [
  { mode: 'classic', label: 'Classic' },
  { mode: 'advanced', label: 'Advanced' }
]

const css = ([r, g, b]: Rgb): string => `rgb(${r} ${g} ${b})`

const isMode = (value: unknown): value is Mode => value === 'classic' || value === 'advanced'

const REPEAT_TITLES: Record<Repeat, string> = {
  off: 'Repeat',
  all: 'Repeat all',
  one: 'Repeat one'
}

function TrackInfo({
  showSource = false,
  action
}: {
  showSource?: boolean
  action?: React.ReactNode
}): React.JSX.Element {
  const { current, source } = usePlayer()
  const title = <span className="track-title">{current?.title ?? 'Nothing playing'}</span>
  return (
    <span className="track-info">
      {showSource && source && current && (
        <span className="eyebrow">Playing from {source.label}</span>
      )}
      {action ? (
        <span className="track-title-row">
          <span aria-hidden="true" />
          {title}
          {action}
        </span>
      ) : (
        title
      )}
      <span className="track-artist">{current ? current.artist : 'Pick a song to start'}</span>
    </span>
  )
}

function AddToPlaylist(): React.JSX.Element {
  const { current } = usePlayer()
  const playlists = usePlaylists()
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const closeMenu = useCallback(() => setMenu(null), [])
  const wasOpen = useRef(false)

  if (!current) return <span className="track-add" aria-hidden="true" />
  const containing = (playlists.list ?? []).filter((playlist) =>
    playlist.trackIds.includes(current.id)
  )
  const added = containing.length > 0

  return (
    <>
      <button
        type="button"
        className={`player-btn small track-add ${added ? 'added' : ''}`}
        title={
          added ? `In ${containing.map((playlist) => playlist.name).join(', ')}` : 'Add to playlist'
        }
        aria-haspopup="menu"
        onMouseDown={() => (wasOpen.current = menu !== null)}
        onClick={(event) => {
          if (wasOpen.current) {
            wasOpen.current = false
            return
          }
          const box = event.currentTarget.getBoundingClientRect()
          setMenu({ x: box.left, y: box.top > innerHeight * 0.6 ? box.top - 6 : box.bottom + 6 })
        }}
      >
        {added ? <AddedIcon /> : <AddIcon />}
      </button>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={addToPlaylistItems(current, playlists)}
          onClose={closeMenu}
        />
      )}
    </>
  )
}

function Controls(): React.JSX.Element {
  const player = usePlayer()
  const nothing = player.current === null
  return (
    <div className="controls">
      <button
        type="button"
        className={`player-btn toggle ${player.shuffle ? 'on' : ''}`}
        title={player.shuffle ? 'Shuffle on' : 'Shuffle'}
        aria-pressed={player.shuffle}
        onClick={player.toggleShuffle}
      >
        <ShuffleIcon />
      </button>
      <button
        type="button"
        className="player-btn"
        title="Previous"
        disabled={nothing}
        onClick={player.previous}
      >
        <PrevIcon />
      </button>
      <button
        type="button"
        className={`player-btn big ${player.playing ? 'playing' : ''}`}
        title={player.playing ? 'Pause' : 'Play'}
        disabled={nothing}
        onClick={player.toggle}
      >
        {player.playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button
        type="button"
        className="player-btn"
        title="Next"
        disabled={nothing}
        onClick={player.next}
      >
        <NextIcon />
      </button>
      <button
        type="button"
        className={`player-btn toggle ${player.repeat !== 'off' ? 'on' : ''}`}
        title={REPEAT_TITLES[player.repeat]}
        aria-pressed={player.repeat !== 'off'}
        onClick={player.cycleRepeat}
      >
        {player.repeat === 'one' ? <RepeatOneIcon /> : <RepeatIcon />}
      </button>
    </div>
  )
}

function Progress(): React.JSX.Element {
  const player = usePlayer()
  const { time, duration } = usePlaybackTime(player.audio)
  return (
    <div className="progress">
      <span className="time">{formatDuration(time)}</span>
      <Slider value={time} max={duration} label="Seek" onCommit={player.seek} />
      <span className="time">{formatDuration(duration || (player.current?.duration ?? 0))}</span>
    </div>
  )
}

function Volume(): React.JSX.Element {
  const player = usePlayer()
  const silent = player.muted || player.volume === 0
  return (
    <div className="volume">
      <button
        type="button"
        className="player-btn small"
        title={player.muted ? 'Unmute' : 'Mute'}
        onClick={player.toggleMute}
      >
        <VolumeIcon muted={silent} />
      </button>
      <Slider
        value={player.muted ? 0 : player.volume}
        max={1}
        label="Volume"
        onChange={player.setVolume}
      />
    </div>
  )
}

function ModeSwitch({
  mode,
  onChange
}: {
  mode: Mode
  onChange: (mode: Mode) => void
}): React.JSX.Element {
  return (
    <div
      className="player-modes glass-panel"
      role="radiogroup"
      aria-label="Player mode"
      data-mode={mode}
    >
      <span className="player-modes-thumb" aria-hidden="true" />
      {MODES.map((option) => (
        <button
          key={option.mode}
          type="button"
          role="radio"
          aria-checked={mode === option.mode}
          onClick={() => onChange(option.mode)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function PlayerBar({ open, onOpenChange }: Props): React.JSX.Element {
  const { current, playing, queue, index, next, skipBack } = usePlayer()
  const panel = useRef<HTMLElement>(null)
  const strip = useRef<HTMLDivElement>(null)
  const idle = useIdle(open && playing, POSTER_AFTER_MS)
  useCoverTilt(panel, open)

  const [mode, setMode] = useStored('player-mode', isMode, 'classic')
  const advanced = mode === 'advanced'
  const [lyricsWanted, setLyricsWanted] = useState(false)
  const lyricsOpen = open && advanced && lyricsWanted
  const lyrics = useLyrics(current?.id ?? null, open && advanced)

  const stacked = open && advanced && !lyricsOpen && current !== null
  const sideways = useQueueSwipe(strip, stacked, queue.length > 1, next, skipBack)
  const swipe = useSwipeToClose(panel, open, () => onOpenChange(false), sideways)

  const tint = tintFrom(useCoverColors(current?.coverId ?? null).average)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      if (lyricsOpen) setLyricsWanted(false)
      else onOpenChange(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, lyricsOpen, onOpenChange])

  const expand = (event: React.MouseEvent): void => {
    if (open || (event.target as HTMLElement).closest('button, .progress, .volume')) return
    onOpenChange(true)
  }

  return (
    <footer
      ref={panel}
      className={`player glass-panel ${open ? 'open' : ''} ${open && playing ? 'visualizing' : ''} ${idle ? 'idle' : ''} ${advanced ? 'advanced' : ''} ${lyricsOpen ? 'lyrics-open' : ''} ${stacked ? 'stacked' : ''}`}
      style={{ '--cover-accent': css(tint) } as React.CSSProperties}
      onClick={expand}
      {...swipe}
    >
      <CoverBackdrop coverId={current?.coverId ?? null} />
      <Visualizer open={open} />
      <span className="player-grabber" aria-hidden="true" />
      <Cover id={current?.coverId ?? null} className="player-cover cover-empty" />
      {advanced && (
        <QueueCards strip={strip} queue={queue} index={index} onPrevious={skipBack} onNext={next} />
      )}

      <div className="player-compact" inert={open}>
        <div className="now-playing-group">
          <button
            type="button"
            className="now-playing"
            onClick={() => onOpenChange(true)}
            title="Open player"
          >
            <TrackInfo />
          </button>
          <AddToPlaylist />
        </div>
        <div className="transport">
          <Controls />
          <Progress />
        </div>
        <Volume />
      </div>

      <div className="player-full" inert={!open}>
        <TrackInfo showSource action={<AddToPlaylist />} />
        <Progress />
        <Controls />
        <Volume />
      </div>

      <div className="player-top" inert={!open}>
        <button
          type="button"
          className="player-close glass-panel"
          title="Close player (Esc)"
          onClick={() => onOpenChange(false)}
        >
          <ChevronDownIcon />
        </button>
        <span className="player-top-gap" />
        {advanced && (
          <button
            type="button"
            className="lyrics-btn glass-panel"
            aria-pressed={lyricsWanted}
            disabled={lyrics === null && !lyricsWanted}
            title={lyrics === null ? "This song's file has no lyrics" : 'Lyrics'}
            onClick={() => setLyricsWanted(!lyricsWanted)}
          >
            <LyricsIcon />
            Lyrics
          </button>
        )}
        <ModeSwitch mode={mode} onChange={setMode} />
      </div>

      <LyricsPanel
        open={lyricsOpen}
        trackId={current?.id ?? null}
        title={current?.title ?? null}
        lyrics={lyrics}
        onClose={() => setLyricsWanted(false)}
      />
    </footer>
  )
}

export default PlayerBar
