"use client";
import { useEffect, useState } from "react";
import { usePartner } from "@/hooks/usePartner";
import { api } from "@/lib/api";

export default function CampaignsPage() {
  const { partnerId } = usePartner();
  const [segments, setSegments] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [segId, setSegId] = useState("");
  const [tplId, setTplId] = useState("");
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState<any>(null);

  const load = () => {
    if (!partnerId) return;
    api(`/api/segments?partnerId=${partnerId}`).then(setSegments).catch(() => {});
    api(`/api/templates?partnerId=${partnerId}`).then(setTemplates).catch(() => {});
    api(`/api/campaigns?partnerId=${partnerId}`).then(setCampaigns).catch(() => {});
  };
  useEffect(load, [partnerId]);

  const createSeg = async () => {
    const rules = { invoiceStatus: "UNPAID", dueInDays: 3 };
    await api("/api/segments", { method: "POST", body: JSON.stringify({ partnerId, name: "Tagihan jatuh tempo 3 hari", rules }) });
    load();
  };
  const preview = async (id: string) => {
    const r = await api(`/api/segments/${id}/preview`);
    alert(`${r.count} pelanggan cocok`);
  };

  const createCampaign = async () => {
    if (!segId || !tplId || !name) return;
    const c = await api("/api/campaigns", { method: "POST", body: JSON.stringify({ partnerId, segmentId: segId, templateId: tplId, name, goal }) });
    load();
    return c;
  };
  const run = async (id: string) => {
    const r = await api(`/api/campaigns/${id}/run`, { method: "POST" });
    setResult(r);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold">Kampanye</h1>

      <div className="bg-surface border border-border rounded-card p-4 space-y-3">
        <h2 className="font-semibold">Segmen</h2>
        {segments.map((s) => (
          <div key={s.id} className="flex items-center justify-between border border-border rounded-control p-2">
            <div>
              <div className="font-medium text-sm">{s.name}</div>
              <div className="text-xs text-text-secondary">{JSON.stringify(s.rules)}</div>
            </div>
            <button onClick={() => preview(s.id)} className="text-xs text-accent">Pratinjau</button>
          </div>
        ))}
        <button onClick={createSeg} className="px-3 py-1.5 bg-accent text-white rounded-control text-sm">Buat Segmen Demo</button>
      </div>

      <div className="bg-surface border border-border rounded-card p-4 space-y-3">
        <h2 className="font-semibold">Buat Kampanye</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kampanye" className="w-full border border-border rounded-control px-3 py-2 text-sm" />
        <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Tujuan" className="w-full border border-border rounded-control px-3 py-2 text-sm" />
        <select value={segId} onChange={(e) => setSegId(e.target.value)} className="w-full border border-border rounded-control px-3 py-2 text-sm">
          <option value="">Pilih segmen</option>
          {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={tplId} onChange={(e) => setTplId(e.target.value)} className="w-full border border-border rounded-control px-3 py-2 text-sm">
          <option value="">Pilih template</option>
          {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button onClick={createCampaign} className="px-4 py-2 bg-accent text-white rounded-control text-sm">Simpan Kampanye</button>
      </div>

      <div className="bg-surface border border-border rounded-card p-4 space-y-3">
        <h2 className="font-semibold">Daftar Kampanye</h2>
        {campaigns.map((c) => (
          <div key={c.id} className="border border-border rounded-control p-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{c.name}</div>
              <div className="text-xs text-text-secondary">{c.status} · {c.segment?.name} · {c.template?.name}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => run(c.id)} className="px-3 py-1.5 bg-accent text-white rounded-control text-xs">Jalankan sekarang</button>
            </div>
          </div>
        ))}
      </div>

      {result && <div className="bg-success-bg text-success-fg rounded-control p-3 text-sm">Terkirim {result.sent} dari {result.total}. Dilewati {result.skipped}.</div>}
    </div>
  );
}
