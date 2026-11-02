import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { navigate, type Page } from './types'
import { useFolders } from './hooks/useFolders'
import { useStored } from './hooks/useStored'
import Backdrop from './components/Backdrop'
import HomePage from './components/HomePage'
import { useLibrary } from './components/LibraryProvider'
import PlayerBar from './components/PlayerBar'
import PlaylistPage from './components/PlaylistPage'
import { usePlaylists } from './components/PlaylistsProvider'
import SettingsPage from './components/SettingsPage'
import Sidebar from './components/Sidebar'
import SongsPage from './components/SongsPage'
import TitleBar from './components/TitleBar'

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

const MOUSE_BACK = 3

function App(): React.JSX.Element {
  const [nav, dispatchNav] = useReducer(navigate, {
    page: { name: 'home' },
    scroll: 0,
    history: []
  })
  const [sidebarOpen, setSidebarOpen] = useStored('sidebar-open', isBoolean, true)
  const [playerOpen, setPlayerOpen] = useState(false)
  const content = useRef<HTMLElement>(null)
  const folders = useFolders()
  const library = useLibrary()
  const playlists = usePlaylists()

  const { tracks: sorted, tracksById } = library
  const { page } = nav

  const go = useCallback(
    (next: Page) =>
      dispatchNav({ type: 'go', page: next, scroll: content.current?.scrollTop ?? 0 }),
    []
  )
  const back = useCallback(() => dispatchNav({ type: 'back' }), [])

  useLayoutEffect(() => {
    if (content.current) content.current.scrollTop = nav.scroll
  }, [nav])

  useEffect(() => {
    const goBack = (event: Event): void => {
      event.preventDefault()
      if (playerOpen) setPlayerOpen(false)
      else back()
    }
    const onMouseUp = (event: MouseEvent): void => {
      if (event.button === MOUSE_BACK) goBack(event)
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.altKey && event.key === 'ArrowLeft') goBack(event)
    }
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [playerOpen, back])

  const openPlaylist =
    page.name === 'playlist' ? playlists.list?.find((item) => item.id === page.id) : undefined
  const current: Page =
    page.name === 'playlist' && playlists.list && !openPlaylist ? { name: 'home' } : page

  return (
    <div
      className={`app ${sidebarOpen ? '' : 'sidebar-hidden'} ${playerOpen ? 'player-open' : ''}`}
    >
      <Backdrop />
      <TitleBar />
      <Sidebar
        page={current}
        onChange={go}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
        hidden={playerOpen}
      />
      <main ref={content} className="content" inert={playerOpen}>
        {current.name === 'home' && (
          <HomePage folders={folders.list} onNavigate={go} onAddFolder={folders.add} />
        )}
        {current.name === 'songs' && (
          <SongsPage
            folders={folders.list}
            tracks={sorted}
            scan={library.scan}
            onBack={back}
            onAddFolder={folders.add}
            onOpenSettings={() => go({ name: 'settings' })}
          />
        )}
        {current.name === 'playlist' && openPlaylist && (
          <PlaylistPage
            key={openPlaylist.id}
            playlist={openPlaylist}
            tracksById={tracksById}
            allTracks={sorted ?? []}
            onBack={back}
            onDeleted={back}
          />
        )}
        {current.name === 'settings' && <SettingsPage folders={folders} onBack={back} />}
      </main>
      <PlayerBar open={playerOpen} onOpenChange={setPlayerOpen} />
    </div>
  )
}

export default App
