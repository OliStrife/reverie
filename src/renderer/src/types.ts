export type Page =
  { name: 'home' } | { name: 'songs' } | { name: 'settings' } | { name: 'playlist'; id: string }

export const isSamePage = (a: Page, b: Page): boolean =>
  a.name === b.name && (a.name !== 'playlist' || (b.name === 'playlist' && a.id === b.id))

type Visit = { page: Page; scroll: number }

export type Navigation = Visit & { history: Visit[] }

export type NavigationAction = { type: 'go'; page: Page; scroll: number } | { type: 'back' }

const HISTORY_LIMIT = 50

export const navigate = (nav: Navigation, action: NavigationAction): Navigation => {
  if (action.type === 'go') {
    if (isSamePage(nav.page, action.page)) return nav
    const left = { page: nav.page, scroll: action.scroll }
    return {
      page: action.page,
      scroll: 0,
      history: [...nav.history.slice(1 - HISTORY_LIMIT), left]
    }
  }
  const previous = nav.history.at(-1) ?? { page: { name: 'home' }, scroll: 0 }
  return { ...previous, history: nav.history.slice(0, -1) }
}
