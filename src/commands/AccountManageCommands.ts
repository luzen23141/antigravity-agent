import { invokeCommand } from '@/lib/invoke-adapter';
import type { BackupData, RestoreResult } from './types/account-manage.types.ts';
import type { CommandResult } from './types/account.types.ts';

/**
 * 账户与备份综合命令
 */
export class AccountManageCommands {
  static collectAccountContents(): Promise<BackupData[]> {
    return invokeCommand('collect_account_contents');
  }

  static restoreBackupFiles(backups: BackupData[]): Promise<RestoreResult> {
    return invokeCommand('restore_backup_files', backups);
  }

  static deleteBackup(name: string): Promise<string> {
    return invokeCommand('delete_backup', { name });
  }

  static clearAllBackups(): Promise<string> {
    return invokeCommand('clear_all_backups');
  }

  // ==== 配置加解密 ====
  static encryptConfig(jsonData: string, password: string): Promise<string> {
    return invokeCommand('encrypt_config_data', { jsonData: jsonData, password });
  }

  static decryptConfig(encryptedData: string, password: string): Promise<string> {
    return invokeCommand('decrypt_config_data', { encryptedData: encryptedData, password });
  }

  static signInNewAntigravityAccount(): Promise<CommandResult> {
    return invokeCommand('sign_in_new_antigravity_account');
  }
}
