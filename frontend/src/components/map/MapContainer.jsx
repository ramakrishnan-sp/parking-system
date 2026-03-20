import { MapContainer as LeafletMap, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

const createIcon = (color) => new L.DivIcon({
  className: 'custom-pin',
  html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const availableIcon = createIcon('#7c3aed');
const fullIcon = createIcon('#6b7280');
const userIcon = new L.DivIcon({
  className: 'user-pin',
  html: `<div class="w-4 h-4 bg-brand-cyan rounded-full shadow-[0_0_0_4px_rgba(6,182,212,0.3)] animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

export const MapContainer = ({ center, zoom, markers, userLocation, onMarkerClick }) => {
  return (
    <LeafletMap center={center} zoom={zoom} className="w-full h-full z-0" zoomControl={false}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapUpdater center={center} zoom={zoom} />
      
      {userLocation && (
        <Marker position={userLocation} icon={userIcon} />
      )}
      
      {markers?.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.public_latitude, marker.public_longitude]}
          icon={marker.available_slots > 0 ? availableIcon : fullIcon}
          eventHandlers={{
            click: () => onMarkerClick(marker),
          }}
        />
      ))}
    </LeafletMap>
  );
};
