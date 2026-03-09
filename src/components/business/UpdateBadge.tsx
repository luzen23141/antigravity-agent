import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateChecker } from '@/hooks/use-update-checker.ts';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger.ts';
import BusinessUpdateDialog from '@/components/business/UpdateDialog.tsx';
import { cn } from '@/lib/utils.ts';
import { AlertTriangle, Download, Loader2, RotateCw } from 'lucide-react';
import type { DownloadProgress, UpdateInfo, UpdateState } from '@/services/updateService.ts';
import { Tooltip } from "antd";
import { BadgeVariant, resolveUpdatePresentation } from '@/components/business/update-presentation.ts';
import type { UpdateBadgeIcon } from '@/components/business/update-presentation.ts';

const badgeVariantClasses: Record<BadgeVariant, string> = {
  secondary: 'bg-secondary text-secondary-foreground border border-border/70',
  destructive: 'bg-destructive text-white border border-transparent',
  success: 'bg-emerald-600 text-white border border-transparent',
  warning: 'bg-amber-500 text-foreground border border-transparent',
};

interface InlineBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  children: React.ReactNode;
}

const badgeIconMap: Record<UpdateBadgeIcon, React.ReactNode> = {
  download: <Download className="h-3.5 w-3.5" />,
  loading: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  restart: <RotateCw className="h-3.5 w-3.5" />,
  error: <AlertTriangle className="h-3.5 w-3.5" />,
};

const InlineBadge: React.FC<InlineBadgeProps> = ({
  variant,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium shadow-sm',
        badgeVariantClasses[variant],
        'px-2 py-0.5 text-xs',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};


/**
 * 更新徽章组件
 * 已内联徽章样式，避免依赖 BaseBadge
 * 保持原有功能不变
 */
export interface UpdateBadgeProps {
  state?: UpdateState;
  updateInfo?: UpdateInfo | null;
  progress?: DownloadProgress | null;
  error?: string | null;
  onClick?: () => void;
  autoCheck?: boolean;
  className?: string;
}

const UpdateBadge: React.FC<UpdateBadgeProps> = ({
  state,
  updateInfo: updateInfoOverride,
  progress: progressOverride,
  error: errorOverride,
  onClick,
  autoCheck = true,
  className,
}) => {
  const { t } = useTranslation('update');

  // 使用自动更新检查 Hook
  const {
    updateState: internalState,
    updateInfo: internalUpdateInfo,
    downloadProgress: internalDownloadProgress,
    error: internalError,
    startDownload,
    installAndRelaunch,
    dismissUpdate,
  } = useUpdateChecker(state == null ? autoCheck : false); // 受控时禁用自动检查

  const updateState = state ?? internalState;
  const updateInfo = updateInfoOverride ?? internalUpdateInfo;
  const downloadProgress = progressOverride ?? internalDownloadProgress;
  const updateError = errorOverride ?? internalError;

  // 更新对话框状态
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  // 处理更新徽章点击
  const handleUpdateBadgeClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    setIsUpdateDialogOpen(true);
  };

  // 处理开始下载
  const handleStartDownload = async () => {
    try {
      await startDownload();
    } catch (error) {
      // 只在控制台打印错误，不提示用户
      logger.error('下载失败', {
        module: 'AppDock',
        action: 'download_update_failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  // 处理安装并重启
  const handleInstallAndRelaunch = async () => {
    try {
      toast(t('toast.installing'));
      await installAndRelaunch();
      // 如果成功，应用会重启，这里的代码不会执行
    } catch (error) {
      // 只在控制台打印错误，不提示用户
      logger.error('安装失败', {
        module: 'AppDock',
        action: 'install_update_failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };


  if (updateState === 'no-update') {
    return null;
  }

  const presentation = resolveUpdatePresentation({
    t,
    state: updateState,
    error: updateError,
    updateInfo,
    progress: downloadProgress,
  });

  return (
    <>
      {/* 更新徽章 */}
      <Tooltip title={presentation.tooltipContent}>
        <button
          type="button"
          onClick={handleUpdateBadgeClick}
          className={cn('inline-flex cursor-pointer', className)}
          aria-label="Application update"
        >
          <InlineBadge
            variant={presentation.badgeVariant}
            className={cn(
              'gap-1.5 select-none',
              updateState === 'update-available' && !updateError && 'animate-pulse'
            )}
          >
            {badgeIconMap[presentation.badgeIcon]}
            <span>{presentation.badgeLabel}</span>
          </InlineBadge>
        </button>
      </Tooltip>

      {/* 更新对话框 */}
      <BusinessUpdateDialog
        isOpen={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
        state={updateState}
        updateInfo={updateInfo}
        progress={downloadProgress}
        error={updateError}
        onDownload={handleStartDownload}
        onInstall={handleInstallAndRelaunch}
        onDismiss={() => {
          dismissUpdate();
          setIsUpdateDialogOpen(false);
        }}
      />
    </>
  );

};

export default UpdateBadge;
