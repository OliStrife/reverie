import { app, BrowserWindow, nativeTheme, session } from 'electron'
import { join } from 'path'
import { optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerFolderHandlers } from './folders'
import { registerLibraryHandlers, startLibrary, trackPath } from './library'
import { registerLyricsHandlers } from './lyrics'
import { handleMediaRequests, registerMediaScheme } from './media'
import { registerPlaylistHandlers } from './playlists'
import { lockDown } from './security'
import { registerThumbar } from './thumbar'
import { MIN_SIZE, initialState, trackState } from './windowState'

const APP_ID = 'com.olistrife.reverie'
const BACKGROUND = '#070405'
const TITLE_BAR_HEIGHT = 40

let mainWindow: BrowserWindow | null = null

function showMainWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createWindow(): void {
  const state = initialState()
  const window = new BrowserWindow({
    ...state.bounds,
    minWidth: MIN_SIZE.width,
    minHeight: MIN_SIZE.height,
    show: false,
    backgroundColor: BACKGROUND,
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#00000000', symbolColor: '#ffffff', height: TITLE_BAR_HEIGHT },
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      backgroundThrottling: false
    }
  })
  mainWindow = window

  window.on('ready-to-show', () => {
    if (state.maximized) window.maximize()
    window.show()
  })
  window.on('closed', () => {
    mainWindow = null
  })

  trackState(window)
  lockDown(window)
  registerThumbar(window)

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

registerMediaScheme()

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', showMainWindow)

  app.whenReady().then(() => {
    app.setAppUserModelId(APP_ID)
    nativeTheme.themeSource = 'dark'
    session.defaultSession.setPermissionRequestHandler((_, __, callback) => callback(false))

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    handleMediaRequests(trackPath)
    registerFolderHandlers()
    registerLibraryHandlers()
    registerLyricsHandlers()
    registerPlaylistHandlers()
    startLibrary()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
