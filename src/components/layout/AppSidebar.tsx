"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  Headset,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Menu,
  MessageCircle,
  RefreshCw,
  Ticket,
  X,
} from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { useInterval } from "@/hooks/useInterval";
import { api } from "@/lib/api";
import AppSelect from "@/components/ui/AppSelect";
import { Logo } from "@/components/layout/Logo";

const nav = [
  { href: "/dashboard", label: "Ringkasan", hint: "Metrik & tren", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", hint: "Percakapan masuk", icon: Inbox },
  { href: "/tickets", label: "Tiket", hint: "Keluhan pelanggan", icon: Ticket },
  { href: "/campaigns", label: "Kampanye", hint: "Segmen & penawaran", icon: Megaphone },
  { href: "/knowledge", label: "Knowledge", hint: "FAQ & paket", icon: BookOpen },
];

function isActive(pathname: string | null, href: string) {
  return Boolean(pathname?.startsWith(href));
}

function NavList({
  pathname,
  needsHuman,
  layoutId,
  onNavigate,
}: {
  pathname: string | null;
  needsHuman: number;
  layoutId: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Navigasi utama" className="space-y-1">
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-mint-strong ${
              active ? "text-white" : "text-white/55 hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-white/[0.09] ring-1 ring-inset ring-white/10"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            <span
              className={`relative grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${
                active
                  ? "bg-mint/15 text-mint-strong"
                  : "text-white/45 group-hover:bg-white/[0.06] group-hover:text-white/80"
              }`}
            >
              <Icon className="size-[17px]" strokeWidth={2} />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="block truncate">{item.label}</span>
              <span className={`block truncate text-[11px] font-normal ${active ? "text-white/55" : "text-white/35"}`}>
                {item.hint}
              </span>
            </span>
            {item.href === "/inbox" && needsHuman > 0 && (
              <span className="relative grid min-w-5 place-items-center rounded-full bg-[#ffb86b] px-1.5 text-[10px] font-bold leading-5 text-ink">
                {needsHuman > 9 ? "9+" : needsHuman}
              </span>
            )}
            <ChevronRight
              className={`relative size-3.5 shrink-0 transition-all ${
                active ? "opacity-45" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-40"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}

function PartnerCard() {
  const { partners, partnerId, setPartnerId, loading, error, reload } = usePartner();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Mitra aktif</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-semibold text-mint-strong">
          <span className="size-1.5 rounded-full bg-mint-strong" />
          Data demo
        </span>
      </div>
      {error ? (
        <button
          onClick={reload}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-[#ffd5cf] transition hover:bg-white/10"
        >
          <RefreshCw className="size-3.5" />
          Muat ulang mitra
        </button>
      ) : (
        <AppSelect
          ariaLabel="Pilih mitra"
          items={partners.map((partner) => ({ id: partner.id, label: partner.name }))}
          value={partnerId}
          onChange={(id) => id && setPartnerId(id)}
          placeholder={loading ? "Memuat mitra…" : "Pilih mitra"}
          isDisabled={loading || partners.length === 0}
          className="w-full"
          triggerClassName="!h-9 !w-full !border-white/10 !bg-white/[0.06] !text-xs !text-white !shadow-none hover:!bg-white/[0.1] [&_*]:!text-white"
        />
      )}
    </div>
  );
}

function SimulatorCard({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/chat"
      onClick={onNavigate}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-br from-mint to-mint-strong p-3.5 text-ink shadow-[0_14px_30px_-14px_rgba(143,228,204,0.9)] transition hover:-translate-y-px hover:shadow-[0_18px_34px_-14px_rgba(143,228,204,1)]"
    >
      <span className="absolute -right-6 -top-6 size-16 rounded-full bg-white/30 blur-xl" />
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-ink/10">
        <MessageCircle className="size-[18px]" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-sm font-bold leading-tight">Simulator pelanggan</span>
        <span className="block text-[11px] font-medium text-ink/65">Coba alur chat AI</span>
      </span>
      <ChevronRight className="relative size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export default function AppSidebar() {
  const { partnerId } = usePartner();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [needsHuman, setNeedsHuman] = useState(0);

  const loadQueue = useCallback(() => {
    if (!partnerId) return;
    api<unknown[]>(`/api/conversations?partnerId=${encodeURIComponent(partnerId)}&status=NEEDS_HUMAN`)
      .then((rows) => setNeedsHuman(rows.length))
      .catch(() => {});
  }, [partnerId]);

  useEffect(loadQueue, [loadQueue]);
  useInterval(loadQueue, 15000);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-ink/95 px-4 text-white shadow-[0_10px_40px_-12px_rgba(9,44,53,0.45)] backdrop-blur-xl lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={() => setOpen(true)}
            aria-label="Buka menu navigasi"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <Menu className="size-[18px]" />
          </button>
          <Link href="/dashboard" aria-label="SevaAI beranda" className="shrink-0">
            <Logo tone="dark" />
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/chat"
            aria-label="Buka simulator pelanggan"
            className="grid size-9 place-items-center rounded-xl bg-mint text-ink shadow-[0_8px_20px_-8px_rgba(143,228,204,0.9)]"
          >
            <MessageCircle className="size-4" />
          </Link>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col overflow-hidden border-r border-white/10 bg-ink text-white lg:flex">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(360px_220px_at_10%_-10%,rgba(143,228,204,0.22),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[radial-gradient(320px_200px_at_90%_110%,rgba(49,104,167,0.18),transparent_70%)]" />

        <div className="relative flex h-[76px] shrink-0 items-center gap-3 border-b border-white/10 px-5">
          <Link href="/dashboard" aria-label="SevaAI beranda">
            <Logo tone="dark" />
          </Link>
          <span className="ml-auto rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
            Console
          </span>
        </div>

        <div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <PartnerCard />

          <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Ruang kerja</p>
          <NavList pathname={pathname} needsHuman={needsHuman} layoutId="sidebar-active" />

          <div className="my-5 h-px bg-white/[0.07]" />

          <div className="space-y-2">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Pintasan</p>
            <Link
              href="/inbox?status=NEEDS_HUMAN"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Headset className="size-4" />
              Antrean butuh CS
              {needsHuman > 0 && (
                <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#ffb86b] px-1.5 text-[10px] font-bold leading-5 text-ink">
                  {needsHuman > 9 ? "9+" : needsHuman}
                </span>
              )}
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white"
            >
              <MessageCircle className="size-4" />
              Buka konsol CS
            </Link>
          </div>
        </div>

        <div className="relative shrink-0 space-y-3 border-t border-white/10 p-4">
          <SimulatorCard />
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-mint to-mint-strong text-xs font-black text-ink">
              CS
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">Tim Layanan</p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/45">
                <span className="size-1.5 rounded-full bg-mint-strong shadow-[0_0_8px_1px_rgba(143,228,204,0.6)]" />
                Siap menerima handoff
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.aside
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Menu navigasi"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute inset-y-0 left-0 flex w-[300px] max-w-[86vw] flex-col overflow-hidden bg-ink text-white shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(320px_200px_at_10%_-10%,rgba(143,228,204,0.22),transparent_70%)]" />
              <div className="relative flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-4">
                <Logo tone="dark" />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Tutup menu navigasi"
                  autoFocus
                  className="grid size-9 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="size-[18px]" />
                </button>
              </div>

              <div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto px-3 py-4">
                <PartnerCard />
                <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Ruang kerja</p>
                <NavList
                  pathname={pathname}
                  needsHuman={needsHuman}
                  layoutId="sidebar-active-mobile"
                  onNavigate={() => setOpen(false)}
                />
                <div className="my-5 h-px bg-white/[0.07]" />
                <Link
                  href="/inbox?status=NEEDS_HUMAN"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <Headset className="size-4" />
                  Buka konsol CS
                  {needsHuman > 0 && (
                    <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#ffb86b] px-1.5 text-[10px] font-bold leading-5 text-ink">
                      {needsHuman > 9 ? "9+" : needsHuman}
                    </span>
                  )}
                </Link>
              </div>

              <div className="relative shrink-0 border-t border-white/10 p-4">
                <SimulatorCard onNavigate={() => setOpen(false)} />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
