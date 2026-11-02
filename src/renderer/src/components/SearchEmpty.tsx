import type { TrackSearch } from '../hooks/useTrackSearch'

function SearchEmpty({ search }: { search: TrackSearch }): React.JSX.Element {
  return (
    <div className="search-empty">
      <p>Nothing matches “{search.search}”.</p>
      <button type="button" className="secondary-btn" onClick={() => search.setQuery('')}>
        Clear search
      </button>
    </div>
  )
}

export default SearchEmpty
