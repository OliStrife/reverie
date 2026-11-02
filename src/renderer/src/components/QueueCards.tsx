import { useState } from 'react'
import type { Track } from '../../../shared/library'
import Cover from './Cover'

const SLOTS = [-2, -1, 0, 1, 2]

type Strip = {
  queue: Track[]
  index: number
  position: number
  epoch: number
}

const wrap = (value: number, length: number): number => ((value % length) + length) % length

type Props = {
  strip: React.RefObject<HTMLDivElement | null>
  queue: Track[]
  index: number
  onPrevious: () => void
  onNext: () => void
}

function QueueCards({ strip, queue, index, onPrevious, onNext }: Props): React.JSX.Element {
  const [state, setState] = useState<Strip>({ queue, index, position: 0, epoch: 0 })

  if (state.queue !== queue || state.index !== index) {
    const length = queue.length
    const sameQueue = state.queue === queue && length > 0
    const step = !sameQueue
      ? 0
      : index === wrap(state.index + 1, length)
        ? 1
        : index === wrap(state.index - 1, length)
          ? -1
          : 0
    setState(
      step
        ? { queue, index, position: state.position + step, epoch: state.epoch }
        : { queue, index, position: 0, epoch: state.epoch + 1 }
    )
  }

  const cards =
    index < 0 || queue.length === 0
      ? []
      : SLOTS.filter((slot) => slot === 0 || queue.length > 1).map((slot) => ({
          slot,
          key: `${state.epoch}:${state.position + slot}`,
          track: queue[wrap(index + slot, queue.length)]
        }))

  return (
    <div ref={strip} className="queue-cards" aria-hidden="true">
      {cards.map(({ slot, key, track }) => (
        <div
          key={key}
          className="queue-card"
          data-slot={slot}
          title={slot === -1 ? track.title : slot === 1 ? `Up next: ${track.title}` : undefined}
          onClick={slot === -1 ? onPrevious : slot === 1 ? onNext : undefined}
        >
          <Cover id={track.coverId} className="queue-card-face cover-empty" />
        </div>
      ))}
    </div>
  )
}

export default QueueCards
