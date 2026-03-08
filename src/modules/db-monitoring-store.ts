import {create} from 'zustand';
import {listen, UnlistenFn} from '@tauri-apps/api/event';
import {EventEmitter} from 'events';
import {logger} from '../lib/logger.ts';
import {DbMonitorCommands} from "@/commands/DbMonitorCommands.ts";

export interface DatabaseChangeEvent {
    timestamp: number;
    oldData?: any;
    newData?: any;
    diff?: any;
    originalEvent?: any;
}

export type { DatabaseEventMap, DatabaseEventListener };

const databaseEventEmitter = new EventEmitter();
let globalUnlistenFn: UnlistenFn | null = null;
let startPromise: Promise<void> | null = null;

export const DATABASE_EVENTS = {
  DATA_CHANGED: 'database:data-changed',
} as const;

type DatabaseEventMap = {
  [DATABASE_EVENTS.DATA_CHANGED]: DatabaseChangeEvent;
};

type DatabaseEventListener<T extends keyof DatabaseEventMap> = (data: DatabaseEventMap[T]) => void;

interface DbMonitoringActions {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  addListener: <T extends keyof DatabaseEventMap>(
    event: T,
    listener: DatabaseEventListener<T>
  ) => (() => void);
}

function normalizeDatabasePayload(payload: any) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      newData: payload,
      oldData: undefined,
      diff: undefined,
    };
  }

  return {
    newData: payload.newData ?? payload.new_data ?? payload,
    oldData: payload.oldData ?? payload.old_data,
    diff: payload.diff,
  };
}

export const useDbMonitoringStore = create<DbMonitoringActions>()(
  (_set) => ({
      start: async (): Promise<void> => {
        if (startPromise) {
          return startPromise;
        }

        startPromise = (async () => {
          logger.info('初始化数据库监控', { module: 'DbMonitoringStore' });

          try {
            if (!globalUnlistenFn) {
              const handleDatabaseChange = async (event: any) => {
                logger.info('接收到数据库变化事件', {
                  module: 'DbMonitoringStore',
                  eventId: event.id || 'unknown'
                });

                const { newData, oldData, diff } = normalizeDatabasePayload(event.payload);

                databaseEventEmitter.emit(DATABASE_EVENTS.DATA_CHANGED, {
                  timestamp: Date.now(),
                  newData,
                  oldData,
                  diff,
                  originalEvent: event
                });

                logger.info('数据库变化事件已发射', {
                  module: 'DbMonitoringStore'
                });
              };

              globalUnlistenFn = await listen('database-changed', handleDatabaseChange);
            }

            await DbMonitorCommands.start();

            logger.info('数据库监控已启动', {
              module: 'DbMonitoringStore'
            });
          } catch (error) {
            if (globalUnlistenFn) {
              try {
                globalUnlistenFn();
              } catch {
                // noop
              } finally {
                globalUnlistenFn = null;
              }
            }

            logger.error('启动数据库监控失败', {
              module: 'DbMonitoringStore',
              error: error instanceof Error ? error.message : String(error)
            });
            throw error;
          }
        })();

        try {
          await startPromise;
        } finally {
          startPromise = null;
        }
      },

      stop: async (): Promise<void> => {
        try {
          await DbMonitorCommands.stop();
        } catch (error) {
          logger.warn('停止后端数据库监控失败', {
            module: 'DbMonitoringStore',
            error: error instanceof Error ? error.message : String(error)
          });
        }

        if (globalUnlistenFn) {
          try {
            globalUnlistenFn();
            logger.info('数据库监听器已清理', {
              module: 'DbMonitoringStore'
            });
          } catch (error) {
            logger.warn('清理数据库监听器失败', {
              module: 'DbMonitoringStore',
              error: error instanceof Error ? error.message : String(error)
            });
          } finally {
            globalUnlistenFn = null;
          }
        }
      },

      addListener: <T extends keyof DatabaseEventMap>(
        event: T,
        listener: DatabaseEventListener<T>
      ): (() => void) => {
        databaseEventEmitter.on(event, listener);

        return () => {
          databaseEventEmitter.off(event, listener);
        };
      },
    }),
);
