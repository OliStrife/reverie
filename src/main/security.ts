import { shell, type BrowserWindow } from 'electron'

const EXTERNAL_PROTOCOLS = ['https:']

export const isAllowedExternal = (url: string): boolean => {
  try {
    return EXTERNAL_PROTOCOLS.includes(new URL(url).protocol)
  } catch {
    return false
  }
}

export const lockDown = (window: BrowserWindow): void => {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternal(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== window.webContents.getURL()) event.preventDefault()
  })
}
