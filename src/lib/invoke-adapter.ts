

// 本地服务器地址 (与 main.rs 中配置的一致)
const SERVER_URL = 'http://127.0.0.1:56789/api';
const SESSION_HEADER = 'x-antigravity-session';
const SESSION_STORAGE_KEY = 'antigravity.session-token';
const TOKEN_COMMAND = 'get_server_session_token';

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

  if ('value' in record) {
    return record.value as T;
  }

  if ('result' in record) {
    return record.result as T;
  }

  if ('data' in record && Object.keys(record).length === 1) {
    return record.data as T;
  }

  if ('message' in record && Object.keys(record).length === 1) {
    return record.message as T;
  }

  if ('language' in record && Object.keys(record).length === 1) {
    return record.language as T;
  }

  if ('valid' in record && Object.keys(record).length === 1) {
    return record.valid as T;
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
}

/**
 * 通用命令调用适配器
 * 如果在 Tauri 环境中，使用 Tauri IPC
 * 如果在 VS Code 扩展环境中，使用 HTTP 请求
 */
export async function universalInvoke<T>(cmd: string, args?: Record<string, any>): Promise<T> {
  // 强制全部请求走 HTTP (v5 架构)
  return httpInvoke<T>(cmd, args);
}

// 需要 POST 方法的命令列表
const POST_COMMANDS = new Set([
  'switch_to_antigravity_account',
  'get_account_metrics',
  'write_frontend_log',
  'write_text_file',
  'open_log_directory',
  'launch_and_install_extension',
  'save_antigravity_current_account',
  'restore_antigravity_account',
  'clear_all_antigravity_data',
  'sign_in_new_antigravity_account',
  'trigger_quota_refresh',
  'restore_backup_files',
  'delete_backup',
  'clear_all_backups',
  'save_system_tray_state',
  'save_silent_start_state',
  'save_private_mode_state',
  'save_debug_mode_state',
  'set_language',
  'validate_antigravity_executable',
  'save_antigravity_executable',
  'encrypt_config_data',
  'decrypt_config_data',
  'update_tray_menu_command',
  'minimize_to_tray',
  'restore_from_tray',
  'start_database_monitoring',
  'stop_database_monitoring',
]);

// 在 HTTP 模式下忽略的命令（返回 undefined）
const IGNORED_COMMANDS = new Set<string>([
  // All commands are now supported via HTTP
]);

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
async function httpInvoke<T>(cmd: string, args?: any): Promise<T> {
  // 处理忽略的命令
  if (IGNORED_COMMANDS.has(cmd)) {
    if (cmd === 'write_frontend_log') {
      console.log('[FrontendLog]', args?.logEntry);
    } else {
      console.warn(`[InvokeAdapter] Command "${cmd}" ignored in HTTP mode.`);
    }
    return undefined as unknown as T;
  }

  // 直接使用命令名作为路由
  const url = `${SERVER_URL}/${cmd}`;
  const method = POST_COMMANDS.has(cmd) ? 'POST' : 'GET';

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

    // POST 请求透传参数
    if (method === 'POST' && args) {
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
