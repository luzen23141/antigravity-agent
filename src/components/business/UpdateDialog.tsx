import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, RotateCw, AlertTriangle } from 'lucide-react';
import { UpdateState, UpdateInfo, DownloadProgress } from '../../services/updateService';
import { Modal } from 'antd';
import { BaseButton } from '@/components/base-ui/BaseButton';
import { BaseProgress } from '@/components/base-ui/BaseProgress';

interface BusinessUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  state: UpdateState;
  updateInfo: UpdateInfo | null;
  progress: DownloadProgress | null;
  error: string | null;
  onDownload: () => void;
  onInstall: () => void;
  onDismiss: () => void;
}

const sectionTitleClasses = 'text-sm font-semibold text-foreground';
const sectionBodyClasses = 'text-sm leading-6 text-muted-foreground';

const BusinessUpdateDialog: React.FC<BusinessUpdateDialogProps> = ({
  isOpen,
  onClose,
  state,
  updateInfo,
  progress,
  error,
  onDownload,
  onInstall,
  onDismiss,
}) => {
  const { t } = useTranslation(['update', 'common']);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const renderActions = (actions: React.ReactNode) => (
    <div className="flex justify-end gap-3 border-t border-border/70 pt-4">
      {actions}
    </div>
  );

  const renderContent = () => {
    if (error) {
      return (
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/8 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-destructive text-white shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">{t('update:dialog.errorTitle')}</h4>
              <p className="text-sm leading-6 text-destructive/90">{error}</p>
            </div>
          </div>

          {renderActions(
            <BaseButton variant="outline" onClick={onClose}>
              {t('common:buttons.close')}
            </BaseButton>
          )}
        </div>
      );
    }

    if (state === 'update-available' && updateInfo) {
      return (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {t('update:dialog.currentVersion')}
              </div>
              <div className="mt-2 text-base font-semibold text-foreground">v{updateInfo.currentVersion}</div>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/8 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-primary/80">
                {t('update:dialog.latestVersion')}
              </div>
              <div className="mt-2 text-lg font-semibold text-primary">v{updateInfo.version}</div>
            </div>
          </div>

          {updateInfo.body && (
            <div className="space-y-2">
              <h4 className={sectionTitleClasses}>{t('update:dialog.releaseNotes')}</h4>
              <div className="max-h-56 overflow-y-auto rounded-2xl border border-border/70 bg-muted/35 p-4">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-muted-foreground">
                  {updateInfo.body}
                </pre>
              </div>
            </div>
          )}

          {renderActions(
            <>
              <BaseButton variant="outline" onClick={onDismiss}>
                {t('update:dialog.ignore')}
              </BaseButton>
              <BaseButton variant="default" onClick={onDownload} leftIcon={<Download className="h-4 w-4" />}>
                {t('update:dialog.updateNow')}
              </BaseButton>
            </>
          )}
        </div>
      );
    }

    if (state === 'downloading' && progress) {
      return (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{t('update:dialog.downloadProgress')}</span>
              <span className="font-semibold text-foreground">{progress.percentage}%</span>
            </div>

            <BaseProgress value={progress.percentage} />

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{formatFileSize(progress.downloaded)}</span>
              <span>{formatFileSize(progress.total)}</span>
            </div>
          </div>

          <p className="text-center text-sm leading-6 text-muted-foreground">
            {t('update:dialog.downloadingDesc')}
          </p>
        </div>
      );
    }

    if (state === 'ready-to-install') {
      return (
        <div className="space-y-5">
          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <Download className="h-6 w-6" />
            </div>
            <h4 className="mt-4 text-lg font-semibold text-foreground">{t('update:dialog.readyTitle')}</h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('update:dialog.readyDesc')}</p>
          </div>

          {renderActions(
            <>
              <BaseButton variant="outline" onClick={onClose}>
                {t('update:dialog.restartLater')}
              </BaseButton>
              <BaseButton variant="default" onClick={onInstall} leftIcon={<RotateCw className="h-4 w-4" />}>
                {t('update:dialog.restartNow')}
              </BaseButton>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
        <h4 className={sectionTitleClasses}>{t('update:dialog.title')}</h4>
        <p className={sectionBodyClasses}>{t('update:tooltip.check')}</p>
      </div>
    );
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[24px] [&_.ant-modal-content]:border [&_.ant-modal-content]:border-border [&_.ant-modal-content]:bg-card/95 [&_.ant-modal-content]:shadow-[0_32px_80px_-40px_rgba(15,23,42,0.55)] [&_.ant-modal-content]:backdrop-blur-xl"
      width={560}
      style={{ top: 72 }}
      styles={{
        header: {
          marginBottom: 0,
          padding: '20px 20px 0',
          background: 'transparent',
        },
        body: {
          padding: 0,
        },
      }}
      title={
        <div className="flex items-center gap-2 text-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm">
            <Download className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-base font-semibold leading-none">{t('update:dialog.title')}</div>
            <div className="mt-1 text-xs font-normal text-muted-foreground">
              {state === 'downloading'
                ? t('update:dialog.downloadingDesc')
                : state === 'ready-to-install'
                  ? t('update:dialog.readyDesc')
                  : t('update:badge.default')}
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-5 p-6">
        {renderContent()}
      </div>
    </Modal>
  );
};

export default BusinessUpdateDialog;
