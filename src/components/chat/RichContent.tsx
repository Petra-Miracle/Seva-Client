"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { CalendarClock, Check, CircleSlash, Gauge, Image as ImageIcon, MapPin, Mic, Receipt, Wrench } from "lucide-react";
import Pill from "@/components/ui/Pill";
import { fullDate, INVOICE_STATUS, rupiah, TICKET_CATEGORY, TICKET_STATUS } from "@/lib/format";

export type ChatMessage = {
  id: string;
  sender: string;
  type: string;
  content: string;
  payload?: unknown;
  usedAi?: boolean;
  createdAt?: string;
};

/** A button press the customer can make: `button` is routed by the bot, `label` is what the chat shows. */
export type ChatAction = { button: string; label: string };

type Area = { id: string; city: string; district: string; village: string; isCovered: boolean };
type Pkg = { id: string; name: string; speedMbps: number; monthlyPrice: number; installFee: number };
type Payload = {
  buttons?: string[];
  areas?: Area[];
  packages?: Pkg[];
  slots?: boolean;
  invoice?: { period: string; amount: number; dueDate: string; status: string };
  package?: { name: string };
  ticket?: { id: string; category: string; status: string; priority?: string };
};

const payloadOf = (message: ChatMessage) => (message.payload && typeof message.payload === "object" ? message.payload : {}) as Payload;

function SlotCard({ interactive, disabled, onAction }: { interactive: boolean; disabled?: boolean; onAction?: (action: ChatAction) => void }) {
  // The backend books the slot three days ahead (morning); show that date.
  const [date] = useState(() => new Date(Date.now() + 3 * 86400000));
  return (
    <div className="min-w-[220px]">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
        <CalendarClock className="size-3.5" /> Jadwal pemasangan
      </p>
      <div className="rounded-xl border border-accent/30 bg-accent-soft/50 p-3">
        <p className="text-sm font-semibold text-text-primary">{fullDate(date)}</p>
        <p className="text-xs text-text-secondary">Pagi · 08.00–11.00</p>
      </div>
      {interactive && (
        <Button size="sm" variant="primary" className="mt-3 w-full" isDisabled={disabled} onPress={() => onAction?.({ button: "confirm_order", label: "Konfirmasi jadwal pemasangan" })}>
          Konfirmasi jadwal
        </Button>
      )}
    </div>
  );
}

const BUTTON_IDS: Record<string, string> = {
  "cek cakupan": "cek_cakupan",
  "lihat paket": "lihat_paket",
  kembali: "menu",
  menu: "menu",
  "cek tagihan": "cek_tagihan",
};

const toButtonId = (label: string) =>
  BUTTON_IDS[label.trim().toLowerCase()] ?? label.trim().toLowerCase().replace(/\s+/g, "_");

/** True when the message carries structured content worth rendering as more than text. */
export function isRich(message: ChatMessage) {
  const p = payloadOf(message);
  return (
    (message.type === "BUTTONS" && Array.isArray(p.buttons)) ||
    (message.type === "CARD" && (p.areas || p.packages || p.slots || p.invoice || p.ticket)) ||
    (message.sender === "CUSTOMER" && (message.type === "IMAGE" || message.type === "AUDIO"))
  );
}

/**
 * Renders BUTTONS / CARD payloads from the bot flows.
 * With `onAction` the buttons are live (customer simulator); without it they are read-only (CS inbox).
 */
export default function RichContent({
  message,
  onAction,
  disabled,
}: {
  message: ChatMessage;
  onAction?: (action: ChatAction) => void;
  disabled?: boolean;
}) {
  const p = payloadOf(message);
  const interactive = Boolean(onAction);

  if (message.sender === "CUSTOMER" && (message.type === "IMAGE" || message.type === "AUDIO")) {
    const isImage = message.type === "IMAGE";
    return (
      <span className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-white/15">
          {isImage ? <ImageIcon className="size-4" /> : <Mic className="size-4" />}
        </span>
        <span>
          <span className="block font-medium">{isImage ? "Foto terkirim" : "Voice note terkirim"}</span>
          <span className="block text-xs opacity-70">Diproses sementara, tidak disimpan</span>
        </span>
      </span>
    );
  }

  if (message.type === "BUTTONS" && Array.isArray(p.buttons)) {
    return (
      <div>
        <p>{message.content}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.buttons.map((label) =>
            interactive ? (
              <Button
                key={label}
                size="sm"
                variant="secondary"
                isDisabled={disabled}
                onPress={() => onAction?.({ button: toButtonId(label), label })}
                className="rounded-full border border-accent/25 bg-white font-semibold text-accent hover:bg-accent-soft"
              >
                {label}
              </Button>
            ) : (
              <span key={label} className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-text-secondary">
                {label}
              </span>
            ),
          )}
        </div>
      </div>
    );
  }

  if (p.areas) {
    const areas = p.areas;
    return (
      <div className="min-w-[220px]">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
          <MapPin className="size-3.5" /> Area layanan
        </p>
        <ul className="space-y-1.5">
          {areas.slice(0, 8).map((area) => (
            <li key={area.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-secondary px-2.5 py-1.5 text-[13px]">
              <span className="min-w-0 truncate">
                {area.village}
                <span className="text-text-secondary">, {area.district}</span>
              </span>
              {area.isCovered ? <Check className="size-4 shrink-0 text-success-fg" /> : <CircleSlash className="size-4 shrink-0 text-text-secondary" />}
            </li>
          ))}
        </ul>
        {areas.length === 0 && <p className="text-sm text-text-secondary">Belum ada data area.</p>}
        {interactive && (
          <Button size="sm" variant="primary" className="mt-3 w-full" isDisabled={disabled} onPress={() => onAction?.({ button: "lihat_paket", label: "Lihat paket" })}>
            Lihat paket
          </Button>
        )}
      </div>
    );
  }

  if (p.packages) {
    const packages = p.packages;
    return (
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-secondary">Pilihan paket</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {packages.map((pkg, index) => (
            <div key={pkg.id} className={`relative rounded-xl border p-3 ${index === 1 ? "border-accent/40 bg-accent-soft/40" : "border-border bg-white"}`}>
              {index === 1 && <span className="absolute -top-2 right-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">Populer</span>}
              <p className="font-heading text-sm font-semibold text-text-primary">{pkg.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                <Gauge className="size-3.5" /> {pkg.speedMbps} Mbps
              </p>
              <p className="mt-2 font-heading text-base font-semibold text-accent">
                {rupiah(pkg.monthlyPrice)}
                <span className="text-xs font-medium text-text-secondary">/bln</span>
              </p>
              <p className="text-[11px] text-text-secondary">Pasang {rupiah(pkg.installFee)}</p>
              {interactive && (
                <Button
                  size="sm"
                  variant={index === 1 ? "primary" : "secondary"}
                  className="mt-2.5 w-full"
                  isDisabled={disabled}
                  onPress={() => onAction?.({ button: `select_pkg_${pkg.id}`, label: `Saya pilih ${pkg.name} (${pkg.speedMbps} Mbps)` })}
                >
                  Pilih
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (p.slots) {
    return <SlotCard interactive={interactive} disabled={disabled} onAction={onAction} />;
  }

  if (p.invoice) {
    const status = INVOICE_STATUS[p.invoice.status] ?? { label: p.invoice.status, tone: "neutral" as const };
    return (
      <div className="min-w-[230px]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
            <Receipt className="size-3.5" /> Tagihan {p.invoice.period}
          </p>
          <Pill tone={status.tone} size="xs">{status.label}</Pill>
        </div>
        <p className="font-heading text-2xl font-semibold text-text-primary">{rupiah(p.invoice.amount)}</p>
        <p className="mt-1 text-xs text-text-secondary">
          {p.package?.name ? `${p.package.name} · ` : ""}Jatuh tempo {fullDate(p.invoice.dueDate)}
        </p>
      </div>
    );
  }

  if (p.ticket) {
    const status = TICKET_STATUS[p.ticket.status] ?? { label: p.ticket.status, tone: "neutral" as const };
    return (
      <div className="min-w-[220px]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
            <Wrench className="size-3.5" /> Tiket dibuat
          </p>
          <Pill tone={status.tone} size="xs">{status.label}</Pill>
        </div>
        <p className="font-heading text-lg font-semibold text-text-primary">#{String(p.ticket.id).slice(-6).toUpperCase()}</p>
        <p className="text-xs text-text-secondary">
          {TICKET_CATEGORY[p.ticket.category] ?? p.ticket.category} · prioritas {String(p.ticket.priority || "").toLowerCase()}
        </p>
      </div>
    );
  }

  return <p className="whitespace-pre-wrap">{message.content}</p>;
}
