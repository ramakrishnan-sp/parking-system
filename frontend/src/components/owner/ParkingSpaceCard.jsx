import { GlassCard } from '@/components/common/GlassCard';
import { GlassBadge } from '@/components/common/GlassBadge';
import { GlassButton } from '@/components/common/GlassButton';
import { MapPin, IndianRupee, Car, Edit, Trash2, Power } from 'lucide-react';

export function ParkingSpaceCard({ space, onEdit, onDelete, onToggleActive }) {
  const vehicleLabel = (space?.vehicle_type_allowed || 'all').toString().toUpperCase();
  const lat = Number(space?.exact_latitude);
  const lng = Number(space?.exact_longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <GlassCard className="flex flex-col h-full overflow-hidden group">
      <div className="relative h-48 overflow-hidden">
        {space.photos && space.photos.length > 0 ? (
          <img 
            src={space.photos[0].photo_url} 
            alt={space.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-brand-purple/20 flex items-center justify-center">
            <Car className="w-12 h-12 text-brand-purple/50" />
          </div>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {!space.is_approved && <GlassBadge status="pending" />}
          <GlassBadge status={space.is_active ? 'active' : 'inactive'} />
        </div>
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1">
          <IndianRupee className="w-4 h-4 text-brand-cyan" />
          <span className="text-white font-bold">{space.price_per_hour}</span>
          <span className="text-white/60 text-xs">/hr</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{space.title}</h3>
        
        <div className="flex items-start gap-2 text-white/60 mb-4 text-sm">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-brand-pink" />
          <p className="line-clamp-2">
            {space.description || (hasCoords ? `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}` : 'Location details not available')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-[10px] uppercase font-semibold bg-white/5 border border-white/10 text-white/80 px-2 py-1 rounded-md">
            {vehicleLabel}
          </span>
        </div>

        <div className="mt-auto flex gap-2">
          <GlassButton 
            variant="secondary" 
            className="flex-1 py-2 text-sm"
            onClick={() => onToggleActive(space.id, !space.is_active)}
          >
            <Power className={`w-4 h-4 mr-2 ${space.is_active ? 'text-red-400' : 'text-green-400'}`} />
            {space.is_active ? 'Disable' : 'Enable'}
          </GlassButton>
          <GlassButton 
            variant="secondary" 
            className="px-3 py-2"
            onClick={() => onEdit(space)}
            aria-label="Edit"
          >
            <Edit className="w-4 h-4 text-brand-cyan" />
          </GlassButton>
          <GlassButton 
            variant="danger" 
            className="px-3 py-2"
            onClick={() => onDelete(space)}
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}
