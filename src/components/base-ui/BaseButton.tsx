import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils.ts';
import { Loader2 } from 'lucide-react';

type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
>;

export interface BaseButtonProps extends NativeButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// Vercel / Geist-ish 风格（高对比、干净、克制）
const buttonVariants: Record<NonNullable<BaseButtonProps['variant']>, string> = {
  default: cn(
    'bg-primary text-primary-foreground border border-primary/90 shadow-sm shadow-primary/15',
    'hover:bg-primary/92 hover:border-primary'
  ),
  destructive: cn(
    'bg-destructive text-white border border-destructive shadow-sm shadow-destructive/20',
    'hover:brightness-95'
  ),
  outline: cn(
    'bg-card/90 text-foreground border border-border shadow-sm',
    'hover:bg-accent/60 hover:border-border/90'
  ),
  secondary: cn(
    'bg-secondary text-secondary-foreground border border-transparent shadow-sm',
    'hover:bg-secondary/80'
  ),
  ghost: cn(
    'bg-transparent text-foreground border border-transparent',
    'hover:bg-accent/60'
  ),
  link: cn(
    'bg-transparent text-foreground p-0 h-auto underline-offset-4',
    'hover:underline'
  ),
};

const buttonSizes: Record<NonNullable<BaseButtonProps['size']>, string> = {
  default: 'h-9 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-10 px-6 text-sm',
  icon: 'h-9 w-9 p-0',
};

/**
 * BaseUI: BaseButton
 * 纯UI按钮组件，不包含业务逻辑
 * 支持加载状态、图标、多种样式变体
 * 使用 framer-motion 提供轻量交互动画
 */
const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const shouldReduceMotion = useReducedMotion();
    const isLinkVariant = variant === 'link';
    const isGhostVariant = variant === 'ghost';
    const canHoverRing = !isLinkVariant;
    const canHoverShadow = !isLinkVariant && !isGhostVariant;

    const whileHover = shouldReduceMotion || isDisabled ? undefined : { y: -1, scale: 1.02 };
    const whileTap = shouldReduceMotion || isDisabled ? undefined : { y: 0, scale: 0.98 };

    return (
      <motion.button
        className={cn(
          // 基础样式
          'relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none cursor-pointer',
          'rounded-xl font-medium leading-none',
          'transition-[background-color,border-color,color,box-shadow,transform] duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
          '[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
          // Hover 反馈（link/ghost 更克制）
          canHoverRing && 'hover:ring-1 hover:ring-ring/40',
          canHoverShadow && 'hover:shadow-md',

          // 变体样式
          buttonVariants[variant],

          // 尺寸样式
          buttonSizes[size],

          // 加载状态
          isLoading && 'cursor-wait',

          // 宽度
          fullWidth && 'w-full',

          // 自定义类名
          className
        )}
        disabled={isDisabled}
        ref={ref}
        whileHover={whileHover}
        whileTap={whileTap}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText || '处理中...'}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex items-center">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="flex items-center">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

BaseButton.displayName = 'BaseButton';

export { BaseButton };
