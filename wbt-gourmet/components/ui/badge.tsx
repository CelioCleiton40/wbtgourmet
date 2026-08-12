import * as React from 'react';
import { cn } from '@/lib/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'ball' | 'ember' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-sand/10 text-ink border-transparent',
    ball: 'bg-ball/15 text-ball border-ball/30 font-mono',
    ember: 'bg-ember/15 text-ember border-ember/30 font-mono',
    outline: 'border-sand/20 text-ink-muted',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
