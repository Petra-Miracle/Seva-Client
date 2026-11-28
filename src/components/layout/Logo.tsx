export function Logo({ compact = false, tone = "light" }: { compact?: boolean; tone?: "light" | "dark" }) {
  return (
    <span className="flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight">
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-mint to-mint-strong text-sm font-black text-ink shadow-[0_6px_18px_-6px_rgba(143,228,204,0.8)]">
        S
        <span className="absolute -right-2 -top-2 size-5 rounded-full bg-white/40 blur-sm" />
      </span>
      {!compact && (
        <span className={tone === "dark" ? "text-white" : "text-text-primary"}>
          Seva<span className="text-mint-strong">AI</span>
        </span>
      )}
    </span>
  );
}

export default Logo;
