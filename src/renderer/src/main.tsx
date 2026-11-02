import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import LibraryProvider from './components/LibraryProvider'
import PlayerProvider from './components/PlayerProvider'
import PlaylistsProvider from './components/PlaylistsProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LibraryProvider>
      <PlayerProvider>
        <PlaylistsProvider>
          <App />
        </PlaylistsProvider>
      </PlayerProvider>
    </LibraryProvider>
  </StrictMode>
)
