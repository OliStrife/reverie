import type { Track } from '../../../shared/library'
import { PauseIcon, PlayIcon } from './icons'
import { usePlayer, type QueueSource } from './PlayerProvider'

type Props = {
  tracks: Track[]
  source: QueueSource
  className?: string
}

function PlayButton({ tracks, source, className = '' }: Props): React.JSX.Element {
  const player = usePlayer()
  const active = player.current !== null && player.source?.key === source.key
  const playingHere = active && player.playing

  return (
    <button
      type="button"
      className={`play-btn ${className} ${playingHere ? 'playing' : ''}`}
      title={playingHere ? 'Pause' : `Play ${source.label}`}
      disabled={tracks.length === 0}
      onClick={(event) => {
        event.stopPropagation()
        if (active) player.toggle()
        else
          player.play(
            tracks,
            player.shuffle ? Math.floor(Math.random() * tracks.length) : 0,
            source
          )
      }}
    >
      {playingHere ? <PauseIcon /> : <PlayIcon />}
    </button>
  )
}

export default PlayButton
