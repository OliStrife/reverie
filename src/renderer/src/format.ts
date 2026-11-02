export const formatDuration = (seconds: number | null): string => {
  if (seconds === null || !Number.isFinite(seconds)) return '–:––'
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const rest = String(total % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${rest}` : `${minutes}:${rest}`
}

export const formatTotal = (seconds: number): string => {
  const minutes = Math.round(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `${hours} hr ${minutes % 60} min` : `${minutes} min`
}

export const formatCount = (count: number, word: string): string =>
  `${count.toLocaleString('en-US')} ${word}${count === 1 ? '' : 's'}`
