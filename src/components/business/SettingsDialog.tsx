import React, { useEffect, useState } from 'react';
import { Bug, EyeOff, FileCode, FolderOpen, Monitor, Settings, VolumeX } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { getVersion } from '@tauri-apps/api/app';
import { BaseButton } from '@/components/base-ui/BaseButton';
import { cn } from '@/lib/utils.ts';
import { PlatformCommands } from "@/commands/PlatformCommands.ts";
import { Modal } from "antd";
import { useAppSettings } from "@/modules/use-app-settings.ts";
import { LoggingCommands } from "@/commands/LoggingCommands.ts";
import { useTranslation } from 'react-i18next';


interface BusinessSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const BusinessSettingsDialog: React.FC<BusinessSettingsDialogProps> = ({
  isOpen,
  onOpenChange
}) => {
  const { t } = useTranslation('settings');
  const [execPath, setExecPath] = useState<string>('');
  const [logDirPath, setLogDirPath] = useState<string>('');
  const [appVersion, setAppVersion] = useState<string>('');


  // 应用设置（统一管理）
  const systemTrayEnabled = useAppSettings(state => state.systemTrayEnabled);
  const silentStartEnabled = useAppSettings(state => state.silentStartEnabled);
  const debugMode = useAppSettings(state => state.debugMode);
  const privateMode = useAppSettings(state => state.privateMode);

  const setSystemTrayEnabled = useAppSettings(state => state.setSystemTrayEnabled);
  const setSilentStartEnabled = useAppSettings(state => state.setSilentStartEnabled);
  const setDebugMode = useAppSettings(state => state.setDebugMode);
  const setPrivateMode = useAppSettings(state => state.setPrivateMode);

  const loading = useAppSettings(state => state.loading);

  useEffect(() => {
    if (isOpen) {
      loadCurrentPaths();
      loadLogDirectoryPath();
      loadAppVersion();
    }
  }, [isOpen]);

  const loadAppVersion = async () => {
    const version = await getVersion();
    setAppVersion(version);
  };

  const loadCurrentPaths = async () => {
    const paths = await PlatformCommands.getCurrentPaths();
    let finalExecPath = paths.executablePath;

    if (!finalExecPath) {
      const detectedExec = await PlatformCommands.detectExecutable();
      if (detectedExec.found && detectedExec.path) {
        finalExecPath = detectedExec.path + t('paths.autoDetected');
      }
    }

    setExecPath(finalExecPath || t('paths.notSet'));
  };

  const loadLogDirectoryPath = async () => {
    try {
      const logPath = await LoggingCommands.getLogDirectoryPath();
      setLogDirPath(logPath || t('paths.notSet'));
    } catch (_error) {
      setLogDirPath(t('paths.notSet'));
    }
  };

  const handleBrowseExecPath = async () => {
    try {
      const result = await open({
        directory: false,
        multiple: false,
        title: t('dialogs.selectExecutable'),
        filters: [
          { name: t('dialogs.executableFilter'), extensions: ['exe', 'app', ''] },
          { name: t('dialogs.allFilesFilter'), extensions: ['*'] }
        ]
      });

      if (result && typeof result === 'string') {
        const valid = await PlatformCommands.validateExecutable(result);
        if (valid) {
          await PlatformCommands.saveAntigravityExecutable(result);
          setExecPath(result);
        } else {
        }
      }
    } catch (error) {
    }
  };

  const handleOpenLogDirectory = async () => {
    await LoggingCommands.openLogDirectory();
  };

  return (
    <Modal
      open={isOpen}
      footer={null}
      onCancel={() => onOpenChange(false)}
      className="[&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:rounded-[24px] [&_.ant-modal-content]:border [&_.ant-modal-content]:border-border [&_.ant-modal-content]:bg-card/95 [&_.ant-modal-content]:shadow-[0_32px_80px_-40px_rgba(15,23,42,0.55)] [&_.ant-modal-content]:backdrop-blur-xl"
      width={680}
      style={{ top: 48 }}
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
      title={<div className={"flex flex-row items-center gap-1.5 text-foreground"}>
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span>{t('title')}</span>
        <span
          className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-mono font-normal text-muted-foreground">
          {t('version', { version: appVersion })}
        </span>
      </div>
      }
    >
      <div className="space-y-6 p-6">
        {/* 路径设置组 */}
        <div className="space-y-4">
          <div className="space-y-3">
            <PathSettingRow
              label={t('paths.executable')}
              value={execPath}
              actionTitle={t('paths.executable')}
              onAction={handleBrowseExecPath}
              actionIcon={<FileCode className="h-4 w-4 text-muted-foreground" />}
            />

            <PathSettingRow
              label={t('paths.logDirectory')}
              value={logDirPath}
              actionTitle={t('paths.openLogDirectory')}
              onAction={handleOpenLogDirectory}
              actionIcon={<FolderOpen className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
        </div>

        <div className="h-px bg-border/80" />



        <div className="h-px bg-border/80" />

        <div className="space-y-1">
          <SettingToggle
            icon={<Monitor className="h-4 w-4 text-blue-500" />}
            title={t('toggles.systemTray.title')}
            description={t('toggles.systemTray.description')}
            checked={systemTrayEnabled}
            onChange={setSystemTrayEnabled}
            isLoading={loading.systemTray}
          />

          <SettingToggle
            icon={<VolumeX className="h-4 w-4 text-purple-500" />}
            title={t('toggles.silentStart.title')}
            description={t('toggles.silentStart.description')}
            checked={silentStartEnabled}
            onChange={setSilentStartEnabled}
            isLoading={loading.silentStart}
          />

          <SettingToggle
            icon={<EyeOff className="h-4 w-4 text-emerald-500" />}
            title={t('toggles.privateMode.title')}
            description={t('toggles.privateMode.description')}
            checked={privateMode}
            onChange={setPrivateMode}
            isLoading={loading.privateMode}
          />

          <SettingToggle
            icon={<Bug className="h-4 w-4 text-orange-500" />}
            title={t('toggles.debugMode.title')}
            description={t('toggles.debugMode.description')}
            checked={debugMode}
            onChange={setDebugMode}
            isLoading={loading.debugMode}
          />
        </div>

        <div className="h-px bg-border/80" />

        <div className="space-y-1">
          <a target={"_blank"} href={"https://github.com/MonchiLin/antigravity-agent/issues"}>{t('links.issues')}</a>
        </div>

      </div>
    </Modal>
  );
};

const PathSettingRow = ({
  label,
  value,
  actionTitle,
  onAction,
  actionIcon,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  actionTitle: string;
  onAction: () => void;
  actionIcon: React.ReactNode;
}) => (
  <div className="group space-y-1.5">
    <label
      className="block px-1 text-sm font-medium text-foreground">
      {label}
    </label>
    <div className="flex gap-2">
      <div
        className="flex-1 rounded-xl border border-border bg-input/80 px-3 py-2 text-xs font-mono text-muted-foreground break-all select-all transition-colors group-hover:border-border/80">
        {value}
      </div>
      <BaseButton
        variant="outline"
        size="icon"
        className="h-[36px] w-[36px] shrink-0"
        onClick={onAction}
        title={actionTitle}
      >
        {actionIcon}
      </BaseButton>
    </div>
  </div>
);

// 内部组件：设置开关项
const SettingToggle = ({
  icon,
  title,
  description,
  checked,
  onChange,
  isLoading
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  isLoading: boolean;
}) => (
  <div className="group flex cursor-pointer items-center justify-between rounded-2xl border border-transparent p-3 transition-colors hover:border-border/70 hover:bg-accent/35" onClick={() => !isLoading && onChange(!checked)}>
    <div className="flex items-center gap-3">
      <div className="rounded-xl border border-border/70 bg-card p-2 shadow-sm transition-colors group-hover:border-border">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs leading-5 text-muted-foreground">{description}</div>
      </div>
    </div>

    <div className="relative">
      {isLoading ? (
        <div className="h-5 w-9 flex items-center justify-center">
          <div className="animate-spin rounded-full border-2 border-border border-t-primary h-3.5 w-3.5"></div>
        </div>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            checked ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              checked ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
      )}
    </div>
  </div>
);

export default BusinessSettingsDialog;
