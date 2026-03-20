import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';

export const StatCard = ({ icon: Icon, value, label, sub, color = 'brand-purple', className }) => {
  return (
    <GlassCard className={cn('p-6 flex items-center gap-4', className)}>
      <div className={`p-4 rounded-full bg-${color}/20 text-${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-white/60 font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
        {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
      </div>
    </GlassCard>
  );
};
