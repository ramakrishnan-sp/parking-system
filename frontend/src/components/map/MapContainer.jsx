import { useEffect, useRef } from 'react'
import {
  MapContainer as LeafletMap,
  TileLayer,
  Marker,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet's default icon broken paths when bundled with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Custom SVG icons ──────────────────────────────────────────────────────────

const parkingAvailableIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
    <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/></filter>
    <path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 28 20 28S40 34 40 20C40 8.954 31.046 0 20 0z"
          fill="#2563eb" filter="url(#sh)"/>
    <circle cx="20" cy="20" r="10" fill="white"/>
    <text x="20" y="25" text-anchor="middle" fill="#2563eb"
          font-size="13" font-weight="700" font-family="Inter,sans-serif">P</text>
  </svg>`,
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48],
})

const parkingUnavailableIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
    <path d="M20 0C8.954 0 0 8.954 0 20c0 14 20 28 20 28S40 34 40 20C40 8.954 31.046 0 20 0z"
          fill="#9ca3af"/>
    <circle cx="20" cy="20" r="10" fill="white"/>
    <text x="20" y="25" text-anchor="middle" fill="#9ca3af"
          font-size="13" font-weight="700" font-family="Inter,sans-serif">P</text>
  </svg>`,
  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -48],
})

const userLocationIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#2563eb" opacity="0.2"/>
    <circle cx="16" cy="16" r="8"  fill="#2563eb"/>
    <circle cx="16" cy="16" r="4"  fill="white"/>
  </svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

// ── Internal component to expose map instance via onMapReady ─────────────────

function MapReadyEmitter({ onMapReady }) {
  const map = useMap()
  useEffect(() => {
    if (onMapReady) onMapReady(map)
  }, [map, onMapReady])
  return null
}

// ── Main MapContainer ─────────────────────────────────────────────────────────

export default function MapContainer({
  center = { lat: 20.5937, lng: 78.9629 },
  zoom = 13,
  onMapReady,
  className = '',
  children,
}) {
  return (
    <LeafletMap
      center={[center.lat, center.lng]}
      zoom={zoom}
      className={`w-full h-full ${className}`}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapReadyEmitter onMapReady={onMapReady} />
      {children}
    </LeafletMap>
  )
}

// ── Marker factory functions (API-compatible with ParkingMap.jsx) ─────────────

/**
 * Creates a parking marker on a Leaflet map.
 * Returns a Leaflet marker instance with .remove() and .setLatLng() support.
 */
export function createParkingMarker(map, position, isAvailable = true) {
  const icon = isAvailable ? parkingAvailableIcon : parkingUnavailableIcon
  return L.marker([position.lat, position.lng], { icon }).addTo(map)
}

/**
 * Creates the user's location marker.
 */
export function createUserMarker(map, position) {
  return L.marker([position.lat, position.lng], { icon: userLocationIcon, zIndexOffset: 1000 }).addTo(map)
}
