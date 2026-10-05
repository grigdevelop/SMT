import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'btn font-medium transition-all duration-75 active:scale-[0.98] motion-reduce:transform-none select-none',
  {
    variants: {
      variant: {
        primary: 'btn-primary text-primary-content',
        secondary: 'btn-secondary',
        outline: 'btn-outline',
        ghost: 'btn-ghost',
        danger: 'btn-error text-white',
        destructiveOutline: 'btn-outline btn-error',
      },
      size: {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
        icon: 'btn-square btn-sm',
        iconSm: 'btn-square btn-xs',
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
