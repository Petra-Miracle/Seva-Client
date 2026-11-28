"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import { Card } from "@heroui/react";
import { numberFormat } from "@/lib/format";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fade + rise on mount. */
export function FadeIn({
  delay = 0,
  y = 12,
  className,
  children,
  ...rest
}: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease } },
};

/** Parent that reveals its <StaggerItem> children one after another. */
export function Stagger({ className, children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className={className} {...rest}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ className, children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={staggerChild} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

/** Counts up smoothly whenever `value` changes. */
export function AnimatedNumber({
  value,
  suffix = "",
  format = (n: number) => numberFormat.format(Math.round(n)),
  className,
}: {
  value: number | null | undefined;
  suffix?: string;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (n) => `${format(n)}${suffix}`);

  useEffect(() => {
    if (value == null) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.9, ease });
    return () => controls.stop();
  }, [value, mv, reduce]);

  if (value == null) return <span className={className}>—</span>;
  return <motion.span className={`tabular-nums ${className ?? ""}`}>{text}</motion.span>;
}

/** HeroUI Card with a soft radial highlight that follows the cursor. */
export function SpotlightCard({
  className = "",
  children,
  color = "rgba(20,125,112,0.10)",
}: {
  className?: string;
  children: React.ReactNode;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Card
      ref={ref}
      onMouseMove={(event: React.MouseEvent<HTMLDivElement>) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        ref.current!.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
        ref.current!.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
      }}
      style={{ "--spot-color": color } as React.CSSProperties}
      className={`group/spot relative overflow-hidden border border-border/80 shadow-soft transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-lift ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at var(--spot-x, 50%) var(--spot-y, 0%), var(--spot-color), transparent 65%)",
        }}
      />
      <div className="relative">{children}</div>
    </Card>
  );
}

export type SegmentOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
};

/** Pill tabs with a sliding indicator (shared layoutId). Scrolls horizontally when narrow. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  id,
  size = "md",
  className = "",
  ariaLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  id: string;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`no-scrollbar relative flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-border bg-surface-secondary/80 p-1 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`relative flex shrink-0 items-center gap-1.5 rounded-xl font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 ${
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
            } ${active ? "text-white" : "text-text-secondary hover:text-text-primary"}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-xl bg-ink shadow-[0_6px_16px_-6px_rgba(9,44,53,0.55)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {option.icon}
              {option.label}
              {option.count != null && (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-bold tabular-nums ${
                    active ? "bg-white/15 text-white" : "bg-border/70 text-text-secondary"
                  }`}
                >
                  {option.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
