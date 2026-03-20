import { GlassCard } from './GlassCard';

export const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-white/10 rounded-md ${className}`} />
);

export const StatCardSkeleton = () => (
  <GlassCard className="p-6 flex items-center gap-4">
    <Skeleton className="w-14 h-14 rounded-full" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  </GlassCard>
);

export const BookingCardSkeleton = () => (
  <GlassCard className="p-6 space-y-4">
    <div className="flex justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="h-4 w-48" />
    <Skeleton className="h-4 w-40" />
    <div className="flex justify-between pt-4 border-t border-white/10">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
  </GlassCard>
);

export const ParkingCardSkeleton = () => (
  <GlassCard className="overflow-hidden">
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="p-5 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  </GlassCard>
);

export const TableRowSkeleton = () => (
  <tr className="border-b border-white/10">
    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
    <td className="p-4"><Skeleton className="h-4 w-16" /></td>
    <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
  </tr>
);

export const NotificationSkeleton = () => (
  <div className="p-4 flex gap-4">
    <Skeleton className="w-2 h-2 rounded-full mt-2" />
    <div className="space-y-2 flex-1">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);
