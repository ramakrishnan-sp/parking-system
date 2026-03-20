import { cn } from '@/lib/utils';
import { BOOKING_STATUS, PARKING_STATUS, USER_TYPES } from '@/lib/constants';

export const GlassBadge = ({ status, type, className }) => {
  let styles = 'bg-white/10 border-white/20 text-white/80';
  let label = status || type;

  if (status === BOOKING_STATUS.CONFIRMED || status === BOOKING_STATUS.ACTIVE || status === PARKING_STATUS.APPROVED || status === 'paid') {
    styles = 'bg-green-500/20 border-green-500/50 text-green-300';
  } else if (status === BOOKING_STATUS.PENDING || status === PARKING_STATUS.PENDING) {
    styles = 'bg-amber-500/20 border-amber-500/50 text-amber-300';
  } else if (status === BOOKING_STATUS.CANCELLED || status === PARKING_STATUS.REJECTED || status === 'refunded') {
    styles = 'bg-red-500/20 border-red-500/50 text-red-300';
  } else if (status === BOOKING_STATUS.COMPLETED) {
    styles = 'bg-blue-500/20 border-blue-500/50 text-blue-300';
  } else if (type === USER_TYPES.SEEKER) {
    styles = 'bg-brand-cyan/20 border-brand-cyan/50 text-brand-cyan';
  } else if (type === USER_TYPES.OWNER) {
    styles = 'bg-brand-purple/20 border-brand-purple/50 text-brand-purple';
  } else if (type === USER_TYPES.ADMIN) {
    styles = 'bg-brand-pink/20 border-brand-pink/50 text-brand-pink';
  }

  const labelText = label == null ? '' : String(label);
  const displayLabel = labelText
    ? labelText.charAt(0).toUpperCase() + labelText.slice(1)
    : '';

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', styles, className)}>
      {displayLabel}
    </span>
  );
};
