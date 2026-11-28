export const numberFormat = new Intl.NumberFormat("id-ID");

export const rupiah = (value: number | null | undefined) =>
  value == null ? "—" : `Rp${numberFormat.format(value)}`;

const relative = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });
const timeOnly = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" });
const dateShort = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });
const dateLong = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" });

/** "baru saja", "5 menit lalu", "09:41" (today), "12 Nov" (older). */
export function timeAgo(input?: string | Date | null) {
  if (!input) return "";
  const date = new Date(input);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 45) return "baru saja";
  if (diff < 3600) return relative.format(-Math.round(diff / 60), "minute");
  if (new Date().toDateString() === date.toDateString()) return timeOnly.format(date);
  if (diff < 7 * 86400) return relative.format(-Math.round(diff / 86400), "day");
  return dateShort.format(date);
}

export const clock = (input?: string | Date | null) => (input ? timeOnly.format(new Date(input)) : "");
export const fullDate = (input?: string | Date | null) => (input ? dateLong.format(new Date(input)) : "—");
export const shortDate = (input?: string | Date | null) => (input ? dateShort.format(new Date(input)) : "");

export const initials = (name?: string | null) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export type Tone = "accent" | "serve" | "retain" | "success" | "warning" | "danger" | "neutral" | "info";

export const STAGE: Record<string, { label: string; tone: Tone }> = {
  ACQUIRE: { label: "Dapatkan", tone: "accent" },
  SUPPORT: { label: "Layani", tone: "serve" },
  RETAIN: { label: "Pertahankan", tone: "retain" },
};

export const CONVERSATION_STATUS: Record<string, { label: string; tone: Tone }> = {
  BOT: { label: "Ditangani bot", tone: "neutral" },
  NEEDS_HUMAN: { label: "Perlu CS", tone: "warning" },
  HUMAN: { label: "Ditangani CS", tone: "accent" },
  CLOSED: { label: "Selesai", tone: "success" },
};

export const TICKET_STATUS: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "Terbuka", tone: "danger" },
  IN_PROGRESS: { label: "Diproses", tone: "warning" },
  RESOLVED: { label: "Selesai", tone: "success" },
  CLOSED: { label: "Ditutup", tone: "neutral" },
};

export const TICKET_PRIORITY: Record<string, { label: string; tone: Tone }> = {
  TINGGI: { label: "Tinggi", tone: "danger" },
  SEDANG: { label: "Sedang", tone: "warning" },
  RENDAH: { label: "Rendah", tone: "neutral" },
};

export const TICKET_CATEGORY: Record<string, string> = {
  GANGGUAN: "Gangguan",
  TAGIHAN: "Tagihan",
  INSTALASI: "Instalasi",
  LAINNYA: "Lainnya",
};

export const CAMPAIGN_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draf", tone: "neutral" },
  SCHEDULED: { label: "Terjadwal", tone: "info" },
  SENT: { label: "Terkirim", tone: "success" },
};

export const TEMPLATE_CATEGORY: Record<string, string> = {
  UTILITY: "Pengingat",
  MARKETING: "Penawaran",
};

export const SUBSCRIPTION_STATUS: Record<string, string> = {
  PENDING_INSTALL: "Menunggu pemasangan",
  ACTIVE: "Aktif",
  SUSPENDED: "Ditangguhkan",
  TERMINATED: "Berhenti",
};

export const INVOICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  UNPAID: { label: "Belum dibayar", tone: "warning" },
  PAID: { label: "Lunas", tone: "success" },
  OVERDUE: { label: "Terlambat", tone: "danger" },
};

export const LIFECYCLE: Record<string, string> = {
  LEAD: "Calon pelanggan",
  ACTIVE: "Pelanggan aktif",
  INACTIVE: "Pelanggan pasif",
  CHURNED: "Berhenti",
};

export const SENDER_LABEL: Record<string, string> = {
  CUSTOMER: "Pelanggan",
  BOT: "Bot",
  AI: "SevaAI",
  AGENT: "CS",
  SYSTEM: "Sistem",
};

/** Turn segment rule JSON into readable Indonesian. */
export function describeRules(rules: Record<string, unknown> | null | undefined) {
  if (!rules || typeof rules !== "object") return [];
  const out: string[] = [];
  const r = rules as Partial<Record<"invoiceStatus" | "lifecycleStage", string> & Record<"dueInDays" | "inactiveDays" | "packageSpeedMbpsLt" | "activeMonthsGte", number>>;
  if (r.invoiceStatus) out.push(`Tagihan ${INVOICE_STATUS[r.invoiceStatus]?.label.toLowerCase() ?? r.invoiceStatus}`);
  if (r.dueInDays) out.push(`Jatuh tempo ≤ ${r.dueInDays} hari`);
  if (r.lifecycleStage) out.push(LIFECYCLE[r.lifecycleStage] ?? r.lifecycleStage);
  if (r.inactiveDays) out.push(`Tidak aktif ≥ ${r.inactiveDays} hari`);
  if (r.packageSpeedMbpsLt) out.push(`Paket < ${r.packageSpeedMbpsLt} Mbps`);
  if (r.activeMonthsGte) out.push(`Berlangganan ≥ ${r.activeMonthsGte} bulan`);
  return out;
}
