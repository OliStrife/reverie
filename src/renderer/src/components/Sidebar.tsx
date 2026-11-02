import { isSamePage, type Page } from '../types'
import { HomeIcon, MusicIcon, PlusIcon, SettingsIcon, TabChevronIcon } from './icons'
import PlaylistCover from './PlaylistCover'
import { usePlaylists } from './PlaylistsProvider'

type NavItem = { page: Page; label: string; icon: React.JSX.Element }

const LIBRARY: NavItem[] = [
  { page: { name: 'home' }, label: 'Home', icon: <HomeIcon /> },
  { page: { name: 'songs' }, label: 'Songs', icon: <MusicIcon /> }
]
const SETTINGS: NavItem = { page: { name: 'settings' }, label: 'Settings', icon: <SettingsIcon /> }

type Props = {
  page: Page
  onChange: (page: Page) => void
  open: boolean
  onToggle: () => void
  hidden: boolean
}

function Sidebar({ page, onChange, open, onToggle, hidden }: Props): React.JSX.Element {
  const playlists = usePlaylists()

  const button = (item: NavItem, key: string): React.JSX.Element => {
    const active = isSamePage(item.page, page)
    return (
      <button
        key={key}
        type="button"
        className={`nav-btn ${active ? 'active' : ''}`}
        aria-current={active ? 'page' : undefined}
        onClick={() => onChange(item.page)}
      >
        {item.icon}
        <span className="nav-label">{item.label}</span>
      </button>
    )
  }

  const createPlaylist = async (): Promise<void> => {
    const created = await playlists.create()
    if (created) onChange({ name: 'playlist', id: created.id })
  }

  return (
    <div className="sidebar-dock" inert={hidden}>
      <aside className="sidebar glass-panel" inert={!open}>
        <nav className="nav">
          <p className="nav-title">Library</p>
          {LIBRARY.map((item) => button(item, item.page.name))}
        </nav>

        <nav className="nav nav-playlists">
          <div className="nav-title-row">
            <p className="nav-title">Playlists</p>
            <button type="button" className="nav-add" title="New playlist" onClick={createPlaylist}>
              <PlusIcon />
            </button>
          </div>
          <div className="nav-scroll">
            {playlists.list?.map((playlist) =>
              button(
                {
                  page: { name: 'playlist', id: playlist.id },
                  label: playlist.name,
                  icon: <PlaylistCover playlist={playlist} className="tiny" single />
                },
                playlist.id
              )
            )}
            {playlists.list?.length === 0 && (
              <button type="button" className="nav-hint" onClick={createPlaylist}>
                Create your first playlist
              </button>
            )}
          </div>
        </nav>

        <nav className="nav">{button(SETTINGS, 'settings')}</nav>
      </aside>
      <button
        type="button"
        className="sidebar-tab glass-panel"
        title={open ? 'Hide sidebar' : 'Show sidebar'}
        aria-expanded={open}
        onClick={onToggle}
      >
        <TabChevronIcon />
      </button>
    </div>
  )
}

export default Sidebar
