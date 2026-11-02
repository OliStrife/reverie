import { useState } from 'react'

type Props = {
  value: number
  max: number
  label: string
  onChange?: (value: number) => void
  onCommit?: (value: number) => void
  className?: string
}

function Slider({
  value,
  max,
  label,
  onChange,
  onCommit,
  className = ''
}: Props): React.JSX.Element {
  const [dragging, setDragging] = useState<number | null>(null)
  const shown = dragging ?? value
  const fill = max > 0 ? Math.min(100, (shown / max) * 100) : 0

  const commit = (): void => {
    if (dragging !== null) onCommit?.(dragging)
    setDragging(null)
  }

  return (
    <input
      type="range"
      className={`slider ${className}`}
      aria-label={label}
      min={0}
      max={max || 1}
      step="any"
      value={shown}
      disabled={max <= 0}
      style={{ '--fill': `${fill}%` } as React.CSSProperties}
      onChange={(event) => {
        const next = Number(event.target.value)
        if (onCommit) setDragging(next)
        onChange?.(next)
      }}
      onPointerUp={commit}
      onKeyUp={commit}
      onBlur={commit}
    />
  )
}

export default Slider
