"use client";
import { usePartner } from "@/hooks/usePartner";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/inbox", label: "Inbox" },
  { href: "/tickets", label: "Tiket" },
  { href: "/campaigns", label: "Kampanye" },
  { href: "/knowledge", label: "Pengetahuan" },
];

export default function AppHeader() {
  const { partners, partnerId, setPartnerId } = usePartner();
  const pathname = usePathname();
  return (
    <header className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="font-heading font-semibold text-lg">Seva<span className="text-accent">AI</span></Link>
        <nav className="hidden md:flex gap-6">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={pathname?.startsWith(n.href) ? "text-text-primary font-semibold" : "text-text-secondary"}>{n.label}</Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs bg-canvas border border-border rounded-full px-3 py-1 text-text-secondary flex items-center gap-1">
          <span>flask</span> Data demo
        </span>
        <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="border border-border rounded-control px-3 py-1.5 text-sm">
          {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
    </header>
  );
}
