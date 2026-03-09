import { invokeCommand } from '@/lib/invoke-adapter';

/**
 * 进程管理命令
 */
export class ProcessCommands {
  /**
   * 检查 Antigravity 进程是否正在运行
   * @returns 是否正在运行
   */
  static async isRunning(): Promise<boolean> {
    return invokeCommand('is_antigravity_running');
  }
}
