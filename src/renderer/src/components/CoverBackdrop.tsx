import { useState } from 'react'
import { songCoverUrl } from '../media'

type Layer = { key: number; coverId: string | null; shown: boolean }

const MAX_LAYERS = 3

function CoverBackdrop({ coverId }: { coverId: string | null }): React.JSX.Element {
  const [layers, setLayers] = useState<Layer[]>(() => [{ key: 0, coverId, shown: true }])

  const top = layers[layers.length - 1]
  if (top.coverId !== coverId) {
    const next = { key: top.key + 1, coverId, shown: coverId === null }
    setLayers([...layers.slice(1 - MAX_LAYERS), next])
  }

  const show = (key: number): void =>
    setLayers((all) => all.map((layer) => (layer.key === key ? { ...layer, shown: true } : layer)))
  const settle = (key: number): void => setLayers((all) => all.filter((layer) => layer.key >= key))

  return (
    <div className="cover-backdrop" aria-hidden="true">
      {layers.map((layer) => (
        <div
          key={layer.key}
          className={`cover-backdrop-layer ${layer.shown ? 'shown' : ''}`}
          onAnimationEnd={(event) => {
            if (event.animationName === 'backdrop-in') settle(layer.key)
          }}
        >
          {layer.coverId && (
            <img
              src={songCoverUrl(layer.coverId)}
              alt=""
              decoding="async"
              draggable={false}
              onLoad={() => show(layer.key)}
              onError={() => show(layer.key)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default CoverBackdrop
