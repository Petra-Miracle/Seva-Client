"use client";
import { useEffect, useState } from "react";
import { usePartner } from "@/hooks/usePartner";
import { api } from "@/lib/api";

export default function InboxPage() {
  const { partnerId } = usePartner();
  const [convs, setConvs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = () => {
    if (!partnerId) return;
    api(`/api/conversations?partnerId=${partnerId}${statusFilter ? `&status=${statusFilter}` : ""}`).then(setConvs).catch(() => {});
  };
  useEffect(load, [partnerId, statusFilter]);

  const open = (id: string) => {
    setSelected(id);
    api(`/api/conversations/${id}`).then(setDetail).catch(() => {});
  };

  const takeover = async () => {
    if (!selected) return;
    await api(`/api/conversations/${selected}/takeover`, { method: "POST", body: JSON.stringify({}) });
    open(selected);
  };
  const returnToBot = async () => {
    if (!selected) return;
    await api(`/api/conversations/${selected}/return-to-bot`, { method: "POST" });
    open(selected);
  };
  const reply = async (content: string) => {
    if (!selected) return;
    await api(`/api/conversations/${selected}/reply`, { method: "POST", body: JSON.stringify({ content }) });
    open(selected);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      <div className="w-80 bg-surface border border-border rounded-card flex flex-col">
        <div className="p-3 border-b border-border flex gap-2 flex-wrap">
          {["", "BOT", "NEEDS_HUMAN", "HUMAN", "CLOSED"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 rounded-full text-xs border ${statusFilter === s ? "bg-accent text-white border-accent" : "border-border"}`}>{s || "Semua"}</button>
          ))}
        </div>
        <div className="flex-1 overflow-auto">
          {convs.map((c) => (
            <button key={c.id} onClick={() => open(c.id)} className={`w-full text-left p-3 border-b border-border ${selected === c.id ? "bg-accent-soft" : ""}`}>
              <div className="font-semibold text-sm">{c.customer?.name}</div>
              <div className="text-xs text-text-secondary">{c.status} · {c.stage}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 bg-surface border border-border rounded-card flex flex-col">
        {detail ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-semibold">{detail.customer?.name}</div>
                <div className="text-xs text-text-secondary">{detail.status} · {detail.stage} {detail.handoffReason && `· ${detail.handoffReason}`}</div>
              </div>
              <div className="flex gap-2">
                {detail.status !== "HUMAN" && <button onClick={takeover} className="px-3 py-1.5 bg-accent text-white rounded-control text-sm">Ambil Alih</button>}
                {detail.status === "HUMAN" && <button onClick={returnToBot} className="px-3 py-1.5 border border-border rounded-control text-sm">Kembalikan ke Bot</button>}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {detail.messages?.map((m: any) => (
                <div key={m.id} className={`text-sm ${m.sender === "CUSTOMER" ? "text-right" : ""}`}>
                  <span className="text-xs text-text-secondary">{m.sender === "AI" ? "AI" : m.sender === "BOT" ? "Bot" : m.sender === "AGENT" ? "CS" : m.sender}</span>
                  <div className={`inline-block px-3 py-2 rounded-bubble ${m.sender === "CUSTOMER" ? "bg-chat-customer" : "bg-canvas"}`}>{m.content}</div>
                </div>
              ))}
            </div>
            {detail.status === "HUMAN" && (
              <ReplyBox onSend={reply} />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-secondary">Pilih percakapan</div>
        )}
      </div>
    </div>
  );
}

function ReplyBox({ onSend }: { onSend: (c: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="p-3 border-t border-border flex gap-2">
      <input value={val} onChange={(e) => setVal(e.target.value)} className="flex-1 border border-border rounded-control px-3 py-2 text-sm" placeholder="Tulis balasan..." />
      <button onClick={() => { if (val.trim()) { onSend(val); setVal(""); } }} className="px-4 py-2 bg-accent text-white rounded-control text-sm">Kirim</button>
    </div>
  );
}
