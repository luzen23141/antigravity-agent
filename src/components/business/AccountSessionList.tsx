import { AccountSessionListCard } from './AccountSessionListCard';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern.tsx";
import { maskEmail, maskName } from "@/lib/string-masking.ts";
import { useAppSettings } from "@/modules/use-app-settings.ts";
import { useTranslation } from 'react-i18next';
import { accountSessionMotion } from '@/components/business/account-session-motion.ts';
import type { AccountSessionCardViewModel, AccountSessionListItem } from '@/components/business/account-session-types.ts';

export interface AccountSessionListProps {
  accounts: AccountSessionListItem[];
  currentUserEmail?: string;
  onSelect: (user: AccountSessionListItem) => void;
  onSwitch: (email: string) => void;
  onDelete: (email: string) => void;
}

// 1. 父容器动画：控制子元素像多米诺骨牌一样依次出现
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: accountSessionMotion.list.staggerChildren,
      delayChildren: accountSessionMotion.list.delayChildren,
    }
  }
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: accountSessionMotion.list.itemEnterY,
    scale: accountSessionMotion.list.itemEnterScale,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: accountSessionMotion.list.itemSpring,
  },
  exit: {
    opacity: 0,
    scale: accountSessionMotion.list.itemExit.scale,
    transition: { duration: accountSessionMotion.list.itemExit.duration }
  }
};

export function AccountSessionList({
  accounts,
  currentUserEmail,
  onSelect,
  onSwitch,
  onDelete,
}: AccountSessionListProps) {
  const { t } = useTranslation('dashboard');
  const privateMode = useAppSettings(state => state.privateMode);

  return (
    <motion.div
      className="relative grid min-h-[420px] flex-1 auto-rows-max grid-cols-[repeat(auto-fill,minmax(300px,1fr))] content-start gap-3 overflow-auto p-3 md:p-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* 背景组件通常设为 absolute，不参与流式布局动画 */}
      <AnimatedGridPattern />

      {/* AnimatePresence 用于处理元素被删除时的离场动画 */}
      <AnimatePresence mode="popLayout">
        {accounts.map((account) => {
          const viewModel = {
            account,
            isCurrentUser: currentUserEmail === account.email,
            displayEmail: privateMode ? maskEmail(account.email) : account.email,
            displayName: privateMode ? maskName(account.nickName) : account.nickName,
          } satisfies AccountSessionCardViewModel;

          return (
            <motion.div
              key={account.email}
              layout // 关键：当有元素被删除时，其他元素会自动平滑移动填补空缺
              variants={itemVariants} // 继承父级的 hidden/show 状态
              className="z-10" // 确保在背景之上
            >
              <AccountSessionListCard
                viewModel={viewModel}
                onSelect={() => onSelect(account)}
                onSwitch={() => onSwitch(account.email)}
                onDelete={() => onDelete(account.email)}
              />
            </motion.div>
          );
        })}

      </AnimatePresence>

      {/* 空状态动画 */}
      {accounts.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center py-12 px-6 text-center flex-1 z-10 w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: accountSessionMotion.list.emptyStateDuration }}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border/70 bg-muted/40 shadow-sm">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-foreground">
            {t('emptyState.title')}
          </h3>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {t('emptyState.description')}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
