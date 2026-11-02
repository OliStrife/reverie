import { app } from 'electron'
import { join } from 'path'
import { readJson, writeJson } from './jsonFile'

export type Settings = {
  folders: string[]
}

const settingsFile = (): string => join(app.getPath('userData'), 'settings.json')

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const readSettings = (): Settings => {
  const saved = readJson(settingsFile()) as Partial<Settings> | null
  return { folders: isStringArray(saved?.folders) ? saved.folders : [] }
}

let current: Settings | null = null

export const getSettings = (): Settings => {
  current ??= readSettings()
  return current
}

export const updateSettings = (patch: Partial<Settings>): Settings => {
  current = { ...getSettings(), ...patch }
  writeJson(settingsFile(), current)
  return current
}
