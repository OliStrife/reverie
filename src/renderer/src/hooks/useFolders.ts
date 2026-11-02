import { useEffect, useState } from 'react'

export type Folders = {
  list: string[] | null
  covered: string[]
  add: () => Promise<void>
  remove: (folder: string) => Promise<void>
  show: (folder: string) => void
}

export const folderName = (folder: string): string =>
  folder.split(/[\\/]/).filter(Boolean).pop() ?? folder

export const containingFolder = (folder: string, list: string[]): string | undefined => {
  const path = folder.toLowerCase()
  return list.find((parent) => {
    const base = parent.toLowerCase().replace(/[\\/]+$/, '')
    return path.startsWith(`${base}\\`) || path.startsWith(`${base}/`)
  })
}

export function useFolders(): Folders {
  const [list, setList] = useState<string[] | null>(null)
  const [covered, setCovered] = useState<string[]>([])

  useEffect(() => {
    window.api.getFolders().then(setList)
  }, [])

  const add = async (): Promise<void> => {
    const result = await window.api.addFolders()
    setList(result.folders)
    setCovered(result.covered)
  }

  const remove = async (folder: string): Promise<void> => {
    setList(await window.api.removeFolder(folder))
    setCovered([])
  }

  const show = (folder: string): void => {
    window.api.showFolder(folder)
  }

  return { list, covered, add, remove, show }
}
