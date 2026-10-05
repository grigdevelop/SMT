import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-75 active:scale-[0.98] motion-reduce:transform-none disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-2xs border border-transparent',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-transparent',
        outline:
          'border border-border bg-card text-foreground hover:bg-muted hover:border-slate-300 dark:hover:border-slate-700',
        ghost:
          'text-muted-foreground hover:text-foreground hover:bg-muted active:bg-slate-200 dark:active:bg-slate-700 border border-transparent',
        danger:
          'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-2xs border border-transparent',
        destructiveOutline:
          'border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40',
      },
      size: {
        sm: 'px-2.5 py-1 text-xs',
        md: 'px-3.5 py-2 text-xs sm:text-sm',
        lg: 'px-4 py-2.5 text-sm',
        icon: 'p-1.5 active:scale-90',
        iconSm: 'p-1 active:scale-90 text-xs',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';
