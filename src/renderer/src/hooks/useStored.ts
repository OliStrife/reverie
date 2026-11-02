import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

const SAVE_DELAY = 300

const load = <T>(key: string, isValid: (value: unknown) => value is T): T | null => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    return isValid(value) ? value : null
  } catch {
    return null
  }
}

const save = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function useStored<T>(
  key: string,
  isValid: (value: unknown) => value is T,
  fallback: T
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [saved] = useState(() => load(key, isValid))
  const [value, setValue] = useState<T>(saved ?? fallback)

  useEffect(() => {
    const timer = setTimeout(() => save(key, value), SAVE_DELAY)
    return () => clearTimeout(timer)
  }, [key, value])

  return [value, setValue, saved !== null]
}
