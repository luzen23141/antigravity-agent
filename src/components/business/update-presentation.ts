import type { TFunction } from 'i18next';
import type { DownloadProgress, UpdateInfo, UpdateState } from '@/services/updateService.ts';

export type BadgeVariant = 'secondary' | 'destructive' | 'success' | 'warning';
export type UpdatePresentationKind = 'error' | 'update-available' | 'downloading' | 'ready-to-install' | 'default';
export type UpdateBadgeIcon = 'download' | 'loading' | 'restart' | 'error';

interface ResolveUpdatePresentationOptions {
  t: TFunction;
  state: UpdateState;
  error?: string | null;
  updateInfo?: UpdateInfo | null;
  progress?: DownloadProgress | null;
}

interface UpdatePresentation {
  kind: UpdatePresentationKind;
  badgeVariant: BadgeVariant;
  badgeIcon: UpdateBadgeIcon;
  badgeLabel: string;
  tooltipContent: string;
  dialogSubtitle: string;
}

export function resolveUpdatePresentation({
  t,
  state,
  error,
  updateInfo,
  progress,
}: ResolveUpdatePresentationOptions): UpdatePresentation {
  if (error) {
    return {
      kind: 'error',
      badgeVariant: 'destructive',
      badgeIcon: 'error',
      badgeLabel: t('badge.failed'),
      tooltipContent: t('tooltip.failed', { error }),
      dialogSubtitle: t('badge.default'),
    };
  }

  if (state === 'update-available' && updateInfo) {
    return {
      kind: 'update-available',
      badgeVariant: 'warning',
      badgeIcon: 'download',
      badgeLabel: t('badge.available'),
      tooltipContent: t('tooltip.available', { version: updateInfo.version }),
      dialogSubtitle: t('badge.default'),
    };
  }

  if (state === 'downloading') {
    return {
      kind: 'downloading',
      badgeVariant: 'secondary',
      badgeIcon: 'loading',
      badgeLabel: `${progress?.percentage ?? 0}%`,
      tooltipContent: t('tooltip.downloading', { percentage: progress?.percentage ?? 0 }),
      dialogSubtitle: t('dialog.downloadingDesc'),
    };
  }

  if (state === 'ready-to-install') {
    return {
      kind: 'ready-to-install',
      badgeVariant: 'success',
      badgeIcon: 'restart',
      badgeLabel: t('badge.restart'),
      tooltipContent: t('tooltip.ready'),
      dialogSubtitle: t('dialog.readyDesc'),
    };
  }

  return {
    kind: 'default',
    badgeVariant: 'warning',
    badgeIcon: 'download',
    badgeLabel: t('badge.default'),
    tooltipContent: t('tooltip.check'),
    dialogSubtitle: t('badge.default'),
  };
}
