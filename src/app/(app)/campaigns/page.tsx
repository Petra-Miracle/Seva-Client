"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Card, Input, Label, Spinner, TextField, toast } from "@heroui/react";
import { CheckCheck, Eye, Filter, Megaphone, MessageSquareText, Plus, Rocket, Send, ShieldCheck, Users } from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { api, errorMessage } from "@/lib/api";
import { CAMPAIGN_STATUS, describeRules, initials, numberFormat, TEMPLATE_CATEGORY } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Pill from "@/components/ui/Pill";
import AppSelect from "@/components/ui/AppSelect";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/motion";
import { EmptyState, ErrorBanner, SkeletonRows } from "@/components/ui/States";

type Segment = { id: string; name: string; rules: Record<string, unknown> };
type Template = { id: string; name: string; category: string; body: string };
type Recipient = { id: string; sentAt?: string | null; repliedAt?: string | null; converted: boolean };
type Campaign = {
  id: string;
  name: string;
  goal: string;
  status: string;
  segment?: Segment;
  template?: Template;
  recipients?: Recipient[];
};
type Preview = { count: number; customers: { id: string; name: string }[] };
type RunResult = { sent: number; total: number; skipped: number };

function PreviewStrip({ preview }: { preview: Preview }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="mt-3 flex items-center gap-3 rounded-xl bg-accent-soft/60 px-3 py-2.5">
        <div className="flex -space-x-2">
          {preview.customers.slice(0, 5).map((c) => (
            <span key={c.id} title={c.name} className="grid size-7 place-items-center rounded-full border-2 border-white bg-white text-[10px] font-bold text-accent-strong">
              {initials(c.name)}
            </span>
          ))}
        </div>
        <p className="text-sm text-accent-strong">
          <span className="font-semibold">{numberFormat.format(preview.count)} pelanggan</span> cocok saat ini
        </p>
      </div>
    </motion.div>
  );
}

// Keyed by partner so switching partners starts from a clean state.
export default function CampaignsPage() {
  const { partnerId } = usePartner();
  return <Campaigns key={partnerId} partnerId={partnerId} />;
}

function Campaigns({ partnerId }: { partnerId: string }) {
  const [segments, setSegments] = useState<Segment[] | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, Preview>>({});
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", goal: "", segmentId: "", templateId: "" });
  const [saving, setSaving] = useState(false);
  const [creatingSegment, setCreatingSegment] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, RunResult>>({});

  const load = useCallback(() => {
    if (!partnerId) return;
    const q = `partnerId=${encodeURIComponent(partnerId)}`;
    Promise.all([
      api<Segment[]>(`/api/segments?${q}`),
      api<Template[]>(`/api/templates?${q}`),
      api<Campaign[]>(`/api/campaigns?${q}`),
    ])
      .then(([s, t, c]) => {
        setSegments(s);
        setTemplates(t);
        setCampaigns(c);
        setError(null);
      })
      .catch((cause) => setError(errorMessage(cause, "Data kampanye gagal dimuat.")));
  }, [partnerId]);

  useEffect(load, [load]);

  const preview = useCallback(async (id: string) => {
    setPreviewing(id);
    try {
      const result = await api<Preview>(`/api/segments/${id}/preview`);
      setPreviews((current) => ({ ...current, [id]: result }));
    } catch (cause) {
      toast.danger("Pratinjau gagal", { description: errorMessage(cause, "Coba lagi sebentar.") });
    } finally {
      setPreviewing(null);
    }
  }, []);

  // Preview the segment picked in the form so the summary shows the real audience size.
  const pickSegment = (segmentId: string) => {
    setForm((f) => ({ ...f, segmentId }));
    if (segmentId && !previews[segmentId]) void preview(segmentId);
  };

  const createSegment = async () => {
    setCreatingSegment(true);
    try {
      await api("/api/segments", {
        method: "POST",
        body: JSON.stringify({ partnerId, name: "Tagihan jatuh tempo 3 hari", rules: { invoiceStatus: "UNPAID", dueInDays: 3 } }),
      });
      toast.success("Segmen demo dibuat");
      load();
    } catch (cause) {
      toast.danger("Segmen gagal dibuat", { description: errorMessage(cause, "Coba lagi sebentar.") });
    } finally {
      setCreatingSegment(false);
    }
  };

  const canSave = form.name.trim() && form.segmentId && form.templateId;
  const createCampaign = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await api("/api/campaigns", { method: "POST", body: JSON.stringify({ partnerId, ...form, goal: form.goal.trim() || form.name.trim() }) });
      toast.success("Kampanye disimpan", { description: "Jalankan sekarang dari daftar kampanye." });
      setForm({ name: "", goal: "", segmentId: "", templateId: "" });
      load();
    } catch (cause) {
      toast.danger("Kampanye gagal disimpan", { description: errorMessage(cause, "Periksa isian lalu coba lagi.") });
    } finally {
      setSaving(false);
    }
  };

  const run = async (campaign: Campaign) => {
    setRunning(campaign.id);
    try {
      const result = await api<RunResult>(`/api/campaigns/${campaign.id}/run`, { method: "POST" });
      setResults((current) => ({ ...current, [campaign.id]: result }));
      toast.success(`"${campaign.name}" dijalankan`, { description: `Terkirim ${result.sent} dari ${result.total} penerima.` });
      load();
    } catch (cause) {
      toast.danger("Kampanye gagal dijalankan", { description: errorMessage(cause, "Coba lagi sebentar.") });
    } finally {
      setRunning(null);
    }
  };

  const selectedSegment = segments?.find((s) => s.id === form.segmentId);
  const selectedTemplate = templates.find((t) => t.id === form.templateId);
  const sorted = useMemo(() => [...(campaigns ?? [])].reverse(), [campaigns]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pertahankan"
        title="Kampanye"
        description="Kirim pengingat dan penawaran ke segmen pelanggan. Penawaran hanya dikirim ke pelanggan yang bersedia menerima promosi."
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        {/* Create campaign */}
        <FadeIn>
          <Card className="h-full border border-border/80 p-0 shadow-soft">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-white"><Plus className="size-4" /></span>
              <div>
                <h2 className="font-heading text-base font-semibold">Kampanye baru</h2>
                <p className="text-xs text-text-secondary">Pilih segmen dan template, lalu simpan.</p>
              </div>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <div className="space-y-4">
                <TextField value={form.name} onChange={(name) => setForm((f) => ({ ...f, name }))}>
                  <Label>Nama kampanye</Label>
                  <Input placeholder="Mis. Pengingat tagihan November" />
                </TextField>
                <TextField value={form.goal} onChange={(goal) => setForm((f) => ({ ...f, goal }))}>
                  <Label>Tujuan</Label>
                  <Input placeholder="Mis. Pelanggan bayar sebelum jatuh tempo" />
                </TextField>
                <AppSelect
                  label="Segmen"
                  placeholder={segments?.length ? "Pilih segmen" : "Belum ada segmen"}
                  items={(segments ?? []).map((s) => ({ id: s.id, label: s.name, description: describeRules(s.rules).join(" · ") }))}
                  value={form.segmentId}
                  onChange={pickSegment}
                  isDisabled={!segments?.length}
                />
                <AppSelect
                  label="Template pesan"
                  placeholder={templates.length ? "Pilih template" : "Belum ada template"}
                  items={templates.map((t) => ({ id: t.id, label: t.name, description: TEMPLATE_CATEGORY[t.category] ?? t.category }))}
                  value={form.templateId}
                  onChange={(templateId) => setForm((f) => ({ ...f, templateId }))}
                  isDisabled={!templates.length}
                />
              </div>

              {/* Summary */}
              <div className="flex flex-col rounded-2xl border border-dashed border-border bg-surface-secondary/70 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-secondary">Ringkasan</p>
                <dl className="mt-3 space-y-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Filter className="mt-0.5 size-4 shrink-0 text-text-secondary" />
                    <div>
                      <dt className="text-xs text-text-secondary">Segmen</dt>
                      <dd className="font-medium">{selectedSegment?.name ?? "—"}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Users className="mt-0.5 size-4 shrink-0 text-text-secondary" />
                    <div>
                      <dt className="text-xs text-text-secondary">Perkiraan penerima</dt>
                      <dd className="font-medium">
                        {form.segmentId ? (previews[form.segmentId] ? `${previews[form.segmentId].count} pelanggan` : <Spinner size="sm" />) : "—"}
                      </dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MessageSquareText className="mt-0.5 size-4 shrink-0 text-text-secondary" />
                    <div className="min-w-0">
                      <dt className="flex items-center gap-2 text-xs text-text-secondary">
                        Template
                        {selectedTemplate && (
                          <Pill tone={selectedTemplate.category === "MARKETING" ? "retain" : "serve"} size="xs">
                            {TEMPLATE_CATEGORY[selectedTemplate.category] ?? selectedTemplate.category}
                          </Pill>
                        )}
                      </dt>
                      <dd className="font-medium">{selectedTemplate?.name ?? "—"}</dd>
                    </div>
                  </div>
                </dl>
                <AnimatePresence mode="wait">
                  {selectedTemplate && (
                    <motion.div
                      key={selectedTemplate.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 rounded-2xl rounded-tl-md bg-white p-3 text-[13px] leading-5 text-text-primary shadow-soft ring-1 ring-border"
                    >
                      {selectedTemplate.body}
                    </motion.div>
                  )}
                </AnimatePresence>
                {selectedTemplate?.category === "MARKETING" && (
                  <p className="mt-3 flex items-start gap-1.5 text-xs text-text-secondary">
                    <ShieldCheck className="mt-px size-3.5 shrink-0 text-success-fg" />
                    Hanya dikirim ke pelanggan yang opt-in promosi.
                  </p>
                )}
                <Button variant="primary" className="mt-auto w-full" isDisabled={!canSave || saving} onPress={createCampaign}>
                  {saving ? <Spinner size="sm" color="current" /> : <CheckCheck className="size-4" />}
                  Simpan kampanye
                </Button>
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Segments */}
        <FadeIn delay={0.08}>
          <Card className="h-full border border-border/80 p-0 shadow-soft">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="font-heading text-base font-semibold">Segmen pelanggan</h2>
                <p className="text-xs text-text-secondary">Aturan dievaluasi saat kampanye dijalankan.</p>
              </div>
              <Button size="sm" variant="secondary" onPress={createSegment} isDisabled={creatingSegment || !partnerId}>
                {creatingSegment ? <Spinner size="sm" color="current" /> : <Plus className="size-4" />}
                Segmen demo
              </Button>
            </div>
            <div className="space-y-3 p-5">
              {!segments && !error && <SkeletonRows rows={3} />}
              {segments?.length === 0 && (
                <EmptyState icon={<Filter className="size-6" />} title="Belum ada segmen" description="Buat segmen demo untuk mencoba alur kampanye." />
              )}
              {segments?.map((s) => (
                <div key={s.id} className="rounded-2xl border border-border p-4 transition-colors hover:border-accent/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary">{s.name}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {describeRules(s.rules).map((rule) => (
                          <span key={rule} className="rounded-md bg-surface-tertiary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                            {rule}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onPress={() => preview(s.id)} isDisabled={previewing === s.id}>
                      {previewing === s.id ? <Spinner size="sm" color="current" /> : <Eye className="size-4" />}
                      Pratinjau
                    </Button>
                  </div>
                  <AnimatePresence>{previews[s.id] && <PreviewStrip preview={previews[s.id]} />}</AnimatePresence>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
      </div>

      {/* Campaign list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Daftar kampanye</h2>
          {campaigns && <span className="text-sm text-text-secondary">{campaigns.length} kampanye</span>}
        </div>
        {!campaigns && !error && <Card className="p-5"><SkeletonRows rows={3} /></Card>}
        {campaigns?.length === 0 && (
          <Card className="border border-border/80 shadow-soft">
            <EmptyState icon={<Megaphone className="size-6" />} title="Belum ada kampanye" description="Simpan kampanye pertama dari formulir di atas." />
          </Card>
        )}
        <Stagger className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {sorted.map((c) => {
            const status = CAMPAIGN_STATUS[c.status] ?? { label: c.status, tone: "neutral" as const };
            const sent = c.recipients?.filter((r) => r.sentAt).length ?? 0;
            const replied = c.recipients?.filter((r) => r.repliedAt).length ?? 0;
            const converted = c.recipients?.filter((r) => r.converted).length ?? 0;
            const result = results[c.id];
            return (
              <StaggerItem key={c.id}>
                <Card className="h-full border border-border/80 p-0 shadow-soft transition-shadow hover:shadow-lift">
                  <div className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-heading text-base font-semibold">{c.name}</p>
                        <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">{c.goal}</p>
                      </div>
                      <Pill tone={status.tone} dot={c.status === "SENT"}>{status.label}</Pill>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                      {c.segment && <span className="rounded-md bg-surface-tertiary px-2 py-0.5 text-text-secondary">{c.segment.name}</span>}
                      {c.template && (
                        <Pill tone={c.template.category === "MARKETING" ? "retain" : "serve"} size="xs">
                          {TEMPLATE_CATEGORY[c.template.category] ?? c.template.category}
                        </Pill>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-surface-secondary p-3 text-center">
                      {[
                        ["Terkirim", sent],
                        ["Membalas", replied],
                        ["Konversi", converted],
                      ].map(([label, value]) => (
                        <div key={label as string}>
                          <p className="font-heading text-lg font-semibold tabular-nums">{value}</p>
                          <p className="text-[11px] text-text-secondary">{label}</p>
                        </div>
                      ))}
                    </div>
                    <AnimatePresence>
                      {result && (
                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 flex items-center gap-1.5 text-xs text-success-fg">
                          <Send className="size-3.5" />
                          Terkirim {result.sent} dari {result.total} · dilewati {result.skipped} (tanpa opt-in)
                        </motion.p>
                      )}
                    </AnimatePresence>
                    <Button
                      className="mt-4 w-full"
                      variant={c.status === "SENT" ? "secondary" : "primary"}
                      onPress={() => run(c)}
                      isDisabled={running !== null || c.status === "SENT"}
                    >
                      {running === c.id ? <Spinner size="sm" color="current" /> : c.status === "SENT" ? <CheckCheck className="size-4" /> : <Rocket className="size-4" />}
                      {c.status === "SENT" ? "Sudah dikirim" : "Jalankan sekarang"}
                    </Button>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>
    </div>
  );
}
