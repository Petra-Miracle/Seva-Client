"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card } from "@heroui/react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Bot,
  Headset,
  MessagesSquare,
  RefreshCw,
  Sparkles,
  Target,
  TicketCheck,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { useInterval } from "@/hooks/useInterval";
import { api, errorMessage, isAbort } from "@/lib/api";
import { clock, numberFormat, shortDate } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Pill from "@/components/ui/Pill";
import { AnimatedNumber, SegmentedControl, SpotlightCard, Stagger, StaggerItem } from "@/components/ui/motion";
import { ErrorBanner } from "@/components/ui/States";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Filler, Tooltip);

type DailyPoint = { date: string; customer: number; ai: number; automated: number; agent: number };

type DashboardMetrics = {
  period: number;
  acquire: { leads: number; subscriptions: number; activeSubscriptions?: number; conversionRate: number };
  serve: {
    conversations?: number;
    handoffs?: number;
    ticketsOpen: number;
    aiPercent: number;
    totalMessages?: number;
    aiMessages: number;
  };
  retain: { recipients: number; converted?: number; conversionRate: number };
  daily?: DailyPoint[];
};

type Period = "7" | "30" | "90";

const C = {
  ink: "#092c35",
  accent: "#147d70",
  mint: "#8fe4cc",
  serve: "#3168a7",
  retain: "#8a5ca8",
  amber: "#e59a3b",
  grid: "#edf2f0",
  tick: "#7b8f8d",
};

const tooltip = {
  backgroundColor: "rgba(9,44,53,0.94)",
  padding: 12,
  cornerRadius: 12,
  boxPadding: 6,
  usePointStyle: true,
  titleFont: { family: "Inter", weight: 600 as const, size: 12 },
  bodyFont: { family: "Inter", size: 12 },
};

function verticalGradient(color: string, from = 0.28) {
  return (context: ScriptableContext<"line">) => {
    const { ctx, chartArea } = context.chart;
    if (!chartArea) return "transparent";
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, `${color}${Math.round(from * 255).toString(16).padStart(2, "0")}`);
    gradient.addColorStop(1, `${color}00`);
    return gradient;
  };
}

function KpiCard({
  label,
  value,
  suffix,
  icon,
  footer,
  tone = "accent",
}: {
  label: string;
  value: number | null;
  suffix?: string;
  icon: React.ReactNode;
  footer: React.ReactNode;
  tone?: "accent" | "serve" | "retain" | "amber";
}) {
  const toneClass = {
    accent: "from-accent-soft to-white text-accent",
    serve: "from-stage-serve-bg to-white text-stage-serve-fg",
    retain: "from-stage-retain-bg to-white text-stage-retain-fg",
    amber: "from-warning-bg to-white text-warning-fg",
  }[tone];
  return (
    <SpotlightCard className="h-full">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-text-secondary">{label}</p>
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-b ring-1 ring-inset ring-black/[0.04] ${toneClass}`}>
            {icon}
          </span>
        </div>
        <p className="mt-2 font-heading text-[34px] font-semibold leading-none tracking-tight text-text-primary">
          <AnimatedNumber value={value} suffix={suffix} />
        </p>
        <div className="mt-4 flex items-center gap-2 border-t border-dashed border-border pt-3 text-xs text-text-secondary">
          {footer}
        </div>
      </div>
    </SpotlightCard>
  );
}

function Meter({ label, value, max, color, hint }: { label: string; value: number; max: number; color: string; hint?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-semibold tabular-nums text-text-primary">
          {numberFormat.format(value)}
          {hint && <span className="ml-1 text-xs font-medium text-text-secondary">{hint}</span>}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-tertiary">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}cc, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function ChartPlaceholder({ loading, text }: { loading: boolean; text: string }) {
  return (
    <div className={`grid h-full place-items-center rounded-2xl ${loading ? "shimmer-bg" : "dot-grid bg-surface-secondary"}`}>
      {!loading && <p className="max-w-xs px-4 text-center text-sm leading-6 text-text-secondary">{text}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { partnerId, partners, loading: partnersLoading, error: partnerError, reload: reloadPartners } = usePartner();
  const [period, setPeriod] = useState<Period>("30");
  const [metrics, setMetrics] = useState<{ key: string; data: DashboardMetrics; at: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const key = `${partnerId}:${period}`;
  const data = metrics?.key === key ? metrics.data : null;
  const loading = partnersLoading || (Boolean(partnerId) && !data && !error);

  const load = useCallback(
    (signal?: AbortSignal) => {
      if (!partnerId) return;
      api<DashboardMetrics>(`/api/metrics?partnerId=${encodeURIComponent(partnerId)}&period=${period}`, { signal })
        .then((next) => {
          setMetrics({ key: `${partnerId}:${period}`, data: next, at: new Date() });
          setError(null);
        })
        .catch((cause) => {
          if (!isAbort(cause)) setError(errorMessage(cause, "Metrik belum dapat dimuat."));
        })
        .finally(() => setRefreshing(false));
    },
    [partnerId, period],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useInterval(() => load(), 30000);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  const partnerName = partners.find((p) => p.id === partnerId)?.name;
  const daily = useMemo(() => data?.daily ?? [], [data]);
  const aiPercent = data ? Math.min(100, Math.max(0, data.serve.aiPercent)) : 0;

  const lineData = useMemo(
    () => ({
      labels: daily.map((d) => shortDate(d.date)),
      datasets: [
        {
          label: "Pesan pelanggan",
          data: daily.map((d) => d.customer),
          borderColor: C.ink,
          backgroundColor: verticalGradient(C.ink, 0.12),
          fill: true,
          tension: 0.42,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: C.ink,
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 2,
        },
        {
          label: "Dijawab AI",
          data: daily.map((d) => d.ai),
          borderColor: C.accent,
          backgroundColor: verticalGradient(C.accent, 0.26),
          fill: true,
          tension: 0.42,
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: C.accent,
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 2,
        },
        {
          label: "Bot (alur)",
          data: daily.map((d) => d.automated),
          borderColor: C.serve,
          backgroundColor: "transparent",
          borderDash: [5, 5],
          tension: 0.42,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: "Balasan CS",
          data: daily.map((d) => d.agent),
          borderColor: C.amber,
          backgroundColor: "transparent",
          tension: 0.42,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
      ],
    }),
    [daily],
  );

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    animation: { duration: 900, easing: "easeOutQuart" },
    plugins: { legend: { display: false }, tooltip },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: C.tick, maxRotation: 0, autoSkip: true, maxTicksLimit: period === "7" ? 7 : 8, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: C.grid },
        border: { display: false },
        ticks: { color: C.tick, precision: 0, font: { size: 11 }, padding: 8 },
      },
    },
  };

  const hasTrend = daily.some((d) => d.customer + d.ai + d.automated + d.agent > 0);

  const funnelData = useMemo(
    () => ({
      labels: ["Lead baru", "Berlangganan", "Aktif"],
      datasets: [
        {
          data: data ? [data.acquire.leads, data.acquire.subscriptions, data.acquire.activeSubscriptions ?? 0] : [],
          backgroundColor: [C.mint, "#3fb59c", C.accent],
          hoverBackgroundColor: ["#7fd9bf", "#35a58d", "#0f6a5e"],
          borderRadius: 10,
          borderSkipped: false as const,
          barThickness: 22,
        },
      ],
    }),
    [data],
  );

  const funnelOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    animation: { duration: 900, easing: "easeOutQuart" },
    plugins: { legend: { display: false }, tooltip },
    scales: {
      x: { beginAtZero: true, grid: { color: C.grid }, border: { display: false }, ticks: { color: C.tick, precision: 0, font: { size: 11 } } },
      y: { grid: { display: false }, border: { display: false }, ticks: { color: "#425e5d", font: { family: "Inter", weight: 500, size: 12 } } },
    },
  };

  const doughnutData = {
    labels: ["Dijawab AI", "Bot, CS & pelanggan"],
    datasets: [
      {
        data: [aiPercent, 100 - aiPercent],
        backgroundColor: [C.accent, "#e7efec"],
        hoverBackgroundColor: ["#0f6a5e", "#dbe6e2"],
        borderWidth: 0,
        borderRadius: aiPercent > 0 && aiPercent < 100 ? 8 : 0,
        spacing: aiPercent > 0 && aiPercent < 100 ? 3 : 0,
      },
    ],
  };

  const doughnutOptions: ChartOptions<"doughnut"> = {
    cutout: "76%",
    animation: { animateRotate: true, duration: 1100, easing: "easeOutQuart" },
    plugins: { legend: { display: false }, tooltip: { ...tooltip, callbacks: { label: (item) => ` ${item.label}: ${item.parsed}%` } } },
  };

  const periodLabel = `${period} hari terakhir`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={partnerName ? `Ringkasan · ${partnerName}` : "Ringkasan operasional"}
        title="Dashboard"
        description="Pantau akuisisi, layanan, dan retensi pelanggan dalam satu tampilan. Data diperbarui otomatis tiap 30 detik."
        actions={
          <>
            <SegmentedControl<Period>
              id="period"
              ariaLabel="Periode metrik"
              value={period}
              onChange={setPeriod}
              options={[
                { value: "7", label: "7 hari" },
                { value: "30", label: "30 hari" },
                { value: "90", label: "90 hari" },
              ]}
            />
            <Button variant="secondary" size="sm" onPress={refresh} isDisabled={!partnerId || refreshing} className="h-10">
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{metrics?.at ? `Diperbarui ${clock(metrics.at)}` : "Perbarui"}</span>
            </Button>
          </>
        }
      />

      {(partnerError || error) && (
        <ErrorBanner
          message={partnerError || error || ""}
          onRetry={partnerError ? reloadPartners : refresh}
        />
      )}

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <KpiCard
            label="Lead baru"
            value={data ? data.acquire.leads : null}
            icon={<UserPlus className="size-[18px]" />}
            footer={<><Pill tone="accent" size="xs">Dapatkan</Pill> {periodLabel}</>}
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Langganan aktif"
            value={data ? data.acquire.conversionRate : null}
            suffix="%"
            icon={<TrendingUp className="size-[18px]" />}
            footer={
              <>
                <span className="font-semibold text-text-primary">{data ? numberFormat.format(data.acquire.activeSubscriptions ?? 0) : "—"}</span>
                dari {data ? numberFormat.format(data.acquire.subscriptions) : "—"} langganan
              </>
            }
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Dijawab AI"
            value={data ? aiPercent : null}
            suffix="%"
            tone="serve"
            icon={<Sparkles className="size-[18px]" />}
            footer={
              <>
                <span className="font-semibold text-text-primary">{data ? numberFormat.format(data.serve.aiMessages) : "—"}</span>
                pesan oleh AI
              </>
            }
          />
        </StaggerItem>
        <StaggerItem>
          <KpiCard
            label="Tiket terbuka"
            value={data ? data.serve.ticketsOpen : null}
            tone="amber"
            icon={<TicketCheck className="size-[18px]" />}
            footer={
              data ? (
                data.serve.ticketsOpen > 0 ? <Pill tone="warning" size="xs" dot pulse>Perlu perhatian</Pill> : <Pill tone="success" size="xs" dot>Semua tertangani</Pill>
              ) : (
                "Menunggu data"
              )
            }
          />
        </StaggerItem>
      </Stagger>

      <section className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <Card className="border border-border/80 shadow-soft">
          <div className="p-5 md:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Aktivitas percakapan</p>
                <h2 className="mt-1.5 font-heading text-lg font-semibold text-text-primary">Tren pesan harian</h2>
                <p className="mt-0.5 text-sm text-text-secondary">Siapa yang menjawab pelanggan setiap hari.</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary">
                {[
                  ["Pelanggan", C.ink],
                  ["AI", C.accent],
                  ["Bot", C.serve],
                  ["CS", C.amber],
                ].map(([label, color]) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <i className="size-2 rounded-full" style={{ background: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative h-[280px]">
              {data && hasTrend ? (
                <Line data={lineData} options={lineOptions} aria-label="Grafik tren pesan harian" role="img" />
              ) : (
                <ChartPlaceholder loading={loading} text="Belum ada pesan pada periode ini. Coba kirim pesan dari Simulator." />
              )}
            </div>
          </div>
        </Card>

        <Card className="border border-border/80 shadow-soft">
          <div className="flex h-full flex-col p-5 md:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">Efisiensi AI</p>
            <h2 className="mt-1.5 font-heading text-lg font-semibold text-text-primary">Porsi jawaban AI</h2>
            <p className="mt-0.5 text-sm text-text-secondary">Dari seluruh pesan dalam {periodLabel}.</p>
            <div className="relative mx-auto mt-5 size-48">
              {data ? (
                <Doughnut data={doughnutData} options={doughnutOptions} aria-label="Grafik porsi jawaban AI" role="img" />
              ) : (
                <div className={`size-full rounded-full ${loading ? "shimmer-bg" : "bg-surface-tertiary"}`} />
              )}
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="font-heading text-4xl font-semibold tracking-tight text-text-primary">
                    <AnimatedNumber value={data ? aiPercent : null} suffix="%" />
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-text-secondary">oleh AI</p>
                </div>
              </div>
            </div>
            <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
              <div className="rounded-2xl bg-accent-soft/70 p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-accent-strong"><Bot className="size-3.5" /> Pesan AI</p>
                <p className="mt-1 font-heading text-xl font-semibold text-accent-strong"><AnimatedNumber value={data?.serve.aiMessages ?? null} /></p>
              </div>
              <div className="rounded-2xl bg-surface-tertiary p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-text-secondary"><MessagesSquare className="size-3.5" /> Total pesan</p>
                <p className="mt-1 font-heading text-xl font-semibold text-text-primary"><AnimatedNumber value={data?.serve.totalMessages ?? null} /></p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <Stagger className="grid gap-5 lg:grid-cols-3">
        <StaggerItem>
          <Card className="h-full border border-border/80 shadow-soft">
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <Pill tone="accent" dot>Dapatkan</Pill>
                <Target className="size-4 text-text-secondary" />
              </div>
              <h3 className="mt-3 font-heading text-base font-semibold">Corong akuisisi</h3>
              <p className="text-sm text-text-secondary">Dari lead hingga pelanggan aktif.</p>
              <div className="mt-4 h-[150px]">
                {data ? <Bar data={funnelData} options={funnelOptions} aria-label="Grafik corong akuisisi" role="img" /> : <ChartPlaceholder loading={loading} text="Belum ada data akuisisi." />}
              </div>
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="h-full border border-border/80 shadow-soft">
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <Pill tone="serve" dot>Layani</Pill>
                <Headset className="size-4 text-text-secondary" />
              </div>
              <h3 className="mt-3 font-heading text-base font-semibold">Beban layanan</h3>
              <p className="text-sm text-text-secondary">Percakapan baru dan yang butuh CS.</p>
              <div className="mt-5 space-y-4">
                <Meter label="Percakapan baru" value={data?.serve.conversations ?? 0} max={data?.serve.conversations ?? 0} color={C.serve} />
                <Meter
                  label="Diserahkan ke CS"
                  value={data?.serve.handoffs ?? 0}
                  max={data?.serve.conversations ?? 0}
                  color={C.amber}
                  hint={data?.serve.conversations ? `(${Math.round(((data.serve.handoffs ?? 0) / data.serve.conversations) * 100)}%)` : undefined}
                />
                <Meter label="Tiket terbuka" value={data?.serve.ticketsOpen ?? 0} max={Math.max(data?.serve.ticketsOpen ?? 0, data?.serve.conversations ?? 0)} color="#d9634f" />
              </div>
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="h-full border border-border/80 shadow-soft">
            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <Pill tone="retain" dot>Pertahankan</Pill>
                <Users className="size-4 text-text-secondary" />
              </div>
              <h3 className="mt-3 font-heading text-base font-semibold">Hasil kampanye</h3>
              <p className="text-sm text-text-secondary">Penerima yang membalas dan berkonversi.</p>
              <div className="mt-4 flex items-end gap-2">
                <p className="font-heading text-4xl font-semibold tracking-tight text-stage-retain-fg">
                  <AnimatedNumber value={data ? data.retain.conversionRate : null} suffix="%" />
                </p>
                <p className="pb-1.5 text-xs text-text-secondary">tingkat konversi</p>
              </div>
              <div className="mt-4 space-y-4">
                <Meter label="Penerima" value={data?.retain.recipients ?? 0} max={data?.retain.recipients ?? 0} color={C.retain} />
                <Meter label="Berkonversi" value={data?.retain.converted ?? 0} max={data?.retain.recipients ?? 0} color={C.accent} />
              </div>
            </div>
          </Card>
        </StaggerItem>
      </Stagger>
    </div>
  );
}
