import {cn} from "@/lib/utils.ts";

export function AnimatedGridPattern() {
  return (
    <div className="absolute inset-0 -z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-[inherit] bg-transparent">
      <div
        className={cn(
          "absolute inset-0 opacity-60",
          "[background-size:22px_22px]",
          "[background-image:radial-gradient(color-mix(in_srgb,var(--color-foreground)_10%,transparent)_1px,transparent_1px)]",
          "dark:[background-image:radial-gradient(color-mix(in_srgb,var(--color-foreground)_18%,transparent)_1px,transparent_1px)]",
        )}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-primary)_8%,transparent),transparent_42%)] [mask-image:radial-gradient(ellipse_at_center,transparent_26%,black)] dark:bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--color-primary)_14%,transparent),transparent_48%)]" />
    </div>
  );
}
