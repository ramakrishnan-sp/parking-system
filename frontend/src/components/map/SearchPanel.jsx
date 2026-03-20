import { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { GlassInput } from '../common/GlassInput';
import { VEHICLE_TYPES } from '@/lib/constants';
import { MapPin, Search } from 'lucide-react';

export const SearchPanel = ({ onSearch, results, onResultClick }) => {
  const [vehicleType, setVehicleType] = useState(null);
  const [maxPrice, setMaxPrice] = useState('');
  const [radius, setRadius] = useState(5);

  const handleSearch = () => {
    // Backend enforces radius <= MAX_SEARCH_RADIUS_METERS (default 5000m).
    const radiusMetersRaw = Math.max(100, Math.round(Number(radius) * 1000));
    const radiusMeters = Math.min(5000, radiusMetersRaw);
    const params = { radius: radiusMeters };

    if (vehicleType) params.vehicle_type = vehicleType;

    const maxPriceNumber = Number(maxPrice);
    if (maxPrice !== '' && Number.isFinite(maxPriceNumber)) {
      params.max_price = maxPriceNumber;
    }

    onSearch(params);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <GlassCard className="p-4 flex flex-col gap-4 shrink-0">
        <div>
          <label className="block text-xs font-medium text-white/60 mb-2">Vehicle Type</label>
          <div className="flex gap-2">
            {Object.values(VEHICLE_TYPES).map((type) => (
              <button
                key={type}
                onClick={() => setVehicleType(type === vehicleType ? null : type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  vehicleType === type 
                    ? 'bg-brand-purple/20 border-brand-purple text-brand-purple' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <GlassInput
              label="Max Price/hr (₹)"
              type="number"
              placeholder="e.g. 50"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-white/80 mb-1.5">Radius ({radius}km)</label>
            <input
              type="range"
              min="1"
              max="5"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-purple"
            />
          </div>
        </div>
        
        <GlassButton onClick={handleSearch} className="w-full py-2 text-sm">
          <Search className="w-4 h-4 mr-2" /> Search Area
        </GlassButton>
      </GlassCard>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {results?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/50">
            <MapPin className="w-12 h-12 mb-4 opacity-20" />
            <p>No parking spaces found in this area.</p>
            <p className="text-sm mt-2">Try adjusting your filters or search radius.</p>
          </div>
        ) : (
          results?.map((space) => (
            <GlassCard 
              key={space.id} 
              hover 
              className="p-4 cursor-pointer"
              onClick={() => onResultClick(space)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-white truncate pr-2">{space.title}</h4>
                <span className="text-brand-cyan font-bold whitespace-nowrap">₹{space.price_per_hour}/hr</span>
              </div>
              <div className="flex justify-between items-center text-xs text-white/60">
                <span>{space.distance_meters ? `${(space.distance_meters / 1000).toFixed(1)} km away` : 'Nearby'}</span>
                <span className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${space.available_slots > 0 ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  {space.available_slots} slots
                </span>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};
