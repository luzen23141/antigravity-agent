export const accountSessionMotion = {
  list: {
    staggerChildren: 0.08,
    delayChildren: 0.1,
    itemEnterY: 20,
    itemEnterScale: 0.95,
    itemSpring: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
    itemExit: {
      scale: 0.9,
      duration: 0.2,
    },
    emptyStateDuration: 0.3,
  },
  card: {
    containerEnterY: 20,
    containerDuration: 0.4,
    containerEase: 'easeOut' as const,
    staggerChildren: 0.1,
    delayChildren: 0.05,
    childEnterY: 12,
    childBlur: 'blur(4px)',
    childEase: 'backOut' as const,
    hoverLiftY: -4,
    hoverShadowDuration: 0.5,
    ultraPulseDuration: 3,
    spring: {
      stiffness: 500,
      damping: 30,
    },
  },
};
