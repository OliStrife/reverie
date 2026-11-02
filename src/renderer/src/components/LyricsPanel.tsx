import { useMemo } from 'react'
import { CloseIcon } from './icons'

type Line = { kind: 'line' | 'section'; text: string } | { kind: 'gap' }

const SECTION = /^\[(.+)\]$/

const toLines = (text: string): Line[] => {
  const lines: Line[] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) {
      if (lines.length > 0 && lines[lines.length - 1].kind !== 'gap') lines.push({ kind: 'gap' })
      continue
    }
    const section = SECTION.exec(line)
    lines.push(section ? { kind: 'section', text: section[1] } : { kind: 'line', text: line })
  }
  if (lines[lines.length - 1]?.kind === 'gap') lines.pop()
  return lines
}

type Props = {
  open: boolean
  trackId: string | null
  title: string | null
  lyrics: string | null | undefined
  onClose: () => void
}

function LyricsPanel({ open, trackId, title, lyrics, onClose }: Props): React.JSX.Element {
  const lines = useMemo(() => (lyrics ? toLines(lyrics) : []), [lyrics])

  return (
    <section className="lyrics-panel glass-panel" aria-label="Lyrics" inert={!open} data-no-swipe>
      <header className="lyrics-head">
        <span className="lyrics-heading">
          <span className="eyebrow">Lyrics</span>
          {title && <span className="lyrics-song">{title}</span>}
        </span>
        <button
          type="button"
          className="player-btn small lyrics-close"
          title="Close lyrics"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </header>

      <div className="lyrics-scroll" key={trackId ?? ''}>
        {lyrics === null && <p className="lyrics-empty">This song&apos;s file has no lyrics.</p>}
        {lines.map((line, index) =>
          line.kind === 'gap' ? (
            <span key={index} className="lyrics-gap" />
          ) : (
            <p key={index} className={line.kind === 'section' ? 'lyrics-section' : 'lyrics-line'}>
              {line.text}
            </p>
          )
        )}
      </div>
    </section>
  )
}

export default LyricsPanel
