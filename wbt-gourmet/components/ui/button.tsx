import * as React from 'react';
import { cn } from '@/lib/cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'rose';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-body font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-green focus-visible:ring-offset-2 focus-visible:ring-offset-g-dark disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97] select-none';

    const variants = {
      /** CTA principal — verde gourmet vibrante */
      primary:
        'bg-g-green text-g-dark hover:bg-g-green-lt shadow-[0_4px_24px_rgba(75,166,70,0.35)] hover:shadow-[0_6px_32px_rgba(75,166,70,0.5)]',

      /** CTA secundário — borda cream sutil */
      secondary:
        'border border-g-cream/20 text-g-cream bg-transparent hover:bg-g-cream/8 hover:border-g-cream/40',

      /** Ação neutra — mínima visibilidade */
      ghost:
        'text-g-muted hover:bg-g-surface-2 hover:text-g-cream',

      /** Outline com cor do label */
      outline:
        'border border-g-green/30 text-g-green bg-transparent hover:bg-g-green hover:text-g-dark hover:border-g-green',

      /** SOMENTE erros / ações destrutivas */
      danger:
        'border border-g-error/30 text-g-error bg-transparent hover:bg-g-error hover:text-white hover:border-g-error',

      /** Rose — badges de ação especial */
      rose:
        'bg-g-rose text-white hover:bg-g-rose-lt shadow-[0_4px_20px_rgba(201,88,122,0.35)]',
    };

    const sizes = {
      default: 'h-11 px-6 py-2.5 text-sm',
      sm:      'h-8 px-4 text-xs',
      lg:      'h-14 px-8 py-3.5 text-base',
      icon:    'h-10 w-10 p-0 rounded-full',
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
