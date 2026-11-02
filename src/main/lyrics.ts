import { ipcMain } from 'electron'
import { parseFile } from 'music-metadata'
import { trackPath } from './library'

export const registerLyricsHandlers = (): void => {
  ipcMain.handle('library:lyrics', async (_, id: unknown): Promise<string | null> => {
    const path = typeof id === 'string' ? trackPath(id) : undefined
    if (!path) return null
    try {
      const { common } = await parseFile(path, { skipCovers: true, duration: false })
      const text = common.lyrics?.find((lyrics) => lyrics.text?.trim())?.text
      return text?.trim() || null
    } catch {
      return null
    }
  })
}
