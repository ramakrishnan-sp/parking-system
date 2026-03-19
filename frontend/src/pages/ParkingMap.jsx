import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { MapPin } from 'lucide-react'
import { getNearbyParking } from '../api/parking'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, DEFAULT_SEARCH_RADIUS } from '../lib/constants'
import MapContainer, { createParkingMarker, createUserMarker } from '../components/map/MapContainer'
import SearchPanel from '../components/map/SearchPanel'
import ParkingCard from '../components/map/ParkingCard'
import BookingForm from '../components/booking/BookingForm'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import useAuthStore from '../store/authStore'

export default function ParkingMap() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const abortRef = useRef(null)

  const [userPos, setUserPos] = useState(null)
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(false)
  const [slowNetwork, setSlowNetwork] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  const [selected, setSelected] = useState(null)
  const [bookingTarget, setBookingTarget] = useState(null)
  const [searchFilters, setSearchFilters] = useState({
    radius: DEFAULT_SEARCH_RADIUS, vehicle_type: '', sort_by: 'distance',
  })

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserPos(DEFAULT_MAP_CENTER)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setUserPos(DEFAULT_MAP_CENTER)
        toast.info('Using default location. Enable location access for better results.')
      }
    )
  }, [])

  // Fetch on location ready
  useEffect(() => {
    if (userPos) fetchNearby(searchFilters)
  }, [userPos])

  const fetchNearby = async (filters) => {
    if (!userPos) return

    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setSlowNetwork(false)

    const slowTimer = setTimeout(() => setSlowNetwork(true), 8000)

    try {
      const params = {
        lat:     userPos.lat,
        lng:     userPos.lng,
        radius:  filters.radius,
        sort_by: filters.sort_by,
        ...(filters.vehicle_type && { vehicle_type: filters.vehicle_type }),
        ...(filters.max_price    && { max_price: filters.max_price }),
      }
      const res = await getNearbyParking(params, { signal: abortRef.current.signal })
      setSpaces(res.data)
      setSearchPerformed(true)
    } catch (err) {
      // Ignore cancellation errors
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return
    } finally {
      clearTimeout(slowTimer)
      setSlowNetwork(false)
      setLoading(false)
    }
  }

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
  }

  const handleMapReady = useCallback((map) => {
    mapRef.current = map
    if (userPos) {
      userMarkerRef.current?.remove()
      userMarkerRef.current = createUserMarker(map, userPos)
    }
  }, [userPos])

  // Place markers when spaces change
  useEffect(() => {
    const map = mapRef.current
    if (!map || spaces.length === 0) return
    clearMarkers()
    spaces.forEach((ps) => {
      const marker = createParkingMarker(map, {
        lat: ps.public_latitude,
        lng: ps.public_longitude,
      }, ps.available_slots > 0)

      marker.on('click', () => {
        setSelected(ps)
        map.panTo([ps.public_latitude, ps.public_longitude])
      })
      markersRef.current.push(marker)
    })
  }, [spaces])

  const handleBookNow = (ps) => {
    if (user?.user_type !== 'seeker') {
      toast.error('Only seekers can book parking spaces')
      return
    }
    setSelected(null)
    setBookingTarget(ps)
  }

  const handleSearch = (filters) => {
    setSearchFilters(filters)
    fetchNearby(filters)
  }

  // Memoized result list — only re-renders when spaces or selected changes
  const spaceListItems = useMemo(() => spaces.map((ps) => (
    <div
      key={ps.id}
      onClick={() => {
        setSelected(ps)
        mapRef.current?.panTo([ps.public_latitude, ps.public_longitude])
      }}
      className={`rounded-xl bg-card ring-1 cursor-pointer p-3 hover:shadow-card transition-all hover:-translate-y-0.5 ${
        selected?.id === ps.id ? 'ring-brand shadow-card' : 'ring-border'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{ps.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ps.distance_meters
              ? ps.distance_meters < 1000
                ? `${Math.round(ps.distance_meters)}m away`
                : `${(ps.distance_meters / 1000).toFixed(1)}km away`
              : ''}
          </p>
        </div>
        <span className="text-brand font-bold text-xs shrink-0">₹{ps.price_per_hour}/hr</span>
      </div>
    </div>
  )), [spaces, selected?.id])

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Left panel — full width on mobile, fixed width on desktop */}
      <div className="w-full lg:w-72 shrink-0 flex flex-col gap-3 overflow-y-auto">
        <SearchPanel
          onSearch={handleSearch}
          loading={loading}
          resultCount={spaces.length}
        />

        {/* 0 results empty state */}
        {!loading && searchPerformed && spaces.length === 0 && (
          <div className="rounded-xl bg-muted p-4 text-center">
            <MapPin className="size-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No spaces found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try increasing the search radius or removing filters.
            </p>
          </div>
        )}

        {/* Results list */}
        {spaces.length > 0 && (
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {spaceListItems}
          </div>
        )}
      </div>

      {/* Map area — fixed height on mobile, flex-1 on desktop */}
      <div className="flex-1 relative rounded-2xl overflow-hidden h-[50vh] lg:h-full">
        {userPos ? (
          <MapContainer
            center={userPos}
            zoom={DEFAULT_MAP_ZOOM}
            onMapReady={handleMapReady}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted rounded-2xl">
            <LoadingSpinner text="Getting your location…" />
          </div>
        )}

        {/* Loading overlay with slow-network message */}
        {loading && (
          <div className="absolute inset-0 bg-background/40 flex flex-col items-center justify-center rounded-2xl gap-3">
            <LoadingSpinner />
            {slowNetwork && (
              <p className="text-sm text-muted-foreground animate-fade-in">
                Taking longer than usual…
              </p>
            )}
          </div>
        )}

        {/* Selected parking popup */}
        {selected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <ParkingCard
              parking={selected}
              onBook={handleBookNow}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      {/* Booking modal */}
      <Modal
        isOpen={!!bookingTarget}
        onClose={() => setBookingTarget(null)}
        title={`Book: ${bookingTarget?.title}`}
        maxWidth="sm:max-w-md"
      >
        {bookingTarget && (
          <BookingForm
            space={bookingTarget}
            onSuccess={(booking) => {
              setBookingTarget(null)
              navigate(`/booking-confirmation/${booking.id}`)
            }}
            onCancel={() => setBookingTarget(null)}
          />
        )}
      </Modal>
    </div>
  )
}
