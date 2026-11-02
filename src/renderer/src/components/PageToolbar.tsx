import { useEffect, useRef, useState } from 'react'
import type { TrackSearch } from '../hooks/useTrackSearch'
import { ChevronLeftIcon, CloseIcon, SearchIcon } from './icons'

type Props = {
  onBack: () => void
  search?: TrackSearch
  placeholder?: string
}

function PageToolbar({ onBack, search, placeholder = 'Search' }: Props): React.JSX.Element {
  const input = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(false)
  const searchable = search !== undefined
  const open = expanded || (search?.query ?? '') !== ''

  const openSearch = (): void => {
    setExpanded(true)
    input.current?.focus({ preventScroll: true })
  }

  useEffect(() => {
    if (!searchable) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (!(event.ctrlKey || event.metaKey) || event.code !== 'KeyF') return
      event.preventDefault()
      setExpanded(true)
      input.current?.focus({ preventScroll: true })
      input.current?.select()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [searchable])

  return (
    <div className="page-toolbar">
      <button type="button" className="back-btn glass-panel" title="Back (Alt+←)" onClick={onBack}>
        <ChevronLeftIcon />
      </button>
      {search && (
        <div
          className={`page-search glass-panel ${open ? 'open' : ''}`}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setExpanded(false)
          }}
        >
          <button
            type="button"
            className="search-toggle"
            title="Search (Ctrl+F)"
            aria-label="Search"
            tabIndex={open ? -1 : 0}
            onClick={openSearch}
          >
            <SearchIcon />
          </button>
          <input
            ref={input}
            value={search.query}
            onChange={(event) => search.setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Escape') return
              if (search.query) search.setQuery('')
              else input.current?.blur()
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            spellCheck={false}
            tabIndex={open ? 0 : -1}
          />
          {search.query && (
            <button
              type="button"
              className="search-clear"
              title="Clear search"
              onClick={() => {
                search.setQuery('')
                setExpanded(true)
                input.current?.focus({ preventScroll: true })
              }}
            >
              <CloseIcon />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default PageToolbar
