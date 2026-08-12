import * as React from 'react';
import { cn } from '@/lib/cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ember' | 'outline' | 'ghost' | 'ball';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-display uppercase tracking-wider text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ball disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none';

    const variants = {
      default:
        'bg-ball text-court-night hover:bg-ball/90 shadow-[0_0_20px_rgba(212,241,58,0.25)]',
      ember:
        'bg-ember text-ink hover:bg-ember/90 shadow-[0_4px_24px_rgba(232,89,44,0.4)]',
      ball:
        'bg-ball text-court-night hover:brightness-110 font-bold',
      outline:
        'border border-sand/20 text-ink-muted hover:border-ball hover:bg-ball hover:text-court-night',
      ghost:
        'text-ink-muted hover:bg-sand/10 hover:text-ink',
    };

    const sizes = {
      default: 'h-11 px-6 py-2.5',
      sm: 'h-8 px-4 text-[11px]',
      lg: 'h-13 px-8 py-3.5 text-sm tracking-widest',
      icon: 'h-9 w-9 p-0 rounded-full',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
