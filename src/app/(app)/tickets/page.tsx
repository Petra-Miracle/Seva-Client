"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Card, Input, Spinner, toast } from "@heroui/react";
import { CheckCircle2, CircleDot, Clock3, PlayCircle, Search, TicketX, Wrench } from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { useInterval } from "@/hooks/useInterval";
import { api, errorMessage } from "@/lib/api";
import { initials, TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS, timeAgo } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Pill from "@/components/ui/Pill";
import { AnimatedNumber, SegmentedControl, SpotlightCard, Stagger, StaggerItem } from "@/components/ui/motion";
import { EmptyState, ErrorBanner, SkeletonRows } from "@/components/ui/States";

type TicketRow = {
  id: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
  customer?: { id: string; name: string; phone: string };
};

type Filter = "ACTIVE" | "OPEN" | "IN_PROGRESS" | "DONE" | "ALL";

const nextStep: Record<string, { status: string; label: string; icon: React.ReactNode } | undefined> = {
  OPEN: { status: "IN_PROGRESS", label: "Proses", icon: <PlayCircle className="size-4" /> },
  IN_PROGRESS: { status: "RESOLVED", label: "Selesaikan", icon: <CheckCircle2 className="size-4" /> },
};

// Keyed by partner so switching partners starts from a clean state.
export default function TicketsPage() {
  const { partnerId } = usePartner();
  return <Tickets key={partnerId} partnerId={partnerId} />;
}

function Tickets({ partnerId }: { partnerId: string }) {
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ACTIVE");
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!partnerId) return;
    api<TicketRow[]>(`/api/tickets?partnerId=${encodeURIComponent(partnerId)}`)
      .then((rows) => {
        setTickets(rows);
        setError(null);
      })
      .catch((cause) => setError(errorMessage(cause, "Tiket gagal dimuat.")));
  }, [partnerId]);

  useEffect(load, [load]);
  useInterval(load, 15000);

  const stats = useMemo(() => {
    const s = { OPEN: 0, IN_PROGRESS: 0, DONE: 0, high: 0 };
    for (const t of tickets ?? []) {
      if (t.status === "OPEN") s.OPEN += 1;
      else if (t.status === "IN_PROGRESS") s.IN_PROGRESS += 1;
      else s.DONE += 1;
      if (t.priority === "TINGGI" && (t.status === "OPEN" || t.status === "IN_PROGRESS")) s.high += 1;
    }
    return s;
  }, [tickets]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tickets ?? []).filter((t) => {
      const passFilter =
        filter === "ALL" ||
        (filter === "ACTIVE" && (t.status === "OPEN" || t.status === "IN_PROGRESS")) ||
        (filter === "DONE" && (t.status === "RESOLVED" || t.status === "CLOSED")) ||
        t.status === filter;
      const passQuery =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.customer?.name.toLowerCase().includes(q) ||
        (TICKET_CATEGORY[t.category] ?? t.category).toLowerCase().includes(q);
      return passFilter && passQuery;
    });
  }, [tickets, filter, query]);

  const advance = async (ticket: TicketRow) => {
    const step = nextStep[ticket.status];
    if (!step) return;
    setUpdating(ticket.id);
    try {
      const updated = await api<TicketRow>(`/api/tickets/${ticket.id}`, { method: "PATCH", body: JSON.stringify({ status: step.status }) });
      setTickets((rows) => rows?.map((row) => (row.id === updated.id ? updated : row)) ?? null);
      toast.success(`Tiket #${ticket.id.slice(-6).toUpperCase()} ${step.status === "RESOLVED" ? "selesai" : "diproses"}`);
    } catch (cause) {
      toast.danger("Status tiket gagal diubah", { description: errorMessage(cause, "Coba lagi sebentar.") });
    } finally {
      setUpdating(null);
    }
  };

  const ActionButton = ({ ticket }: { ticket: TicketRow }) => {
    const step = nextStep[ticket.status];
    if (!step) return <span className="text-xs text-text-secondary">{ticket.resolvedAt ? `Selesai ${timeAgo(ticket.resolvedAt)}` : "—"}</span>;
    return (
      <Button size="sm" variant={ticket.status === "OPEN" ? "secondary" : "primary"} isDisabled={updating === ticket.id} onPress={() => advance(ticket)}>
        {updating === ticket.id ? <Spinner size="sm" color="current" /> : step.icon}
        {step.label}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Layani"
        title="Tiket support"
        description="Tiket dibuat otomatis oleh bot dari laporan gangguan (termasuk foto). Proses dan selesaikan dari sini."
      />

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Terbuka", value: stats.OPEN, icon: <CircleDot className="size-[18px]" />, cls: "bg-danger-bg text-danger-fg" },
          { label: "Diproses", value: stats.IN_PROGRESS, icon: <Clock3 className="size-[18px]" />, cls: "bg-warning-bg text-warning-fg" },
          { label: "Selesai", value: stats.DONE, icon: <CheckCircle2 className="size-[18px]" />, cls: "bg-success-bg text-success-fg" },
          { label: "Prioritas tinggi", value: stats.high, icon: <Wrench className="size-[18px]" />, cls: "bg-stage-retain-bg text-stage-retain-fg" },
        ].map((item) => (
          <StaggerItem key={item.label}>
            <SpotlightCard>
              <div className="flex items-center gap-4 p-4">
                <span className={`grid size-11 place-items-center rounded-xl ${item.cls}`}>{item.icon}</span>
                <div>
                  <p className="text-xs font-medium text-text-secondary">{item.label}</p>
                  <p className="font-heading text-2xl font-semibold leading-tight">
                    <AnimatedNumber value={tickets ? item.value : null} />
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </StaggerItem>
        ))}
      </Stagger>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <Card className="overflow-hidden border border-border/80 p-0 shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <SegmentedControl<Filter>
            id="ticket-filter"
            size="sm"
            ariaLabel="Filter tiket"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "ACTIVE", label: "Aktif", count: stats.OPEN + stats.IN_PROGRESS },
              { value: "OPEN", label: "Terbuka", count: stats.OPEN },
              { value: "IN_PROGRESS", label: "Diproses", count: stats.IN_PROGRESS },
              { value: "DONE", label: "Selesai", count: stats.DONE },
              { value: "ALL", label: "Semua", count: tickets?.length ?? 0 },
            ]}
          />
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-text-secondary" />
            <Input aria-label="Cari tiket" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari no. tiket, pelanggan…" className="w-full pl-9" />
          </div>
        </div>

        {!tickets && !error && <SkeletonRows rows={5} className="p-5" />}
        {tickets && visible.length === 0 && (
          <EmptyState
            icon={<TicketX className="size-6" />}
            title={tickets.length ? "Tidak ada tiket yang cocok" : "Belum ada tiket"}
            description={tickets.length ? "Ubah filter atau kata kunci pencarian." : "Coba kirim foto router dari Simulator untuk membuat tiket gangguan."}
          />
        )}

        {tickets && visible.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-secondary text-left text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                    <th className="px-5 py-3">Tiket</th>
                    <th className="px-5 py-3">Pelanggan</th>
                    <th className="px-5 py-3">Kategori</th>
                    <th className="px-5 py-3">Prioritas</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {visible.map((t, index) => {
                      const st = TICKET_STATUS[t.status] ?? { label: t.status, tone: "neutral" as const };
                      const pr = TICKET_PRIORITY[t.priority] ?? { label: t.priority, tone: "neutral" as const };
                      return (
                        <motion.tr
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: Math.min(index, 10) * 0.025 } }}
                          exit={{ opacity: 0 }}
                          className="border-t border-border/70 transition-colors hover:bg-surface-secondary/70"
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-mono text-[13px] font-semibold text-text-primary">#{t.id.slice(-6).toUpperCase()}</p>
                            <p className="text-xs text-text-secondary">{timeAgo(t.createdAt)}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="grid size-8 place-items-center rounded-lg bg-accent-soft text-[11px] font-bold text-accent-strong">
                                {initials(t.customer?.name)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-medium">{t.customer?.name ?? "—"}</p>
                                <p className="text-xs text-text-secondary">{t.customer?.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-text-primary">{TICKET_CATEGORY[t.category] ?? t.category}</td>
                          <td className="px-5 py-3.5"><Pill tone={pr.tone} size="xs">{pr.label}</Pill></td>
                          <td className="px-5 py-3.5"><Pill tone={st.tone} size="xs" dot>{st.label}</Pill></td>
                          <td className="px-5 py-3.5 text-right"><ActionButton ticket={t} /></td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {visible.map((t) => {
                const st = TICKET_STATUS[t.status] ?? { label: t.status, tone: "neutral" as const };
                const pr = TICKET_PRIORITY[t.priority] ?? { label: t.priority, tone: "neutral" as const };
                return (
                  <div key={t.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[13px] font-semibold">#{t.id.slice(-6).toUpperCase()}</p>
                        <p className="text-sm font-medium">{t.customer?.name}</p>
                        <p className="text-xs text-text-secondary">{TICKET_CATEGORY[t.category] ?? t.category} · {timeAgo(t.createdAt)}</p>
                      </div>
                      <Pill tone={st.tone} size="xs" dot>{st.label}</Pill>
                    </div>
                    <div className="flex items-center justify-between">
                      <Pill tone={pr.tone} size="xs">Prioritas {pr.label.toLowerCase()}</Pill>
                      <ActionButton ticket={t} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
