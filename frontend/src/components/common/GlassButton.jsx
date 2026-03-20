import { cn } from '@/lib/utils';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export const GlassButton = forwardRef(({ children, className, variant = 'primary', isLoading, disabled, ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-[50px] font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-[var(--brand-gradient)] text-white px-8 py-3 hover:scale-[1.04] hover:shadow-glow',
    secondary: 'border border-white/20 bg-white/5 text-white px-8 py-3 hover:bg-white/10',
    ghost: 'text-white px-6 py-2 hover:bg-white/10',
    danger: 'bg-red-500/20 border border-red-500/50 text-red-200 px-8 py-3 hover:bg-red-500/30',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
GlassButton.displayName = 'GlassButton';
