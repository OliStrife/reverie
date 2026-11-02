import { isAbsolute, relative } from 'path'

export const isInside = (child: string, parent: string): boolean => {
  const path = relative(parent, child)
  return path === '' || (!path.startsWith('..') && !isAbsolute(path))
}
