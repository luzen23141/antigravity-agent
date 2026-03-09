import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import { Tooltip } from 'antd';
import { cn } from "@/lib/utils.ts";
import { Avatar } from "@/components/ui/avatar.tsx";
import { ArrowLeftRight, Crown, Gem, Play, Trash2, TriangleAlert } from 'lucide-react';
import { useAntigravityIsRunning } from "@/hooks/use-antigravity-is-running.ts";
import { BaseButton } from "@/components/base-ui/BaseButton.tsx";
import { Variants } from "motion/react";
import { LiquidProgressBar } from "@/components/ui/liquid-progress-bar.tsx";
import { accountSessionMotion } from '@/components/business/account-session-motion.ts';
import type { AccountSessionCardViewModel } from '@/components/business/account-session-types.ts';

// ==========================================
// 类型定义
// ==========================================
type UserTier = 'free-tier' | 'g1-pro-tier' | 'g1-ultra-tier';

interface UserSessionCardProps {
  viewModel: AccountSessionCardViewModel;
  onSelect: () => void
  onSwitch: () => void
  onDelete: () => void
}

// ==========================================
// 视觉样式配置
// ==========================================

type TierVisualStyles = Pick<React.CSSProperties, 'background' | 'borderColor' | 'boxShadow' | 'backdropFilter' | 'WebkitBackdropFilter'> & {
  hoverBoxShadow?: string;
};

const tierVisualStyles: Record<UserTier, TierVisualStyles> = {
  "free-tier": {
    background: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
    borderColor: '#e2e8f0',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    hoverBoxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  "g1-pro-tier": {
    background: 'linear-gradient(to bottom, rgba(255, 251, 235, 0.95), rgba(255, 255, 255, 0.6))',
    borderColor: 'rgba(252, 211, 77, 0.7)',
    boxShadow: '0 20px 40px -10px rgba(251, 191, 36, 0.25), 0 10px 20px -5px rgba(251, 191, 36, 0.1), inset 0 0 20px -10px rgba(251, 191, 36, 0.1)',
    hoverBoxShadow: '0 25px 50px -12px rgba(251, 191, 36, 0.5), 0 15px 30px -5px rgba(251, 191, 36, 0.3), inset 0 0 30px -10px rgba(251, 191, 36, 0.2)',
  },
  "g1-ultra-tier": {
    background: 'radial-gradient(ellipse at top left, rgba(233, 213, 255, 0.75), rgba(245, 208, 254, 0.5), rgba(207, 250, 254, 0.3))',
    borderColor: 'rgba(167, 139, 250, 0.8)',
    boxShadow: '0 0 60px -15px rgba(139, 92, 246, 0.4), 0 20px 40px -10px rgba(139, 92, 246, 0.2), inset 0 0 30px -15px rgba(233, 213, 255, 0.5)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    hoverBoxShadow: '0 0 80px -10px rgba(139, 92, 246, 0.6), 0 30px 60px -10px rgba(139, 92, 246, 0.4), inset 0 0 50px -10px rgba(233, 213, 255, 0.8)',
  },
};

const unknownStyle: TierVisualStyles = {
  background: 'linear-gradient(to bottom, rgba(248, 250, 252, 0.94), rgba(255, 255, 255, 0.88))',
  borderColor: 'rgba(148, 163, 184, 0.45)',
  boxShadow: '0 12px 24px -18px rgba(15, 23, 42, 0.25)',
  hoverBoxShadow: '0 20px 40px -24px rgba(15, 23, 42, 0.32)',
};

const tierBadgeMap: Record<UserTier, React.ReactNode> = {
  "free-tier": <span className="rounded-md border border-border/70 bg-secondary px-1.5 py-0.5 text-[10px] font-bold leading-none text-muted-foreground shadow-sm">Free</span>,
  "g1-pro-tier": <span className="flex items-center gap-0.5 rounded-md border border-amber-300/60 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-700 shadow-sm dark:text-amber-300"><Crown size={10} className="fill-current" />Pro</span>,
  "g1-ultra-tier": <span className="flex items-center gap-0.5 rounded-md border border-violet-300/60 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-violet-700 shadow-sm dark:text-violet-300"><Gem size={10} className="fill-current" />Ultra</span>,
};

const tooltipInnerStyle: React.CSSProperties = {
  maxWidth: 520,
  wordBreak: 'break-all',
};


// 容器变体：控制整体入场 + 协调子元素入场
const containerVariants: Variants = {
  hidden: { opacity: 0, y: accountSessionMotion.card.containerEnterY },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: accountSessionMotion.card.containerDuration,
      ease: accountSessionMotion.card.containerEase,
      staggerChildren: accountSessionMotion.card.staggerChildren,
      delayChildren: accountSessionMotion.card.delayChildren,
    }
  }
};

// 子元素变体：统一的上浮淡入效果
const childVariants: Variants = {
  hidden: { opacity: 0, y: accountSessionMotion.card.childEnterY, filter: accountSessionMotion.card.childBlur },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: accountSessionMotion.card.containerDuration, ease: accountSessionMotion.card.childEase }
  }
};

export function AccountSessionListCard({ viewModel, onSelect, onSwitch, onDelete }: UserSessionCardProps) {
  const { t } = useTranslation(['account', 'common']);
  const isRunning = useAntigravityIsRunning(state => state.isRunning);
  const shouldReduceMotion = useReducedMotion();
  const {
    account: {
      tier,
      geminiProQuote,
      geminiProQuoteRestIn,
      geminiFlashQuote,
      geminiFlashQuoteRestIn,
      geminiImageQuote,
      geminiImageQuoteRestIn,
      claudeQuote,
      claudeQuoteRestIn,
      userAvatar,
      persisted,
    },
    displayEmail,
    displayName,
    isCurrentUser,
  } = viewModel;

  const quotaItems = [
    {
      type: 'gemini-pro' as const,
      percentage: geminiProQuote === -1 ? -1 : geminiProQuote,
      resetIn: geminiProQuoteRestIn,
    },
    {
      type: 'claude' as const,
      percentage: geminiProQuote === -1 ? -1 : claudeQuote,
      resetIn: claudeQuoteRestIn,
    },
    {
      type: 'gemini-flash' as const,
      percentage: geminiProQuote === -1 ? -1 : geminiFlashQuote,
      resetIn: geminiFlashQuoteRestIn,
    },
    {
      type: 'gemini-image' as const,
      percentage: geminiProQuote === -1 ? -1 : geminiImageQuote,
      resetIn: geminiImageQuoteRestIn,
    },
  ];

  // 如果是未知层级，使用专门定义的未知样式，否则使用对应层级的样式
  const currentStyles = tierVisualStyles[tier] || unknownStyle;

  const { boxShadow, hoverBoxShadow, ...otherStyles } = currentStyles;

  // --- 1. 聚光灯 (Spotlight) 逻辑 ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 使用 Spring 让光标跟随有轻微的物理延迟感，更高级
  const springX = useSpring(mouseX, accountSessionMotion.card.spring);
  const springY = useSpring(mouseY, accountSessionMotion.card.spring);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative w-[340px] overflow-hidden rounded-[28px] border px-6 py-5 cursor-pointer",
        "bg-card/92 text-card-foreground shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] backdrop-blur-xl",
        "transition-[border-color,background-color,box-shadow,transform] duration-200",
        isCurrentUser
          ? "border-primary/45 ring-1 ring-primary/25"
          : "border-border/80 hover:border-primary/20",
        !persisted && "ring-2 ring-destructive/70 ring-offset-2 ring-offset-background"
      )}
      style={otherStyles}

      // 应用动画
      variants={containerVariants}
      initial="hidden"
      animate="visible"

      // 交互状态
      whileHover={shouldReduceMotion ? undefined : {
        y: accountSessionMotion.card.hoverLiftY,
        boxShadow: hoverBoxShadow || boxShadow
      }}
      transition={{
        duration: accountSessionMotion.card.containerDuration,
        ease: accountSessionMotion.card.containerEase,
        boxShadow: { duration: accountSessionMotion.card.hoverShadowDuration, ease: "easeInOut" }
      }}
    >

      {isCurrentUser && <div title={t('account:tooltip.currentSession')} className="absolute right-2.5 top-2.5 flex h-2 items-center gap-1">
        <div className="h-2 w-1 rounded-full bg-primary animate-[bounce_1s_infinite]"></div>
        <div className="h-3 w-1 rounded-full bg-primary animate-[bounce_1s_infinite_100ms]"></div>
        <div className="h-1.5 w-1 rounded-full bg-primary animate-[bounce_1s_infinite_200ms]"></div>
      </div>}

      {/* --- 特效层 A: 聚光灯 (鼠标跟随) --- */}
      <motion.div
        className="pointer-events-none absolute -inset-px z-0 rounded-[28px] opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${springX}px ${springY}px,
              ${tier === 'g1-ultra-tier' ? 'rgba(167, 139, 250, 0.12)' : 'rgba(99,102,241,0.08)'},
              transparent 80%
            )
          `
        }}
      />

      {/* --- 特效层 B: Ultra 专属呼吸边框 --- */}
      {tier === 'g1-ultra-tier' && !shouldReduceMotion && (
        <motion.div
          className="absolute inset-0 z-0 rounded-[28px] border border-violet-400/30 pointer-events-none"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: accountSessionMotion.card.ultraPulseDuration, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* --- 内容层 (z-10 确保在特效之上) --- */}
      <div className="relative z-10">

        {/* 头部区域 */}
        <motion.header
          className="flex items-center gap-4 mb-2 relative"
          variants={childVariants}
        >
          <Avatar
            className={cn(
              "h-12 w-12 rounded-full object-cover border-2 transition-all duration-300 shrink-0 ring-2 ring-offset-2",
              tier === 'g1-ultra-tier'
                ? "border-white/60 ring-white/20"
                : isCurrentUser
                  ? "border-primary ring-primary/15"
                  : "border-border ring-background group-hover:border-primary/30 group-hover:ring-primary/10"
            )}
            src={userAvatar}
            alt={displayName}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 min-w-0">
              <Tooltip title={displayName} styles={{ container: tooltipInnerStyle }}>
                <h2 className="flex-1 min-w-0 text-lg font-bold leading-tight text-foreground line-clamp-2 break-words">
                  {displayName}
                </h2>
              </Tooltip>
              <div className="mt-0.5 shrink-0">
                {tierBadgeMap[tier] || <span className="rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-bold leading-none text-muted-foreground shadow-sm">{t('common:status.unknown')}</span>}
              </div>
            </div>
            <Tooltip title={displayEmail} styles={{ container: tooltipInnerStyle }}>
              {/* 高度用于统一一行和两行对其 */}
              <p className="h-[42px] break-all text-sm font-medium text-muted-foreground line-clamp-2">{displayEmail}</p>
            </Tooltip>
          </div>
        </motion.header>

        {/* 进度条区域 */}
        <motion.div className="space-y-2" variants={childVariants}>
          {quotaItems.map(item => (
            <LiquidProgressBar
              key={item.type}
              type={item.type}
              percentage={item.percentage}
              resetIn={item.resetIn}
            />
          ))}
        </motion.div>

        {/* 底部交互区域 */}
        <motion.div
          className="relative mt-6 flex items-center justify-center gap-2"
          variants={childVariants}
        >
          <BaseButton
            onClick={e => {
              e.stopPropagation();
              onSwitch()
            }}
            disabled={(isRunning === false) ? false : isCurrentUser}
            variant="outline"
            leftIcon={(isRunning === false) ? <Play className="w-3 h-3" /> : <ArrowLeftRight className={"w-3 h-3"} />}
          >
            {(isRunning === false) ? t('account:actions.start') : t('account:actions.use')}
          </BaseButton>
          <BaseButton
            onClick={e => {
              e.stopPropagation()
              onDelete()
            }}
            disabled={isCurrentUser}
            variant="ghost"
            rightIcon={<Trash2 className={"w-3 h-3"} />}
          >
            {t('account:actions.delete')}
          </BaseButton>
        </motion.div>
      </div>
      {!persisted && (
        <div className="absolute bottom-3 right-3 z-50">
          <Tooltip title={
            <div className="flex flex-col gap-0.5">
              <span>
                {t('account:warning.notPersisted.title')}
              </span>
              <span>
                {t('account:warning.notPersisted.description')}
              </span>
            </div>
          }>
            <TriangleAlert className="w-5 h-5 text-destructive transition-colors cursor-help hover:opacity-80" />
          </Tooltip>
        </div>
      )}
    </motion.div>
  );
}
