"use client";
import { useState } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";

interface AnimatedTooltipProps {
  children: React.ReactNode;
  text: string; // 简化为只传一个文本
  className?: string; // 允许外部微调 Trigger 的样式
}

export const AnimatedTooltip = ({
                                  children,
                                  text,
                                  className,
                                }: AnimatedTooltipProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // ==============================
  // 核心动效配置 (全部默认封装)
  // ==============================
  const springConfig = { stiffness: 100, damping: 5 };
  const x = useMotionValue(0);

  // 旋转：鼠标偏左向左歪，偏右向右歪
  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig
  );

  // 位移：跟随鼠标有轻微的视差移动
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const halfWidth = event.currentTarget.offsetWidth / 2;
    // 计算鼠标相对于元素中心的偏移量
    x.set(event.nativeEvent.offsetX - halfWidth);
  };

  return (
    <div
      className={`relative inline-block group ${className}`} // inline-block 保证包裹大小由 children 决定
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence mode="popLayout">
        {isHovered && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.6 }}
            animate={shouldReduceMotion ? {
              opacity: 1,
              transition: { duration: 0.16 }
            } : {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 10,
              },
            }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.6 }}
            style={shouldReduceMotion ? {
              whiteSpace: "nowrap",
            } : {
              translateX: translateX,
              rotate: rotate,
              whiteSpace: "nowrap",
            }}
            className="absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-xl border border-border/70 bg-card/95 px-4 py-2 text-xs shadow-[0_18px_45px_-24px_rgba(15,23,42,0.4)] backdrop-blur-xl"
          >
            <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
            <div className="absolute left-10 -bottom-px z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />

            <div className="relative z-30 text-sm font-semibold text-foreground">
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 触发体 */}
      {children}
    </div>
  );
};
