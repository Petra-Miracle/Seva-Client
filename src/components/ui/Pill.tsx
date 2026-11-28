import type { Tone } from "@/lib/format";

const toneClass: Record<Tone, string> = {
  accent: "bg-stage-acquire-bg text-stage-acquire-fg ring-stage-acquire-fg/15",
  serve: "bg-stage-serve-bg text-stage-serve-fg ring-stage-serve-fg/15",
  retain: "bg-stage-retain-bg text-stage-retain-fg ring-stage-retain-fg/15",
  success: "bg-success-bg text-success-fg ring-success-fg/15",
  warning: "bg-warning-bg text-warning-fg ring-warning-fg/15",
  danger: "bg-danger-bg text-danger-fg ring-danger-fg/15",
  info: "bg-stage-serve-bg text-stage-serve-fg ring-stage-serve-fg/15",
  neutral: "bg-sender-bot-bg text-sender-bot-fg ring-sender-bot-fg/10",
};

const dotClass: Record<Tone, string> = {
  accent: "bg-stage-acquire-fg",
  serve: "bg-stage-serve-fg",
  retain: "bg-stage-retain-fg",
  success: "bg-success-fg",
  warning: "bg-warning-fg",
  danger: "bg-danger-fg",
  info: "bg-stage-serve-fg",
  neutral: "bg-sender-bot-fg",
};

export default function Pill({
  tone = "neutral",
  dot = false,
  pulse = false,
  size = "sm",
  className = "",
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
  size?: "xs" | "sm";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"
      } ${toneClass[tone]} ${className}`}
    >
      {dot && (
        <span className={`relative size-1.5 rounded-full ${dotClass[tone]}`}>
          {pulse && <span className={`absolute inset-0 animate-ping rounded-full opacity-60 ${dotClass[tone]}`} />}
        </span>
      )}
      {children}
    </span>
  );
}
