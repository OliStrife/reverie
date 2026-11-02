import { readFileSync, renameSync, writeFileSync } from 'fs'

export const readJson = (file: string): unknown => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

export const writeJson = (file: string, data: unknown): void => {
  writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 2))
  renameSync(`${file}.tmp`, file)
}
