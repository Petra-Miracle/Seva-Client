"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card, Input } from "@heroui/react";
import { BookOpenText, CalendarRange, ChevronDown, Gauge, Package, Search, Sparkles, Wrench } from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { api, errorMessage } from "@/lib/api";
import { rupiah } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Pill from "@/components/ui/Pill";
import { SegmentedControl, SpotlightCard, Stagger, StaggerItem } from "@/components/ui/motion";
import { EmptyState, ErrorBanner, SkeletonRows } from "@/components/ui/States";

type Faq = { id: string; category: string; question: string; answer: string; keywords?: string[] };
type Pkg = { id: string; name: string; speedMbps: number; monthlyPrice: number; installFee: number; contractMonths?: number };
type Tab = "faq" | "pkg";

function FaqItem({ faq, open, onToggle }: { faq: Faq; open: boolean; onToggle: () => void }) {
  return (
    <div className={`overflow-hidden rounded-2xl border bg-surface transition-colors ${open ? "border-accent/30 shadow-soft" : "border-border hover:border-accent/20"}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-3 px-4 py-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
        <span className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-text-primary">{faq.question}</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="mt-0.5 text-text-secondary">
          <ChevronDown className="size-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-t border-dashed border-border px-4 pb-4 pt-3">
              <p className="whitespace-pre-line text-sm leading-6 text-text-secondary">{faq.answer}</p>
              {faq.keywords && faq.keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {faq.keywords.map((k) => (
                    <span key={k} className="rounded-md bg-surface-tertiary px-2 py-0.5 text-[11px] text-text-secondary">#{k}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Keyed by partner so switching partners starts from a clean state.
export default function KnowledgePage() {
  const { partnerId } = usePartner();
  return <Knowledge key={partnerId} partnerId={partnerId} />;
}

function Knowledge({ partnerId }: { partnerId: string }) {
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [packages, setPackages] = useState<Pkg[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("faq");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!partnerId) return;
    const q = `partnerId=${encodeURIComponent(partnerId)}`;
    Promise.all([api<Faq[]>(`/api/knowledge/faq?${q}`), api<Pkg[]>(`/api/knowledge/packages?${q}`)])
      .then(([f, p]) => {
        setFaqs(f);
        setPackages(p);
        setError(null);
      })
      .catch((cause) => setError(errorMessage(cause, "Knowledge base gagal dimuat.")));
  }, [partnerId]);

  useEffect(load, [load]);

  const categories = useMemo(() => Array.from(new Set((faqs ?? []).map((f) => f.category))).sort(), [faqs]);

  const visibleFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (faqs ?? []).filter(
      (f) =>
        (category === "ALL" || f.category === category) &&
        (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q) || f.keywords?.some((k) => k.toLowerCase().includes(q))),
    );
  }, [faqs, query, category]);

  const sortedPackages = useMemo(() => [...(packages ?? [])].sort((a, b) => a.monthlyPrice - b.monthlyPrice), [packages]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sumber jawaban bot"
        title="Knowledge base"
        description="FAQ dan katalog paket yang dipakai bot dan AI untuk menjawab pelanggan. Pertanyaan di luar daftar ini diserahkan ke CS."
        actions={
          <SegmentedControl<Tab>
            id="knowledge-tab"
            ariaLabel="Jenis konten"
            value={tab}
            onChange={setTab}
            options={[
              { value: "faq", label: "FAQ", icon: <BookOpenText className="size-4" />, count: faqs?.length },
              { value: "pkg", label: "Katalog paket", icon: <Package className="size-4" />, count: packages?.length },
            ]}
          />
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <AnimatePresence mode="wait">
        {tab === "faq" ? (
          <motion.div key="faq" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="grid min-w-0 gap-5 lg:grid-cols-[260px_1fr]">
            <Card className="h-fit min-w-0 border border-border/80 p-4 shadow-soft lg:sticky lg:top-24">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-text-secondary" />
                <Input aria-label="Cari FAQ" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pertanyaan…" className="w-full pl-9" />
              </div>
              <p className="mb-2 mt-4 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-text-secondary">Kategori</p>
              <div className="flex flex-wrap gap-1 lg:flex-col">
                {["ALL", ...categories].map((c) => {
                  const active = category === c;
                  const count = c === "ALL" ? faqs?.length ?? 0 : faqs?.filter((f) => f.category === c).length ?? 0;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`relative flex shrink-0 items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors ${
                        active ? "text-accent-strong" : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary"
                      }`}
                    >
                      {active && <motion.span layoutId="faq-cat" className="absolute inset-0 rounded-xl bg-accent-soft" />}
                      <span className="relative">{c === "ALL" ? "Semua" : c}</span>
                      <span className="relative text-xs tabular-nums opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className="min-w-0 space-y-2.5">
              {!faqs && !error && <Card className="p-5"><SkeletonRows rows={5} /></Card>}
              {faqs && visibleFaqs.length === 0 && (
                <Card className="border border-border/80 shadow-soft">
                  <EmptyState icon={<Search className="size-6" />} title="Tidak ada FAQ yang cocok" description="Pertanyaan seperti ini akan diserahkan bot ke CS." />
                </Card>
              )}
              <Stagger className="space-y-2.5" key={`${category}:${query}`}>
                {visibleFaqs.map((f) => (
                  <StaggerItem key={f.id}>
                    <div className="mb-1 flex items-center gap-2">
                      {category === "ALL" && <Pill tone="accent" size="xs">{f.category}</Pill>}
                    </div>
                    <FaqItem faq={f} open={openId === f.id} onToggle={() => setOpenId(openId === f.id ? null : f.id)} />
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </motion.div>
        ) : (
          <motion.div key="pkg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {!packages && !error && <Card className="p-5"><SkeletonRows rows={3} /></Card>}
            {packages?.length === 0 && (
              <Card className="border border-border/80 shadow-soft">
                <EmptyState icon={<Package className="size-6" />} title="Belum ada paket" description="Paket aktif mitra akan tampil di sini." />
              </Card>
            )}
            <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sortedPackages.map((p, index) => {
                const featured = sortedPackages.length >= 3 && index === 1;
                return (
                  <StaggerItem key={p.id} className="h-full">
                    <SpotlightCard className={`h-full ${featured ? "border-accent/40 ring-1 ring-accent/20" : ""}`}>
                      {featured && (
                        <div className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-accent to-[#3fb59c] py-1.5 text-xs font-semibold text-white">
                          <Sparkles className="size-3.5" /> Paling banyak dipilih
                        </div>
                      )}
                      <div className="p-6">
                        <p className="font-heading text-lg font-semibold">{p.name}</p>
                        <div className="mt-4 flex items-end gap-1">
                          <span className={`font-heading text-4xl font-semibold tracking-tight ${featured ? "text-gradient" : "text-text-primary"}`}>
                            {rupiah(p.monthlyPrice)}
                          </span>
                          <span className="pb-1.5 text-sm text-text-secondary">/bulan</span>
                        </div>
                        <ul className="mt-6 space-y-3 text-sm">
                          <li className="flex items-center gap-3">
                            <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-accent"><Gauge className="size-4" /></span>
                            Kecepatan hingga <span className="font-semibold">{p.speedMbps} Mbps</span>
                          </li>
                          <li className="flex items-center gap-3">
                            <span className="grid size-8 place-items-center rounded-lg bg-stage-serve-bg text-stage-serve-fg"><Wrench className="size-4" /></span>
                            Biaya pasang <span className="font-semibold">{rupiah(p.installFee)}</span>
                          </li>
                          {p.contractMonths != null && (
                            <li className="flex items-center gap-3">
                              <span className="grid size-8 place-items-center rounded-lg bg-stage-retain-bg text-stage-retain-fg"><CalendarRange className="size-4" /></span>
                              Kontrak <span className="font-semibold">{p.contractMonths} bulan</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </SpotlightCard>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
