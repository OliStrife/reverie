import { WaveIcon } from './icons'

function TitleBar(): React.JSX.Element {
  return (
    <header className="titlebar">
      <span className="brand-mark">
        <WaveIcon />
      </span>
      <span className="brand-name">Reverie</span>
    </header>
  )
}

export default TitleBar
