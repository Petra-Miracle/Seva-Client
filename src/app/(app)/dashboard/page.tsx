"use client";
import { useEffect, useState } from "react";
import { usePartner } from "@/hooks/usePartner";
import { api } from "@/lib/api";
import { Card, CardContent, Chip } from "@heroui/react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const { partnerId } = usePartner();
  const [metrics, setMetrics] = useState<any>(null);
  const [period, setPeriod] = useState("30");
  useEffect(() => {
    if (!partnerId) return;
    api(`/api/metrics?partnerId=${partnerId}&period=${period}`).then(setMetrics).catch(() => {});
  }, [partnerId, period]);

  if (!metrics) return <div className="text-text-secondary p-6">Memuat...</div>;

  const barData = {
    labels: ["Lead", "Berlangganan", "Selesai tanpa CS", "Tiket terbuka", "Penerima kampanye"],
    datasets: [{
      label: "Jumlah",
      data: [metrics.acquire.leads, metrics.acquire.subscriptions, metrics.serve.aiPercent, metrics.serve.ticketsOpen, metrics.retain.recipients],
      backgroundColor: ["#0F6A5E", "#0B6E8A", "#1849A9", "#B42318", "#6B2FA3"],
    }],
  };
  const doughnutData = {
    labels: ["Tanpa AI", "Dengan AI"],
    datasets: [{
      data: [100 - metrics.serve.aiPercent, metrics.serve.aiPercent],
      backgroundColor: ["#F2F4F7", "#E6F2F6"],
      borderColor: ["#E4E7EC", "#0B6E8A"],
    }],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="bg-surface border border-border rounded-control flex overflow-hidden">
            {["7", "30"].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-sm ${period === p ? "bg-accent-soft text-accent-strong font-semibold" : "text-text-secondary"}`}>{p} hari</button>
            ))}
          </div>
          <Chip size="sm" color="success" variant="soft" className="gap-1">
            <span className="w-2 h-2 rounded-full bg-success-fg" /> Live
          </Chip>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <Chip size="sm" className="bg-stage-acquire-bg text-stage-acquire-fg font-bold mb-3">Dapatkan</Chip>
          <div className="font-heading text-2xl font-semibold text-stage-acquire-fg">{metrics.acquire.leads}</div>
          <div className="text-xs text-text-secondary">Lead masuk</div>
          <div className="mt-3 font-heading text-2xl font-semibold text-stage-acquire-fg">{metrics.acquire.conversionRate}%</div>
          <div className="text-xs text-text-secondary">Lead → berlangganan</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <Chip size="sm" className="bg-stage-serve-bg text-stage-serve-fg font-bold mb-3">Layani</Chip>
          <div className="font-heading text-2xl font-semibold text-stage-serve-fg">{metrics.serve.aiPercent}%</div>
          <div className="text-xs text-text-secondary">Selesai tanpa CS</div>
          <div className="mt-3 font-heading text-2xl font-semibold text-stage-serve-fg">{metrics.serve.ticketsOpen}</div>
          <div className="text-xs text-text-secondary">Tiket terbuka</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <Chip size="sm" className="bg-stage-retain-bg text-stage-retain-fg font-bold mb-3">Pertahankan</Chip>
          <div className="font-heading text-2xl font-semibold text-stage-retain-fg">{metrics.retain.recipients}</div>
          <div className="text-xs text-text-secondary">Penerima kampanye</div>
          <div className="mt-3 font-heading text-2xl font-semibold text-stage-retain-fg">{metrics.retain.conversionRate}%</div>
          <div className="text-xs text-text-secondary">Pelanggan kembali (converted)</div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-5">
        <h2 className="font-heading font-semibold text-lg mb-3">Metrik Utama</h2>
        <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-5">
          <h2 className="font-heading font-semibold text-lg mb-3">Efisiensi AI — Tanpa AI vs Dengan AI</h2>
          <div className="flex items-center gap-6">
            <div className="w-40 h-40">
              <Doughnut data={doughnutData} options={{ plugins: { legend: { display: false } } }} />
            </div>
            <div className="text-sm text-text-secondary space-y-1">
              <div>Tanpa AI: {100 - metrics.serve.aiPercent}%</div>
              <div>Dengan AI: {metrics.serve.aiPercent}%</div>
              <div className="mt-2">Perkiraan token terpakai: {metrics.serve.aiMessages * 120}</div>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <h2 className="font-heading font-semibold text-lg mb-3">Funnel Dapatkan</h2>
          {["Lead", "Cek cakupan", "Terjangkau", "Pilih paket", "Jadwal dibuat"].map((s, i) => {
            const widths = [100, 72, 58, 41, 30];
            return (
              <div key={s} className="flex items-center gap-3 mb-2">
                <div className="w-24 text-xs text-text-secondary text-right">{s}</div>
                <div className="flex-1 h-3 bg-canvas rounded">
                  <div className="h-3 bg-stage-acquire-fg rounded" style={{ width: `${widths[i]}%` }} />
                </div>
                <div className="w-10 text-xs font-semibold text-right">{widths[i]}%</div>
              </div>
            );
          })}
        </CardContent></Card>
      </div>
    </div>
  );
}
