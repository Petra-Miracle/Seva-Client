"use client";
import { useEffect, useState } from "react";
import { usePartner } from "@/hooks/usePartner";
import { api } from "@/lib/api";

export default function KnowledgePage() {
  const { partnerId } = usePartner();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [tab, setTab] = useState("faq");

  useEffect(() => {
    if (!partnerId) return;
    api(`/api/knowledge/faq?partnerId=${partnerId}`).then(setFaqs).catch(() => {});
    api(`/api/knowledge/packages?partnerId=${partnerId}`).then(setPackages).catch(() => {});
  }, [partnerId]);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold">Pengetahuan</h1>
      <div className="flex gap-2">
        <button onClick={() => setTab("faq")} className={`px-3 py-1.5 rounded-control text-sm ${tab === "faq" ? "bg-accent text-white" : "border border-border"}`}>FAQ</button>
        <button onClick={() => setTab("pkg")} className={`px-3 py-1.5 rounded-control text-sm ${tab === "pkg" ? "bg-accent text-white" : "border border-border"}`}>Katalog Paket</button>
      </div>
      {tab === "faq" && (
        <div className="space-y-2">
          {faqs.map((f) => (
            <div key={f.id} className="bg-surface border border-border rounded-card p-3">
              <div className="text-xs text-accent font-semibold">{f.category}</div>
              <div className="font-medium text-sm">{f.question}</div>
              <div className="text-xs text-text-secondary">{f.answer}</div>
            </div>
          ))}
        </div>
      )}
      {tab === "pkg" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map((p) => (
            <div key={p.id} className="bg-surface border border-border rounded-card p-4">
              <div className="font-heading font-semibold">{p.name}</div>
              <div className="text-2xl font-heading font-semibold mt-2">Rp{p.monthlyPrice.toLocaleString("id-ID")}/bln</div>
              <div className="text-xs text-text-secondary mt-1">{p.speedMbps} Mbps · Biaya pasang Rp{p.installFee.toLocaleString("id-ID")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
