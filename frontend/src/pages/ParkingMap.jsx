import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getNearbyParking } from '../api/parking'
import MapContainer, { createParkingMarker, createUserMarker } from '../components/map/MapContainer'
import SearchPanel from '../components/map/SearchPanel'
import ParkingCard from '../components/map/ParkingCard'
import BookingForm from '../components/booking/BookingForm'
import Modal from '../components/common/Modal'
import LoadingSpinner from '../components/common/LoadingSpinner'
import useAuthStore from '../store/authStore'

export default function ParkingMap() {
  const navigate = useNavigate()
  const { isAuthenticated, userType } = useAuthStore()
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)

  const [userPos, setUserPos]         = useState(null)
  const [spaces, setSpaces]           = useState([])
  const [loading, setLoading]         = useState(false)
  const [selected, setSelected]       = useState(null)
  const [bookingTarget, setBookingTarget] = useState(null)
  const [filters, setFilters]         = useState({
    radius: 2000, vehicle_type: '', max_price: '', sort_by: 'distance'
  })

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // Default to a sensible fallback (New Delhi)
        setUserPos({ lat: 28.6139, lng: 77.2090 })
        toast('Using default location. Enable location for better results.', { icon: '📍' })
      }
    )
  }, [])

  // Fetch when position or filters change
  useEffect(() => {
    if (userPos) fetchNearby()
  }, [userPos, filters])

  const fetchNearby = async () => {
    setLoading(true)
    try {
      const params = {
        lat: userPos.lat,
        lng: userPos.lng,
        radius: filters.radius,
        ...(filters.vehicle_type && { vehicle_type: filters.vehicle_type }),
        ...(filters.max_price    && { max_price: filters.max_price }),
        sort_by: filters.sort_by,
      }
      const res = await getNearbyParking(params)
      setSpaces(res.data)
    } catch {} finally { setLoading(false) }
  }

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
  }

  const handleMapReady = useCallback((map) => {
    mapRef.current = map

    // User marker
    if (userPos) {
      userMarkerRef.current = createUserMarker(map, userPos)
    }
  }, [userPos])

  // Render parking markers whenever spaces change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    clearMarkers()
    spaces.forEach((ps) => {
      const marker = createParkingMarker(map, {
        lat: ps.public_latitude,
        lng: ps.public_longitude,
      }, ps.is_available)

      marker.on('click', () => {
        setSelected(ps)
        map.panTo([ps.public_latitude, ps.public_longitude])
      })
      markersRef.current.push(marker)
    })
  }, [spaces])

  const handleBookNow = (ps) => {
    if (!isAuthenticated()) { navigate('/login'); return }
    if (userType() !== 'seeker') { toast.error('Only seekers can book parking'); return }
    setBookingTarget(ps)
    setSelected(null)
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Search panel */}
      <div className="relative z-10">
        <SearchPanel
          filters={filters}
          onChange={setFilters}
          onSearch={fetchNearby}
          loading={loading}
          resultCount={spaces.length}
        />
      </div>

      {/* Map + sidebar layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map */}
        <div className="flex-1">
          {userPos ? (
            <MapContainer
              center={userPos}
              zoom={14}
              onMapReady={handleMapReady}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <LoadingSpinner text="Getting your location…" />
            </div>
          )}
        </div>

        {/* Selected parking card overlay */}
        {selected && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-10">
            <ParkingCard
              space={selected}
              onClose={() => setSelected(null)}
              onBookNow={() => handleBookNow(selected)}
            />
          </div>
        )}

        {/* Result count */}
        {!selected && spaces.length > 0 && (
          <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1.5 shadow text-xs font-medium text-gray-700 z-10">
            {spaces.length} spaces found
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-20 pointer-events-none">
            <LoadingSpinner />
          </div>
        )}
      </div>

      {/* Booking modal */}
      <Modal
        isOpen={!!bookingTarget}
        onClose={() => setBookingTarget(null)}
        title={`Book: ${bookingTarget?.title}`}
        maxWidth="max-w-xl"
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
