"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@heroui/react";
import { BookOpen, Inbox, LayoutDashboard, Megaphone, MessageCircle, RefreshCw, Ticket } from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { useInterval } from "@/hooks/useInterval";
import { api } from "@/lib/api";
import AppSelect from "@/components/ui/AppSelect";

const nav = [
  { href: "/dashboard", label: "Ringkasan", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/tickets", label: "Tiket", icon: Ticket },
  { href: "/campaigns", label: "Kampanye", icon: Megaphone },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 font-heading text-lg font-bold tracking-tight">
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-mint to-mint-strong text-sm font-black text-ink shadow-[0_6px_18px_-6px_rgba(143,228,204,0.8)]">
        S
        <span className="absolute -right-2 -top-2 size-5 rounded-full bg-white/40 blur-sm" />
      </span>
      {!compact && (
        <span>
          Seva<span className="text-mint-strong">AI</span>
        </span>
      )}
    </span>
  );
}

export default function AppHeader() {
  const { partners, partnerId, setPartnerId, loading, error, reload } = usePartner();
  const pathname = usePathname();
  const [needsHuman, setNeedsHuman] = useState(0);

  const loadQueue = useCallback(() => {
    if (!partnerId) return;
    api<unknown[]>(`/api/conversations?partnerId=${encodeURIComponent(partnerId)}&status=NEEDS_HUMAN`)
      .then((rows) => setNeedsHuman(rows.length))
      .catch(() => {});
  }, [partnerId]);

  useEffect(loadQueue, [loadQueue]);
  useInterval(loadQueue, 15000);

  const renderLinks = (mobile = false) =>
    nav.map((item) => {
      const active = pathname?.startsWith(item.href);
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={`relative flex shrink-0 items-center gap-2 rounded-xl font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-mint-strong ${
            mobile ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
          } ${active ? "text-white" : "text-white/60 hover:text-white"}`}
        >
          {active && (
            <motion.span
              layoutId={mobile ? "nav-pill-mobile" : "nav-pill"}
              className="absolute inset-0 rounded-xl bg-white/[0.11] ring-1 ring-inset ring-white/10"
              transition={{ type: "spring", stiffness: 420, damping: 36 }}
            />
          )}
          <Icon className="relative size-4" strokeWidth={2} />
          <span className="relative">{item.label}</span>
          {item.href === "/inbox" && needsHuman > 0 && (
            <span className="relative grid min-w-5 place-items-center rounded-full bg-[#ffb86b] px-1.5 text-[10px] font-bold leading-5 text-ink">
              {needsHuman}
            </span>
          )}
        </Link>
      );
    });

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-white shadow-[0_10px_40px_-12px_rgba(9,44,53,0.45)] backdrop-blur-xl supports-[backdrop-filter]:bg-ink/85">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex min-w-0 items-center gap-7">
          <Link href="/dashboard" aria-label="SevaAI beranda" className="shrink-0">
            <Logo />
          </Link>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-0.5 lg:flex">
            {renderLinks()}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold text-white/75 xl:inline-flex">
            <span className="size-1.5 rounded-full bg-mint-strong shadow-[0_0_10px_2px_rgba(143,228,204,0.6)]" />
            Data demo
          </span>
          {error ? (
            <Button size="sm" variant="ghost" onPress={reload} className="text-[#ffd5cf] hover:bg-white/10">
              <RefreshCw className="size-3.5" />
              Muat ulang mitra
            </Button>
          ) : (
            <AppSelect
              ariaLabel="Pilih mitra"
              items={partners.map((partner) => ({ id: partner.id, label: partner.name }))}
              value={partnerId}
              onChange={(id) => id && setPartnerId(id)}
              placeholder={loading ? "Memuat mitra…" : "Pilih mitra"}
              isDisabled={loading || partners.length === 0}
              className="w-[150px] sm:w-[210px]"
              triggerClassName="!border-white/15 !bg-white/10 !text-white !shadow-none hover:!bg-white/15 [&_*]:!text-white"
            />
          )}
          <Link
            href="/chat"
            className="hidden items-center gap-2 rounded-xl bg-mint px-3.5 py-2 text-sm font-semibold text-ink shadow-[0_8px_20px_-8px_rgba(143,228,204,0.9)] transition hover:-translate-y-px hover:bg-white sm:inline-flex"
          >
            <MessageCircle className="size-4" />
            Simulator
          </Link>
        </div>
      </div>
      <nav aria-label="Navigasi utama" className="no-scrollbar flex gap-1 overflow-x-auto border-t border-white/10 px-3 py-2 lg:hidden">
        {renderLinks(true)}
        <Link href="/chat" className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-mint sm:hidden">
          <MessageCircle className="size-4" />
          Simulator
        </Link>
      </nav>
    </header>
  );
}
