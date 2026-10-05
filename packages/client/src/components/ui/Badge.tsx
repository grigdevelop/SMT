import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const badgeVariants = cva('badge gap-1 text-2xs font-medium transition-colors', {
  variants: {
    variant: {
      default: 'badge-ghost',
      primary: 'badge-primary badge-outline',
      success: 'badge-success badge-outline',
      warning: 'badge-warning badge-outline',
      danger: 'badge-error badge-outline',
      purple: 'badge-secondary badge-outline',
      sky: 'badge-info badge-outline',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
