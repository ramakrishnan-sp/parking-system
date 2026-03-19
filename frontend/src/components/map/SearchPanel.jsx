import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'

const VEHICLE_TYPES = [
  { value: '',     label: 'All' },
  { value: 'car',  label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'ev',   label: 'EV' },
]

const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest first' },
  { value: 'price',    label: 'Cheapest first' },
  { value: 'rating',   label: 'Best rated' },
]

export default function SearchPanel({ onSearch, loading = false, resultCount = 0 }) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    vehicle_type: '',
    max_price: '',
    radius: '2000',
    sort_by: 'distance',
  })

  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }))

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch?.({
      ...filters,
      radius: parseInt(filters.radius),
      max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
    })
  }

  return (
    <div className="rounded-2xl bg-card ring-1 ring-border shadow-float p-4 w-full max-w-sm">
      <form onSubmit={handleSearch} className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Find Parking</h2>
            {resultCount > 0 && (
              <p className="text-xs text-muted-foreground">{resultCount} spaces found</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors',
              showFilters ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <SlidersHorizontal className="size-3.5" /> Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 pt-2 border-t border-border animate-slide-up">
            {/* Vehicle type */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Vehicle type</p>
              <div className="flex gap-1.5 flex-wrap">
                {VEHICLE_TYPES.map((vt) => (
                  <button
                    key={vt.value}
                    type="button"
                    onClick={() => set('vehicle_type', vt.value)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                      filters.vehicle_type === vt.value
                        ? 'bg-brand text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {vt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max price */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Max price / hr (₹)</p>
              <input
                type="number"
                min="0"
                placeholder="No limit"
                value={filters.max_price}
                onChange={(e) => set('max_price', e.target.value)}
                className="h-9 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none focus:ring-2 focus:ring-brand/50"
              />
            </div>

            {/* Radius slider */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
                Radius: {(parseInt(filters.radius) / 1000).toFixed(1)} km
              </p>
              <input
                type="range" min="500" max="5000" step="500"
                value={filters.radius}
                onChange={(e) => set('radius', e.target.value)}
                className="w-full accent-brand"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                <span>0.5km</span><span>5km</span>
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Sort by</p>
              <select
                value={filters.sort_by}
                onChange={(e) => set('sort_by', e.target.value)}
                className="h-9 w-full rounded-md bg-background ring-1 ring-border px-3 text-sm outline-none"
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-9 w-full rounded-lg bg-brand text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading
            ? <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            : <Search className="size-4" />
          }
          {loading ? 'Searching…' : 'Search Nearby'}
        </button>
      </form>
    </div>
  )
}
