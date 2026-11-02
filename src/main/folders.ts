import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { resolve } from 'path'
import type { AddFoldersResult } from '../shared/folders'
import { rescanLibrary } from './library'
import { isInside } from './paths'
import { getSettings, updateSettings } from './settings'

const mergeFolders = (current: string[], picked: string[]): AddFoldersResult => {
  let folders = [...current]
  const covered: string[] = []
  for (const folder of picked.map((path) => resolve(path))) {
    if (folders.some((existing) => isInside(folder, existing))) {
      covered.push(folder)
      continue
    }
    folders = folders.filter((existing) => !isInside(existing, folder))
    folders.push(folder)
  }
  return { folders, covered }
}

const pickFolders = async (window: BrowserWindow | null): Promise<AddFoldersResult> => {
  const options: Electron.OpenDialogOptions = {
    title: 'Add music folder',
    buttonLabel: 'Add folder',
    defaultPath: app.getPath('music'),
    properties: ['openDirectory', 'multiSelections']
  }
  const result = window
    ? await dialog.showOpenDialog(window, options)
    : await dialog.showOpenDialog(options)
  const { folders } = getSettings()
  if (result.canceled || result.filePaths.length === 0) return { folders, covered: [] }

  const merged = mergeFolders(folders, result.filePaths)
  if (merged.covered.length < result.filePaths.length) {
    updateSettings({ folders: merged.folders })
    rescanLibrary()
  }
  return merged
}

let picking = false

export const registerFolderHandlers = (): void => {
  ipcMain.handle('folders:get', () => getSettings().folders)

  ipcMain.handle('folders:add', async (event): Promise<AddFoldersResult> => {
    if (picking) return { folders: getSettings().folders, covered: [] }
    picking = true
    try {
      return await pickFolders(BrowserWindow.fromWebContents(event.sender))
    } finally {
      picking = false
    }
  })

  ipcMain.handle('folders:remove', (_, folder: unknown) => {
    const { folders } = getSettings()
    if (typeof folder !== 'string' || !folders.includes(folder)) return folders
    const next = updateSettings({ folders: folders.filter((existing) => existing !== folder) })
    rescanLibrary()
    return next.folders
  })

  ipcMain.handle('folders:show', async (_, folder: unknown) => {
    if (typeof folder !== 'string' || !getSettings().folders.includes(folder)) return
    await shell.openPath(folder)
  })
}
