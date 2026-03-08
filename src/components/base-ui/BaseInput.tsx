import React from 'react';
import { cn } from '@/lib/utils.ts';
import { Eye, EyeOff, Lock } from 'lucide-react';

let inputIdCounter = 0;

export interface BaseInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export interface BasePasswordInputProps extends Omit<BaseInputProps, 'type' | 'rightIcon'> {
  showPasswordToggle?: boolean;
}

/**
 * BaseUI: BaseInput
 * 基础输入框组件
 * 支持标签、错误信息、左右图标
 */
const BaseInput = React.forwardRef<HTMLInputElement, BaseInputProps>(
  (
    {
      className,
      label,
      error,
      leftIcon,
      rightIcon,
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useMemo(() => {
      inputIdCounter += 1;
      return `input-${inputIdCounter}`;
    }, []);
    const inputId = id || generatedId;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium',
              error ? 'text-destructive' : 'text-foreground/80'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={cn(
              // 基础样式
              'w-full rounded-xl border px-4 py-3',
              'bg-input/90 text-foreground shadow-sm',
              'border-border placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
              'transition-[background-color,border-color,color,box-shadow] duration-200',

              // 尺寸调整
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',

              // 错误状态
              error && 'border-destructive focus:ring-destructive/40',

              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

BaseInput.displayName = 'BaseInput';

/**
 * BaseUI: BasePasswordInput
 * 密码输入框组件，支持密码可见性切换
 */
const BasePasswordInput = React.forwardRef<HTMLInputElement, BasePasswordInputProps>(
  (
    {
      showPasswordToggle = true,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <BaseInput
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        leftIcon={<Lock className="h-4 w-4" />}
        rightIcon={
          showPasswordToggle ? (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          ) : undefined
        }
        {...props}
      />
    );
  }
);

BasePasswordInput.displayName = 'BasePasswordInput';

export { BaseInput, BasePasswordInput };
