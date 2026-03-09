import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Key, User, FileJson } from 'lucide-react';
import dayjs from 'dayjs';
import { BaseButton } from '@/components/base-ui/BaseButton';
import { cn } from '@/lib/utils.ts';
import { logger } from '@/lib/logger.ts';
import { Modal } from "antd";
import type { AccountSessionDetailAccount } from '@/components/business/account-session-types.ts';
import { Avatar } from "@/components/ui/avatar.tsx";
import { useAppSettings } from "@/modules/use-app-settings.ts";
import { maskEmail, maskName } from "@/lib/string-masking.ts";

interface BusinessUserDetailProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  account: AccountSessionDetailAccount | null;
}

const iconColorMap = {
  apiKey: 'text-amber-500',
  accessToken: 'text-blue-500',
  refreshToken: 'text-emerald-500',
} as const;

const BusinessUserDetail: React.FC<BusinessUserDetailProps> = ({
  isOpen,
  onOpenChange,
  account
}) => {
  const { t } = useTranslation(['account', 'common']);
  const privateMode = useAppSettings(state => state.privateMode);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copiedFieldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedFieldTimerRef.current) {
        clearTimeout(copiedFieldTimerRef.current);
      }
    };
  }, []);

  const maskSensitive = (value: string): string => {
    if (!value) {
      return '';
    }

    if (value.length <= 8) {
      return '••••••••';
    }

    return `${value.slice(0, 4)}••••••${value.slice(-4)}`;
  };

  const markCopied = (fieldName: string) => {
    if (copiedFieldTimerRef.current) {
      clearTimeout(copiedFieldTimerRef.current);
    }

    setCopiedField(fieldName);
    copiedFieldTimerRef.current = setTimeout(() => {
      setCopiedField(null);
      copiedFieldTimerRef.current = null;
    }, 2000);
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    if (privateMode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      markCopied(fieldName);
    } catch (error) {
      logger.error('复制失败', {
        module: 'UserDetail',
        action: 'copy_failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const copyAsJson = async () => {
    if (!account || privateMode) {
      return;
    }

    try {
      const now = Date.now();
      const payload = {
        access_token: account.accessToken,
        email: account.email,
        expired: account.expiresIn ? dayjs(now + account.expiresIn * 1000).format() : null,
        expires_in: account.expiresIn,
        project_id: account.projectId,
        refresh_token: account.refreshToken,
        timestamp: now
      };
      await navigator.clipboard.writeText(JSON.stringify(payload));
      markCopied('json');
    } catch (error) {
      logger.error('复制 JSON 失败', {
        module: 'UserDetail',
        action: 'copy_json_failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const InfoItem = ({
    icon,
    label,
    value,
    copyable = false,
    fieldName = '',
    isMultiline = false
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    copyable?: boolean;
    fieldName?: string;
    isMultiline?: boolean;
  }) => (
    <div className="group space-y-1.5">
      <label className="flex items-center gap-2 px-1 text-sm font-medium text-foreground">
        {icon}
        <span>{label}</span>
      </label>
      <div className="relative">
        <div
          className={cn(
            'rounded-2xl border border-border/70 bg-muted/35 px-3 py-2.5 text-sm text-muted-foreground transition-colors group-hover:border-border',
            isMultiline ? 'min-h-[60px] whitespace-pre-wrap break-all font-mono' : 'break-all font-mono'
          )}
        >
          {value || t('common:status.notSet')}
        </div>
        {copyable && value && (
          <BaseButton
            variant="ghost"
            size="icon"
            className="absolute right-1.5 top-1.5 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => copyToClipboard(value, fieldName)}
            title={t('common:buttons.copy')}
          >
            {copiedField === fieldName ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </BaseButton>
        )}
      </div>
    </div>
  );

  if (!account) return null;

  return (
    <Modal
      footer={null}
      open={isOpen}
      onCancel={() => onOpenChange(false)}
      className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[24px] [&_.ant-modal-content]:border [&_.ant-modal-content]:border-border [&_.ant-modal-content]:bg-card/95 [&_.ant-modal-content]:shadow-[0_32px_80px_-40px_rgba(15,23,42,0.55)] [&_.ant-modal-content]:backdrop-blur-xl"
      width={620}
      style={{ top: 60 }}
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
        <div className="flex items-center justify-between gap-3 pr-8">
          <div className="flex items-center gap-2 text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-base font-semibold leading-none">{t('accountDetail.title')}</div>
              <div className="mt-1 text-xs font-normal text-muted-foreground">{privateMode ? maskEmail(account.email) : account.email}</div>
            </div>
          </div>
          <BaseButton
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-xl text-xs"
            onClick={copyAsJson}
            disabled={privateMode}
          >
            {copiedField === 'json' ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <FileJson className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {t('accountDetail.copyJson', 'Copy JSON')}
          </BaseButton>
        </div>
      }
    >
      <div className="max-h-[70vh] space-y-6 overflow-y-auto p-6">
        <div className="flex items-center gap-4 rounded-3xl border border-border/70 bg-muted/30 p-4">
          <Avatar src={account.userAvatar} alt={privateMode ? maskName(account.nickName) : account.nickName} className="h-14 w-14 border border-border/70" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-foreground">
              {privateMode ? maskName(account.nickName) : account.nickName}
            </h3>
            <p className="break-all text-sm text-muted-foreground">
              {privateMode ? maskEmail(account.email) : account.email}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <InfoItem
            icon={<Key className={cn('h-4 w-4', iconColorMap.apiKey)} />}
            label={t('accountDetail.apiKey')}
            value={privateMode ? maskSensitive(account.apiKey || '') : (account.apiKey || '')}
            copyable={!privateMode}
            fieldName="apiKey"
          />

          <InfoItem
            icon={<Key className={cn('h-4 w-4', iconColorMap.accessToken)} />}
            label={t('accountDetail.accessToken')}
            value={privateMode ? maskSensitive(account.accessToken || '') : (account.accessToken || '')}
            copyable={!privateMode}
            fieldName="accessToken"
            isMultiline
          />

          <InfoItem
            icon={<Key className={cn('h-4 w-4', iconColorMap.refreshToken)} />}
            label={t('accountDetail.refreshToken')}
            value={privateMode ? maskSensitive(account.refreshToken || '') : (account.refreshToken || '')}
            copyable={!privateMode}
            fieldName="refreshToken"
            isMultiline
          />
        </div>
      </div>
    </Modal>
  );
};

export default BusinessUserDetail;
