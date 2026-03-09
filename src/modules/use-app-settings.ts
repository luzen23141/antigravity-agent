import { create } from "zustand";
import { SettingsCommands } from "@/commands/SettingsCommands.ts";
import { logger } from "@/lib/logger.ts";
import { relaunch } from "@tauri-apps/plugin-process";
import i18n, { type SupportedLanguage } from "@/i18n";

type State = {
  hydrated: boolean;
  systemTrayEnabled: boolean;
  silentStartEnabled: boolean;
  debugMode: boolean;
  privateMode: boolean;
  language: SupportedLanguage;
  loading: {
    hydrate: boolean;
    systemTray: boolean;
    silentStart: boolean;
    debugMode: boolean;
    privateMode: boolean;
    language: boolean;
  };
}

export type AppSettingsState = State;

type Actions = {
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
  setSystemTrayEnabled: (enabled: boolean) => Promise<void>;
  setSilentStartEnabled: (enabled: boolean) => Promise<void>;
  setDebugMode: (enabled: boolean) => Promise<void>;
  setPrivateMode: (enabled: boolean) => Promise<void>;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
}

type LoadingKey = keyof State['loading'];
type LoadedSettings = {
  systemTrayEnabled: boolean;
  silentStartEnabled: boolean;
  debugMode: boolean;
  privateMode: boolean;
  language: SupportedLanguage;
};

export const selectAppSettingsValues = (state: AppSettingsState) => ({
  systemTrayEnabled: state.systemTrayEnabled,
  silentStartEnabled: state.silentStartEnabled,
  debugMode: state.debugMode,
  privateMode: state.privateMode,
});

export const selectAppSettingsActions = (state: Actions) => ({
  setSystemTrayEnabled: state.setSystemTrayEnabled,
  setSilentStartEnabled: state.setSilentStartEnabled,
  setDebugMode: state.setDebugMode,
  setPrivateMode: state.setPrivateMode,
});

export const selectAppSettingsDialogState = (state: AppSettingsState & Actions) => ({
  systemTrayEnabled: state.systemTrayEnabled,
  silentStartEnabled: state.silentStartEnabled,
  debugMode: state.debugMode,
  privateMode: state.privateMode,
  setSystemTrayEnabled: state.setSystemTrayEnabled,
  setSilentStartEnabled: state.setSilentStartEnabled,
  setDebugMode: state.setDebugMode,
  setPrivateMode: state.setPrivateMode,
  loading: state.loading,
});

export const useAppSettings = create<State & Actions>((setState, getState) => {
  let hydrationPromise: Promise<void> | null = null;

  const setLoading = (key: LoadingKey, enabled: boolean) => {
    setState(state => ({ loading: { ...state.loading, [key]: enabled } }));
  };

  const applyLoadedSettings = (next: LoadedSettings) => {
    setState({
      ...next,
      hydrated: true,
    });
  };

  const logActionError = (message: string, action: string, extra: Record<string, unknown> = {}) => (error: unknown) => {
    logger.error(message, {
      module: 'AppSettings',
      action,
      ...extra,
      error: error instanceof Error ? error.message : String(error)
    });
  };

  const withLoadingGuard = async (
    key: LoadingKey,
    action: () => Promise<void>,
    onError: (error: unknown) => void,
  ) => {
    if (getState().loading[key]) return;
    setLoading(key, true);

    try {
      await action();
    } catch (error) {
      onError(error);
    } finally {
      setLoading(key, false);
    }
  };

  const loadAllSettings = async (): Promise<LoadedSettings> => {
    const settings = await SettingsCommands.getAll();

    return {
      systemTrayEnabled: typeof settings?.system_tray_enabled === 'boolean' ? settings.system_tray_enabled : false,
      silentStartEnabled: typeof settings?.silent_start_enabled === 'boolean' ? settings.silent_start_enabled : false,
      debugMode: typeof settings?.debugMode === 'boolean' ? settings.debugMode : false,
      privateMode: typeof settings?.privateMode === 'boolean' ? settings.privateMode : true,
      language: (settings?.language as SupportedLanguage) || 'en',
    };
  }

  return {
    hydrated: false,
    // 默认保持当前行为：用户卡片信息打码
    systemTrayEnabled: false,
    silentStartEnabled: false,
    debugMode: false,
    privateMode: true,
    language: 'en',
    loading: {
      hydrate: false,
      systemTray: false,
      silentStart: false,
      debugMode: false,
      privateMode: false,
      language: false,
    },
    hydrate: async () => {
      if (getState().hydrated) return;

      if (!hydrationPromise) {
        setLoading('hydrate', true);

        hydrationPromise = loadAllSettings()
          .then(async (next) => {
            if (next.language && next.language !== i18n.language) {
              await i18n.changeLanguage(next.language);
            }

            applyLoadedSettings(next);
          })
          .catch((error) => {
            logActionError('加载设置失败', 'hydrate_failed')(error);
            setState({ hydrated: true });
          })
          .finally(() => {
            setLoading('hydrate', false);
            hydrationPromise = null;
          });
      }

      return hydrationPromise;
    },
    refresh: async () => {
      try {
        applyLoadedSettings(await loadAllSettings());
      } catch (error) {
        logActionError('刷新设置失败', 'refresh_failed')(error);
      }
    },
    setSystemTrayEnabled: async (enabled: boolean) => {
      await withLoadingGuard(
        'systemTray',
        async () => {
          await SettingsCommands.saveSystemTrayState(enabled);
          applyLoadedSettings(await loadAllSettings());
        },
        logActionError('切换系统托盘失败', 'set_system_tray_enabled_failed', { enabled }),
      );
    },
    setSilentStartEnabled: async (enabled: boolean) => {
      await withLoadingGuard(
        'silentStart',
        async () => {
          if (enabled && !getState().systemTrayEnabled) {
            setLoading('systemTray', true);
            try {
              const trayEnabled = await SettingsCommands.saveSystemTrayState(true);
              setState({ systemTrayEnabled: trayEnabled });
            } finally {
              setLoading('systemTray', false);
            }
          }

          await SettingsCommands.saveSilentStartState(enabled);
          applyLoadedSettings(await loadAllSettings());
        },
        logActionError('切换静默启动失败', 'set_silent_start_enabled_failed', { enabled }),
      );
    },
    setDebugMode: async (enabled: boolean) => {
      await withLoadingGuard(
        'debugMode',
        async () => {
          const result = await SettingsCommands.saveDebugModeState(enabled);
          const nextEnabled = typeof result === 'boolean' ? result : enabled;
          setState({ debugMode: nextEnabled, hydrated: true });
          await relaunch();
        },
        logActionError('切换 Debug Mode 失败', 'set_debug_mode_failed', { enabled }),
      );
    },
    setPrivateMode: async (enabled: boolean) => {
      await withLoadingGuard(
        'privateMode',
        async () => {
          const result = await SettingsCommands.savePrivateModeState(enabled);
          const nextEnabled = typeof result === 'boolean' ? result : enabled;
          setState({ privateMode: nextEnabled, hydrated: true });
        },
        logActionError('切换隐私模式失败', 'set_private_mode_failed', { enabled }),
      );
    },
    setLanguage: async (language: SupportedLanguage) => {
      await withLoadingGuard(
        'language',
        async () => {
          await SettingsCommands.setLanguage(language);
          await i18n.changeLanguage(language);
          setState({ language, hydrated: true });
        },
        logActionError('切换语言失败', 'set_language_failed', { language }),
      );
    },
  }
})
