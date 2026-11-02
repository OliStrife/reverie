import { useState } from 'react'
import { songCoverUrl } from '../media'
import { MusicIcon } from './icons'

type Props = {
  id: string | null
  className?: string
}

function Cover({ id, className = 'song-cover' }: Props): React.JSX.Element {
  const [failed, setFailed] = useState<string | null>(null)
  const showImage = id !== null && failed !== id

  return (
    <span className={className}>
      {showImage ? (
        <img
          src={songCoverUrl(id)}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(id)}
        />
      ) : (
        <MusicIcon />
      )}
    </span>
  )
}

export default Cover
