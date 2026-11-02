import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { Track } from '../../../shared/library'
import { formatDuration } from '../format'
import { useRowDrag } from '../hooks/useRowDrag'
import ContextMenu, { type MenuItem } from './ContextMenu'
import Cover from './Cover'
import { ClockIcon, MoreIcon, PauseIcon, PlayIcon } from './icons'
import { usePlayer, type QueueSource } from './PlayerProvider'

type MenuRequest = { track: Track; x: number; y: number }

type RowProps = {
  track: Track
  index: number
  current: boolean
  playing: boolean
  onPlay: (index: number) => void
  onToggle: () => void
  onMenu?: (request: MenuRequest) => void
}

const SongRow = memo(
  function SongRow({
    track,
    index,
    current,
    playing,
    onPlay,
    onToggle,
    onMenu
  }: RowProps): React.JSX.Element {
    const playingHere = current && playing
    return (
      <div
        className={`song-row ${current ? 'current' : ''}`}
        role="row"
        data-index={index}
        onDoubleClick={() => onPlay(index)}
        onContextMenu={(event) => {
          if (!onMenu) return
          event.preventDefault()
          onMenu({ track, x: event.clientX, y: event.clientY })
        }}
      >
        <span className="song-index">
          <span className="index-number">
            {playingHere ? (
              <span className="eq" aria-label="Playing">
                <i />
                <i />
                <i />
              </span>
            ) : (
              index + 1
            )}
          </span>
          <button
            type="button"
            className="index-play"
            title={playingHere ? 'Pause' : `Play ${track.title}`}
            onClick={() => (current ? onToggle() : onPlay(index))}
          >
            {playingHere ? <PauseIcon /> : <PlayIcon />}
          </button>
        </span>
        <span className="song-main">
          <Cover id={track.coverId} />
          <span className="song-text">
            <span className="song-title">{track.title}</span>
            <span className="song-artist">{track.artist}</span>
          </span>
        </span>
        <span className="song-album">{track.album}</span>
        <span className="song-time">{formatDuration(track.duration)}</span>
        <span className="song-actions">
          {onMenu && (
            <button
              type="button"
              className="icon-btn"
              title="More"
              onClick={(event) => {
                const button = event.currentTarget.getBoundingClientRect()
                onMenu({ track, x: button.right, y: button.bottom + 4 })
              }}
            >
              <MoreIcon />
            </button>
          )}
        </span>
      </div>
    )
  },
  (prev, next) =>
    prev.index === next.index &&
    prev.track.id === next.track.id &&
    prev.track.mtime === next.track.mtime &&
    prev.track.coverId === next.track.coverId &&
    prev.current === next.current &&
    (!next.current || prev.playing === next.playing)
)

type Props = {
  tracks: Track[]
  source: QueueSource
  menuFor?: (track: Track) => MenuItem[]
  empty?: React.ReactNode
  onReorder?: (from: number, to: number) => void
}

function SongList({ tracks, source, menuFor, empty, onReorder }: Props): React.JSX.Element {
  const player = usePlayer()
  const list = useRef<HTMLDivElement>(null)
  const startDrag = useRowDrag(list, onReorder)
  const [menu, setMenu] = useState<MenuRequest | null>(null)
  const openMenu = useCallback((request: MenuRequest) => setMenu(request), [])
  const closeMenu = useCallback(() => setMenu(null), [])

  const latest = useRef({ tracks, source, player })
  useEffect(() => {
    latest.current = { tracks, source, player }
  })
  const play = useCallback((index: number) => {
    const { tracks, source, player } = latest.current
    player.play(tracks, index, source)
  }, [])
  const toggle = useCallback(() => latest.current.player.toggle(), [])

  const currentId = player.current?.id

  return (
    <div
      ref={list}
      className={`song-list ${onReorder ? 'reorderable' : ''}`}
      role="table"
      onPointerDown={startDrag}
    >
      <div className="song-head" role="row">
        <span className="song-index">#</span>
        <span>Title</span>
        <span>Album</span>
        <span className="song-time" title="Duration">
          <ClockIcon />
        </span>
        <span />
      </div>
      {tracks.map((track, index) => (
        <SongRow
          key={track.id}
          track={track}
          index={index}
          current={track.id === currentId}
          playing={player.playing}
          onPlay={play}
          onToggle={toggle}
          onMenu={menuFor ? openMenu : undefined}
        />
      ))}
      {tracks.length === 0 && empty}
      {menu && menuFor && (
        <ContextMenu x={menu.x} y={menu.y} items={menuFor(menu.track)} onClose={closeMenu} />
      )}
    </div>
  )
}

export default SongList
