import { useState } from 'react'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'

const VEHICLE_TYPES = [
  { value: '',    label: 'All vehicles' },
  { value: 'car', label: 'Car' },
  { value: 'bike', label: 'Bike' },
  { value: 'ev',  label: 'EV' },
]

const SORT_OPTIONS = [
  { value: 'distance', label: 'Nearest first' },
  { value: 'price',    label: 'Cheapest first' },
  { value: 'rating',   label: 'Best rated' },
]

export default function SearchPanel({ onSearch, loading = false }) {
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    vehicle_type: '',
    max_price: '',
    radius: '2000',
    sort_by: 'distance',
  })

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch?.({
      ...filters,
      radius: parseInt(filters.radius),
      max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
    })
  }

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }))

  return (
    <div className="card-float w-full max-w-sm">
      <form onSubmit={handleSearch} className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Find Parking</h2>
            <p className="text-xs text-gray-500">Searching near your location</p>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
              showFilters ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3 pt-1 border-t border-gray-100 animate-slide-up">
            {/* Vehicle type */}
            <div>
              <label className="label text-xs">Vehicle Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {VEHICLE_TYPES.map((vt) => (
                  <button
                    key={vt.value}
                    type="button"
                    onClick={() => setFilter('vehicle_type', vt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      filters.vehicle_type === vt.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {vt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max price */}
            <div>
              <label className="label text-xs">Max Price / hr (₹)</label>
              <input
                type="number"
                min="0"
                placeholder="No limit"
                value={filters.max_price}
                onChange={(e) => setFilter('max_price', e.target.value)}
                className="input text-sm py-2"
              />
            </div>

            {/* Radius */}
            <div>
              <label className="label text-xs">Search Radius: {parseInt(filters.radius) / 1000} km</label>
              <input
                type="range"
                min="500"
                max="5000"
                step="500"
                value={filters.radius}
                onChange={(e) => setFilter('radius', e.target.value)}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>500m</span><span>5km</span>
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="label text-xs">Sort by</label>
              <select
                value={filters.sort_by}
                onChange={(e) => setFilter('sort_by', e.target.value)}
                className="input text-sm py-2"
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
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <Search size={16} />
          )}
          {loading ? 'Searching…' : 'Search Nearby Parking'}
        </button>
      </form>
    </div>
  )
}
