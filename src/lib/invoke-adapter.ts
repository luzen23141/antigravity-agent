

// 本地服务器地址 (与 main.rs 中配置的一致)
const SERVER_URL = 'http://127.0.0.1:56789/api';
const SESSION_HEADER = 'x-antigravity-session';
const SESSION_STORAGE_KEY = 'antigravity.session-token';
const TOKEN_COMMAND = 'get_server_session_token';

type CommandSpec = {
  method: 'GET' | 'POST';
};

const COMMAND_REGISTRY = {
  [TOKEN_COMMAND]: { method: 'GET' },
  get_current_antigravity_account_info: { method: 'GET' },
  get_antigravity_accounts: { method: 'GET' },
  get_all_settings: { method: 'GET' },
  get_language: { method: 'GET' },
  get_platform_info: { method: 'GET' },
  find_antigravity_installations: { method: 'GET' },
  detect_antigravity_installation: { method: 'GET' },
  detect_antigravity_executable: { method: 'GET' },
  get_current_paths: { method: 'GET' },
  get_account_metrics: { method: 'POST' },
  trigger_quota_refresh: { method: 'POST' },
  write_frontend_log: { method: 'POST' },
  open_log_directory: { method: 'POST' },
  get_log_directory_path: { method: 'GET' },
  write_text_file: { method: 'POST' },
  save_system_tray_state: { method: 'POST' },
  save_silent_start_state: { method: 'POST' },
  save_private_mode_state: { method: 'POST' },
  save_debug_mode_state: { method: 'POST' },
  set_language: { method: 'POST' },
  minimize_to_tray: { method: 'POST' },
  restore_from_tray: { method: 'POST' },
  update_tray_menu_command: { method: 'POST' },
  is_antigravity_running: { method: 'GET' },
  is_database_monitoring_running: { method: 'GET' },
  start_database_monitoring: { method: 'POST' },
  stop_database_monitoring: { method: 'POST' },
  collect_account_contents: { method: 'GET' },
  restore_backup_files: { method: 'POST' },
  delete_backup: { method: 'POST' },
  clear_all_backups: { method: 'POST' },
  encrypt_config_data: { method: 'POST' },
  decrypt_config_data: { method: 'POST' },
  sign_in_new_antigravity_account: { method: 'POST' },
  save_antigravity_current_account: { method: 'POST' },
  switch_to_antigravity_account: { method: 'POST' },
  clear_all_antigravity_data: { method: 'POST' },
  validate_antigravity_executable: { method: 'POST' },
  save_antigravity_executable: { method: 'POST' },
  launch_and_install_extension: { method: 'POST' },
} satisfies Record<string, CommandSpec>;

// 预留给未来「HTTP 模式下显式跳过」的命令；目前为空，代表 registry 内命令都应实际发请求。
const IGNORED_COMMANDS = new Set<string>();

let sessionTokenPromise: Promise<string> | null = null;

function unwrapResponse<T>(payload: unknown): T {
  if (payload === null || payload === undefined) {
    return payload as T;
  }

  if (Array.isArray(payload)) {
    return payload as T;
  }

  if (typeof payload !== 'object') {
    return payload as T;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.error === 'string') {
    throw new Error(record.error);
  }

  if (record.success === false) {
    throw new Error(typeof record.message === 'string' ? record.message : 'Request failed');
  }

  if ('value' in record) {
    return record.value as T;
  }

  if ('result' in record) {
    return record.result as T;
  }

  if ('data' in record && Object.keys(record).length === 1) {
    return record.data as T;
  }

  if ('language' in record && Object.keys(record).length === 1) {
    return record.language as T;
  }

  if ('valid' in record && Object.keys(record).length === 1) {
    return record.valid as T;
  }

  if (record.success === true) {
    if ('message' in record) {
      return record.message as T;
    }

    if (Object.keys(record).every((key) => key === 'success')) {
      return undefined as T;
    }
  }

  if ('message' in record && Object.keys(record).length === 1) {
    return record.message as T;
  }

  if ('success' in record && Object.keys(record).length === 1) {
    return record.success as T;
  }

  return payload as T;
}

async function getSessionToken(forceRefresh: boolean = false): Promise<string> {
  const cached = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (cached && !forceRefresh) {
    return cached;
  }

  if (sessionTokenPromise && !forceRefresh) {
    return sessionTokenPromise;
  }

  const requestPromise = (async () => {
    const response = await fetch(`${SERVER_URL}/${TOKEN_COMMAND}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }

    const token = unwrapResponse<string>(await response.json());
    if (!token) {
      throw new Error('Missing server session token');
    }

    window.sessionStorage.setItem(SESSION_STORAGE_KEY, token);
    return token;
  })();

  if (!forceRefresh) {
    sessionTokenPromise = requestPromise;
  }

  try {
    return await requestPromise;
  } finally {
    if (!forceRefresh && sessionTokenPromise === requestPromise) {
      sessionTokenPromise = null;
    }
  }
}

function getCommandSpec(cmd: string): CommandSpec {
  const spec = COMMAND_REGISTRY[cmd];
  if (!spec) {
    throw new Error(`Unknown command: ${cmd}`);
  }
  return spec;
}

/**
 * 通用命令调用适配器
 * 如果在 Tauri 环境中，使用 Tauri IPC
 * 如果在 VS Code 扩展环境中，使用 HTTP 请求
 */
export function invokeCommand<T>(cmd: string, args?: unknown): Promise<T> {
  return httpInvoke<T>(cmd, args);
}

/**
 * 兼容旧调用点；新代码统一使用 invokeCommand。
 */
export function universalInvoke<T>(cmd: string, args?: unknown): Promise<T> {
  return invokeCommand<T>(cmd, args);
}

function shouldRefreshSessionToken(response: Response): boolean {
  if (response.status === 401 || response.status === 403) {
    return true;
  }

  const sessionStatus = response.headers.get('x-antigravity-session-status');
  if (sessionStatus && sessionStatus.toLowerCase() === 'expired') {
    return true;
  }

  return false;
}

/**
 * HTTP 调用实现
 * 直接使用命令名作为路由路径，参数透传
 */
async function httpInvoke<T>(cmd: string, args?: unknown): Promise<T> {
  if (IGNORED_COMMANDS.has(cmd)) {
    if (cmd === 'write_frontend_log') {
      console.log('[FrontendLog]', (args as { logEntry?: unknown } | undefined)?.logEntry);
    } else {
      console.warn(`[InvokeAdapter] Command "${cmd}" ignored in HTTP mode.`);
    }
    return undefined as T;
  }

  const { method } = getCommandSpec(cmd);
  const url = `${SERVER_URL}/${cmd}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let response: Response;
  const executeRequest = async (forceRefreshSession: boolean): Promise<Response> => {
    const requestHeaders: Record<string, string> = {
      ...headers,
    };

    if (cmd !== TOKEN_COMMAND) {
      requestHeaders[SESSION_HEADER] = await getSessionToken(forceRefreshSession);
    }

    const options: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (method === 'POST' && args !== undefined) {
      options.body = JSON.stringify(args);
    }

    return fetch(url, options);
  };

  try {
    response = await executeRequest(false);

    if (cmd !== TOKEN_COMMAND && shouldRefreshSessionToken(response)) {
      response = await executeRequest(true);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${errorText}`);
    }

    return unwrapResponse<T>(await response.json());
  } catch (error) {
    console.error(`HTTP Invoke failed for ${cmd}:`, error);
    throw error;
  }
}
