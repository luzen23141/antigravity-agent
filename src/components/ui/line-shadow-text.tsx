/**
 * https://magicui.design/docs/components/line-shadow-text
 */

import {motion, MotionProps} from "motion/react"

import {cn} from "@/lib/utils"
import React from "react";

interface LineShadowTextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps>,
    MotionProps {
  children?: React.ReactNode
  className?: string
  shadowColor?: string
  as?: React.ElementType
}

const colors = ["#60A5FA", "#A78BFA", "#F472B6"]
const speed = 1

const gradientStyle = {
  backgroundImage: `linear-gradient(135deg, ${colors.join(", ")}, ${
    colors[0]
  })`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  animationDuration: `${10 / speed}s`,
}

export function LineShadowText({
                                 children,
                                 shadowColor = "black",
                                 className,
                                 as: Component = "span",
                                 ...props
                               }: LineShadowTextProps) {
  const MotionComponent = motion.create(Component)
  const content = typeof children === "string" ? children : null

  if (!content) {
    throw new Error("LineShadowText only accepts string content")
  }

  return (
    <MotionComponent

      style={{"--shadow-color": shadowColor, ...gradientStyle}}
      className={cn(
        "relative z-0 inline-flex",
        "after:absolute after:top-[0.04em] after:left-[0.04em] after:content-[attr(data-text)]",
        "after:bg-[linear-gradient(45deg,transparent_45%,var(--shadow-color)_45%,var(--shadow-color)_55%,transparent_0)]",
        "after:-z-10 after:bg-[length:0.06em_0.06em] after:bg-clip-text after:text-transparent",
        "after:animate-line-shadow",
        className
      )}
      data-text={content}
      {...props}
    >
      {content}
    </MotionComponent>
  )
}
