import { useEffect, useRef } from 'react'
import {
  MapContainer as LeafletMap,
  TileLayer,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icon broken paths with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ── Custom marker icons ───────────────────────────────────

export const parkingAvailableIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <defs><filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/></filter></defs>
    <path d="M18 0C8.059 0 0 8.059 0 18c0 12.6 18 26 18 26S36 30.6 36 18C36 8.059 27.941 0 18 0z"
      fill="var(--brand, #9333ea)" filter="url(#s)"/>
    <circle cx="18" cy="18" r="9" fill="white"/>
    <text x="18" y="23" text-anchor="middle" fill="var(--brand, #9333ea)"
      font-size="12" font-weight="700" font-family="Inter,sans-serif">P</text>
  </svg>`,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
  popupAnchor: [0, -44],
})

export const parkingFullIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <path d="M18 0C8.059 0 0 8.059 0 18c0 12.6 18 26 18 26S36 30.6 36 18C36 8.059 27.941 0 18 0z"
      fill="#9ca3af"/>
    <circle cx="18" cy="18" r="9" fill="white"/>
    <text x="18" y="23" text-anchor="middle" fill="#9ca3af"
      font-size="12" font-weight="700" font-family="Inter,sans-serif">P</text>
  </svg>`,
  iconSize: [36, 44],
  iconAnchor: [18, 44],
})

export const userLocationIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="var(--brand, #9333ea)" opacity="0.2"/>
    <circle cx="14" cy="14" r="7" fill="var(--brand, #9333ea)"/>
    <circle cx="14" cy="14" r="3" fill="white"/>
  </svg>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

// ── Helper: emit map instance ─────────────────────────────

function MapReadyEmitter({ onMapReady }) {
  const map = useMap()
  useEffect(() => { onMapReady?.(map) }, [map])
  return null
}

// ── Factory helpers (for imperative use) ─────────────────

export function createParkingMarker(map, position, isAvailable = true) {
  const icon = isAvailable ? parkingAvailableIcon : parkingFullIcon
  return L.marker([position.lat, position.lng], { icon }).addTo(map)
}

export function createUserMarker(map, position) {
  return L.marker([position.lat, position.lng], {
    icon: userLocationIcon,
    zIndexOffset: 1000,
  }).addTo(map)
}

// ── Main component ────────────────────────────────────────

export default function MapContainer({
  center = { lat: 13.0827, lng: 80.2707 },
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
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <MapReadyEmitter onMapReady={onMapReady} />
      {children}
    </LeafletMap>
  )
}
