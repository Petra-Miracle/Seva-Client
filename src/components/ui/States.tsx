"use client";

import { Button, Skeleton } from "@heroui/react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { FadeIn } from "./motion";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <FadeIn className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      <div className="relative mb-4">
        <div className="absolute inset-0 -m-3 rounded-full bg-accent/10 blur-xl" />
        <div className="relative grid size-14 place-items-center rounded-2xl border border-accent/15 bg-gradient-to-b from-white to-accent-soft text-accent shadow-soft">
          {icon}
        </div>
      </div>
      <p className="font-heading text-base font-semibold text-text-primary">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-6 text-text-secondary">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </FadeIn>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <FadeIn
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-danger-fg/15 bg-danger-bg/70 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-danger-fg shadow-soft">
          <AlertTriangle className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-danger-fg">Data belum bisa dimuat</p>
          <p className="mt-0.5 text-sm leading-5 text-text-secondary">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button size="sm" variant="secondary" onPress={onRetry} className="shrink-0">
          <RefreshCw className="size-3.5" />
          Coba lagi
        </Button>
      )}
    </FadeIn>
  );
}

export function SkeletonRows({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5 rounded-full" />
            <Skeleton className="h-3 w-4/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
