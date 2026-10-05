import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn('input input-bordered w-full text-base sm:text-xs', className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
