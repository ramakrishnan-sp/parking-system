import { GlassCard } from '../common/GlassCard';
import { GlassButton } from '../common/GlassButton';
import { Star, MapPin, ShieldAlert } from 'lucide-react';

export const ParkingCard = ({ space, onBook }) => {
  if (!space) return null;

  return (
    <GlassCard className="w-80 overflow-hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300">
      <div className="h-32 bg-white/5 relative">
        {space.photos?.[0]?.photo_url ? (
          <img src={space.photos[0].photo_url} alt={space.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-purple/20 to-brand-pink/20 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-white/40" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-semibold text-white flex items-center">
          <Star className="w-3 h-3 text-yellow-400 mr-1 fill-yellow-400" />
          {space.avg_rating || 'New'}
        </div>
      </div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-lg text-white truncate pr-2">{space.title}</h3>
          <p className="text-brand-cyan font-bold text-lg">₹{space.price_per_hour}<span className="text-xs text-white/50 font-normal">/hr</span></p>
        </div>
        
        <div className="flex items-center text-sm text-white/60 mb-4">
          <span>{space.distance_meters ? `${(space.distance_meters / 1000).toFixed(1)} km away` : 'Nearby'}</span>
          <span className="mx-2">•</span>
          <span className={`${space.available_slots > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {space.available_slots} / {space.total_slots} slots
          </span>
        </div>

        <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80 leading-tight">Exact location will be revealed after booking confirmation.</p>
        </div>

        <GlassButton 
          className="w-full" 
          disabled={space.available_slots === 0}
          onClick={() => onBook(space)}
        >
          {space.available_slots > 0 ? 'Book Now' : 'Space Full'}
        </GlassButton>
      </div>
    </GlassCard>
  );
};
