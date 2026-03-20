import { cn } from '@/lib/utils';

export const GlassCard = ({ children, className, hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'glass-panel',
        hover && 'transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
