import React from 'react';
import { cn } from '@/lib/utils.ts';

export interface BaseProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

/**
 * BaseUI: BaseProgress
 * 基础进度条组件
 */
const BaseProgress = React.forwardRef<HTMLDivElement, BaseProgressProps>(
  (
    {
      value,
      max = 100,
      className,
      showLabel = false,
      size = 'default',
      variant = 'default',
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: 'h-2',
      default: 'h-3',
      lg: 'h-4',
    };

    const variantClasses = {
      default: 'bg-primary',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-destructive',
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <div
          className={cn(
            'w-full overflow-hidden rounded-full border border-border/70 bg-muted/70',
            sizeClasses[size]
          )}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-out shadow-sm',
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 flex justify-between text-sm text-muted-foreground">
            <span>{value}</span>
            <span>{max}</span>
          </div>
        )}
      </div>
    );
  }
);

BaseProgress.displayName = 'BaseProgress';

export { BaseProgress };
