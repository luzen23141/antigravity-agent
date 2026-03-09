import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Clock, HelpCircle } from 'lucide-react';
import ClaudeIcon from '@/assets/icons/claude.png';
import GeminiImageIcon from '@/assets/icons/nano_banana.png';
import GeminiProIcon from '@/assets/icons/gemini_pro.png';
import GeminiFlashIcon from '@/assets/icons/gemini_flash.png';
import dayjs from "dayjs";
import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";

type LiquidProgressBarType = 'gemini-pro' | 'gemini-flash' | 'claude' | 'gemini-image';

interface LiquidProgressBarProps {
  type: LiquidProgressBarType;
  /**
   * 0-1. If 1, timer is hidden. -1 for unknown.
   */
  percentage: number;
  /**
   * ISO Date string (e.g. "2025-12-18T20:19:38Z")
   */
  resetIn?: string;
  className?: string;
}

const typeConfig: Record<LiquidProgressBarType, {
  label: string;
  iconSrc: string;
  colorFrom: string;
  colorTo: string;
}> = {
  'gemini-pro': {
    label: 'Gemini Pro',
    iconSrc: GeminiProIcon,
    colorFrom: '#3b82f6',
    colorTo: '#2563eb'
  },
  'gemini-flash': {
    label: 'Gemini Flash',
    iconSrc: GeminiFlashIcon,
    colorFrom: '#0ea5e9',
    colorTo: '#0284c7'
  },
  'claude': {
    label: 'Claude',
    iconSrc: ClaudeIcon,
    colorFrom: '#8b5cf6',
    colorTo: '#d946ef'
  },
  'gemini-image': {
    label: 'Gemini Image',
    iconSrc: GeminiImageIcon,
    colorFrom: '#10b981',
    colorTo: '#059669'
  }
};

const getProgressColor = (type: LiquidProgressBarType, percentage: number, config: typeof typeConfig) => {
  const isUnknown = percentage === -1;
  if (isUnknown) return { from: config[type].colorFrom, to: config[type].colorTo };

  if (percentage <= 0.2) {
    return { from: '#f43f5e', to: '#e11d48' };
  }

  if (percentage <= 0.45) {
    return { from: '#fbbf24', to: '#d97706' };
  }

  return { from: config[type].colorFrom, to: config[type].colorTo };
};

export function LiquidProgressBar({
  type,
  percentage,
  resetIn,
  className
}: LiquidProgressBarProps) {
  const { t } = useTranslation('common');
  const { label, iconSrc } = typeConfig[type];

  const isUnknown = percentage === -1;
  const safePercentage = isUnknown ? 0 : Math.min(100, Math.max(0, Math.round(percentage * 100)));
  const showTimer = resetIn && !isUnknown;
  const relativeTime = useMemo(() => dayjs().to(dayjs(resetIn), true), [resetIn]);
  const currentColors = getProgressColor(type, percentage, typeConfig);
  const finalShowTimer = showTimer && relativeTime;

  return (
    <div
      className={cn(
        'flex h-[36px] w-full select-none items-stretch overflow-hidden rounded-full border border-border/70 bg-card/88 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] backdrop-blur-md',
        className
      )}
    >
      <div className="flex w-[136px] shrink-0 items-center gap-2 border-r border-border/60 bg-background/72 pl-2.5 pr-3">
        <img src={iconSrc} alt={label} className="h-4 w-4 shrink-0 object-contain" />
        <span className="truncate text-xs font-semibold text-foreground">{label}</span>
      </div>

      <div className="relative flex flex-1 items-center overflow-hidden bg-muted/35 p-1">
        {isUnknown && <div className="absolute inset-0 bg-muted/25" />}

        {!isUnknown && (
          <motion.div
            className="relative h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${currentColors.from}, ${currentColors.to})`
            }}
            initial={{ width: 0 }}
            animate={{ width: `${safePercentage}%` }}
            transition={{ type: 'spring', stiffness: 45, damping: 15 }}
          >
            {percentage <= 0.2 && (
              <div className="absolute inset-0 animate-pulse rounded-full bg-white/20" />
            )}
          </motion.div>
        )}

        <div className="absolute inset-y-0 right-2 z-10 flex items-center">
          {isUnknown && (
            <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/85 px-2 py-0.5 text-muted-foreground shadow-sm backdrop-blur-sm">
              <HelpCircle size={10} />
              <span className="text-[10px] font-medium">{t('status.unknown')}</span>
            </div>
          )}

          {!isUnknown && finalShowTimer && (
            <Tooltip title={`${t('status.resetTime')}: ${dayjs.utc(resetIn).toDate().toLocaleString()}`} placement="top">
              <div
                className={cn(
                  'flex cursor-help items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none transition-colors',
                  safePercentage > 90
                    ? 'bg-background/15 text-white shadow-sm backdrop-blur-sm'
                    : 'border border-border/60 bg-background/88 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-background'
                )}
              >
                <Clock size={9} className="stroke-[2.5]" />
                <span>{relativeTime}</span>
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
