import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';

export const EmptyState = ({ icon: Icon, title, message, actionText, onAction }) => {
  return (
    <GlassCard className="flex flex-col items-center justify-center p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-white/40" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 max-w-sm mb-6">{message}</p>
      {actionText && onAction && (
        <GlassButton onClick={onAction} variant="primary">
          {actionText}
        </GlassButton>
      )}
    </GlassCard>
  );
};
