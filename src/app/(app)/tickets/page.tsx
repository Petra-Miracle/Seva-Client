"use client";
import { useEffect, useState } from "react";
import { usePartner } from "@/hooks/usePartner";
import { api } from "@/lib/api";

export default function TicketsPage() {
  const { partnerId } = usePartner();
  const [tickets, setTickets] = useState<any[]>([]);
  useEffect(() => {
    if (!partnerId) return;
    api(`/api/tickets`).then(setTickets).catch(() => {});
  }, [partnerId]);
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold">Tiket Support</h1>
      <div className="bg-surface border border-border rounded-card overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-canvas">
            <tr>
              <th className="text-left p-3">No</th>
              <th className="text-left p-3">Pelanggan</th>
              <th className="text-left p-3">Kategori</th>
              <th className="text-left p-3">Prioritas</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="p-3">{t.id.slice(-6)}</td>
                <td className="p-3">{t.customer?.name}</td>
                <td className="p-3">{t.category}</td>
                <td className="p-3">{t.priority}</td>
                <td className="p-3">{t.status}</td>
              </tr>
            ))}
            {tickets.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-text-secondary">Belum ada tiket</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
