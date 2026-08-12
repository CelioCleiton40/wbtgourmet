import * as React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-sand/15 bg-sand/5 px-4 py-2 text-sm text-ink placeholder:text-ink-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ball focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
