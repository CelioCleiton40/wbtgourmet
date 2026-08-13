import * as React from 'react';
import { cn } from '@/lib/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'featured' | 'hot' | 'gold' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    /** Padrão neutro */
    default:
      'bg-g-surface-2 text-g-muted border-g-line',

    /** Produto em destaque — verde gourmet */
    featured:
      'bg-g-green/15 text-g-green-lt border-g-green/30',

    /** "Mais pedido" / Novidade — rose vibrante */
    hot:
      'bg-g-rose/15 text-g-rose-lt border-g-rose/30',

    /** Produto premium — gold elegante */
    gold:
      'bg-g-gold/15 text-g-gold-lt border-g-gold/30',

    /** Outline neutro */
    outline:
      'border-g-cream/15 text-g-muted bg-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
