import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

export const GlassInput = forwardRef(({ label, error, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-white/80 mb-1.5">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full bg-white/5 border border-white/15 rounded-[14px] px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-all',
          error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
    </div>
  );
});
GlassInput.displayName = 'GlassInput';
