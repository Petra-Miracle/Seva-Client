"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, Button, Input, Spinner, toast } from "@heroui/react";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CornerDownLeft,
  Hand,
  Inbox as InboxIcon,
  MapPin,
  MessageSquareDashed,
  Phone,
  Search,
  SendHorizontal,
  Sparkles,
  Ticket,
  UserRound,
} from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { useInterval } from "@/hooks/useInterval";
import { api, errorMessage } from "@/lib/api";
import {
  clock,
  CONVERSATION_STATUS,
  fullDate,
  initials,
  INVOICE_STATUS,
  LIFECYCLE,
  rupiah,
  SENDER_LABEL,
  STAGE,
  SUBSCRIPTION_STATUS,
  timeAgo,
} from "@/lib/format";
import Pill from "@/components/ui/Pill";
import { SegmentedControl } from "@/components/ui/motion";
import { EmptyState, ErrorBanner, SkeletonRows } from "@/components/ui/States";
import RichContent, { isRich, type ChatMessage } from "@/components/chat/RichContent";

type Customer = {
  id: string;
  name: string;
  phone: string;
  village?: string | null;
  lifecycleStage: string;
  marketingOptIn: boolean;
  subscriptions?: {
    id: string;
    status: string;
    package?: { name: string; speedMbps: number; monthlyPrice: number };
    invoices?: { id: string; amount: number; dueDate: string; status: string; period: string }[];
  }[];
  _count?: { tickets: number };
};

type Conversation = {
  id: string;
  status: string;
  stage: string;
  handoffReason?: string | null;
  createdAt: string;
  customer?: Customer;
  messages?: ChatMessage[];
};

type Filter = "ALL" | "NEEDS_HUMAN" | "HUMAN" | "BOT" | "CLOSED";

const avatarTone = ["bg-accent-soft text-accent-strong", "bg-stage-serve-bg text-stage-serve-fg", "bg-stage-retain-bg text-stage-retain-fg", "bg-warning-bg text-warning-fg"];
const toneFor = (id: string) => avatarTone[id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % avatarTone.length];

function CustomerAvatar({ customer, size = "md" }: { customer?: Customer; size?: "sm" | "md" }) {
  return (
    <Avatar size={size} className={`shrink-0 ${toneFor(customer?.id || "x")}`}>
      <AvatarFallback className="text-xs font-bold">{initials(customer?.name)}</AvatarFallback>
    </Avatar>
  );
}

function ProfileRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 text-text-secondary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-text-primary">{value}</div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const fromCustomer = message.sender === "CUSTOMER";
  const isSystem = message.sender === "SYSTEM";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="max-w-[85%] rounded-xl border border-dashed border-border bg-surface-secondary px-3 py-1.5 text-center text-xs text-text-secondary">
          {message.content}
        </span>
      </div>
    );
  }

  const tone =
    message.sender === "AGENT"
      ? "bg-ink text-white"
      : message.sender === "AI"
        ? "bg-accent-soft text-text-primary ring-1 ring-inset ring-accent/15"
        : fromCustomer
          ? "bg-white text-text-primary ring-1 ring-inset ring-border"
          : "bg-surface-tertiary text-text-primary";

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex ${fromCustomer ? "justify-start" : "justify-end"}`}
    >
      <div className={`max-w-[78%] ${fromCustomer ? "" : "text-right"}`}>
        <p className={`mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-text-secondary ${fromCustomer ? "" : "justify-end"}`}>
          {message.sender === "AI" && <Sparkles className="size-3 text-accent" />}
          {message.sender === "BOT" && <Bot className="size-3" />}
          {SENDER_LABEL[message.sender] ?? message.sender}
          {message.createdAt && <span className="font-normal opacity-70">· {clock(message.createdAt)}</span>}
        </p>
        <div
          className={`inline-block rounded-bubble px-4 py-2.5 text-left text-sm leading-6 shadow-[0_1px_2px_rgba(16,45,49,0.05)] ${tone} ${
            fromCustomer ? "rounded-tl-md" : "rounded-tr-md"
          }`}
        >
          {isRich(message) ? <RichContent message={message} /> : <p className="whitespace-pre-wrap">{message.content}</p>}
        </div>
      </div>
    </motion.div>
  );
}

// Keyed by partner so switching partners starts from a clean state.
export default function InboxPage() {
  const { partnerId } = usePartner();
  return <Inbox key={partnerId} partnerId={partnerId} />;
}

function Inbox({ partnerId }: { partnerId: string }) {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Conversation | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<null | "takeover" | "return" | "reply">(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const loadList = useCallback(() => {
    if (!partnerId) return;
    api<Conversation[]>(`/api/conversations?partnerId=${encodeURIComponent(partnerId)}`)
      .then((rows) => {
        setConversations(rows);
        setListError(null);
      })
      .catch((cause) => setListError(errorMessage(cause, "Percakapan gagal dimuat.")));
  }, [partnerId]);

  // Ignore responses for a conversation that is no longer selected.
  const selectedIdRef = useRef<string | null>(null);
  const loadDetail = useCallback((id: string) => {
    api<Conversation>(`/api/conversations/${id}`)
      .then((row) => {
        if (selectedIdRef.current === id) setDetail(row);
      })
      .catch(() => {});
  }, []);

  const select = (id: string | null) => {
    selectedIdRef.current = id;
    setSelectedId(id);
  };

  useEffect(loadList, [loadList]);

  useInterval(loadList, 8000);
  useInterval(() => selectedId && loadDetail(selectedId), selectedId ? 4000 : null);

  // Keep the newest message in view when new ones arrive.
  useEffect(() => {
    const count = detail?.messages?.length ?? 0;
    if (count !== lastCount.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: lastCount.current ? "smooth" : "auto" });
      lastCount.current = count;
    }
  }, [detail]);

  const open = (id: string) => {
    select(id);
    lastCount.current = 0;
    const summary = conversations?.find((c) => c.id === id);
    setDetail(summary ? { ...summary, messages: undefined } : null);
    loadDetail(id);
  };

  const counts = useMemo(() => {
    const base = { ALL: 0, NEEDS_HUMAN: 0, HUMAN: 0, BOT: 0, CLOSED: 0 } as Record<Filter, number>;
    for (const c of conversations ?? []) {
      base.ALL += 1;
      if (c.status in base) base[c.status as Filter] += 1;
    }
    return base;
  }, [conversations]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (conversations ?? [])
      .filter((c) => filter === "ALL" || c.status === filter)
      .filter((c) => !q || c.customer?.name?.toLowerCase().includes(q) || c.customer?.phone?.includes(q) || c.messages?.[0]?.content?.toLowerCase().includes(q))
      .sort((a, b) => {
        // Waiting-for-CS first, then newest activity.
        const urgent = Number(b.status === "NEEDS_HUMAN") - Number(a.status === "NEEDS_HUMAN");
        if (urgent) return urgent;
        const at = (c: Conversation) => new Date(c.messages?.[0]?.createdAt || c.createdAt).getTime();
        return at(b) - at(a);
      });
  }, [conversations, filter, query]);

  const act = async (kind: "takeover" | "return") => {
    if (!selectedId) return;
    setBusy(kind);
    try {
      await api(`/api/conversations/${selectedId}/${kind === "takeover" ? "takeover" : "return-to-bot"}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      toast.success(kind === "takeover" ? "Percakapan diambil alih" : "Percakapan dikembalikan ke bot", {
        description: kind === "takeover" ? "Bot berhenti membalas. Anda bisa membalas pelanggan sekarang." : "Bot akan melanjutkan percakapan.",
      });
      loadDetail(selectedId);
      loadList();
    } catch (cause) {
      toast.danger("Aksi gagal", { description: errorMessage(cause, "Coba lagi sebentar.") });
    } finally {
      setBusy(null);
    }
  };

  const sendReply = async () => {
    const content = reply.trim();
    if (!selectedId || !content) return;
    setBusy("reply");
    try {
      await api(`/api/conversations/${selectedId}/reply`, { method: "POST", body: JSON.stringify({ content }) });
      setReply("");
      loadDetail(selectedId);
      loadList();
    } catch (cause) {
      toast.danger("Balasan gagal dikirim", { description: errorMessage(cause, "Coba lagi sebentar.") });
    } finally {
      setBusy(null);
    }
  };

  const customer = detail?.customer;
  const subscription = customer?.subscriptions?.[0];
  const invoice = subscription?.invoices?.[0];
  const status = detail ? CONVERSATION_STATUS[detail.status] : null;
  const stage = detail ? STAGE[detail.stage] : null;

  return (
    <div className="grid h-[calc(100dvh-7rem)] min-h-[560px] gap-4 lg:h-[calc(100dvh-4rem)] lg:grid-cols-[340px_1fr] 2xl:grid-cols-[360px_1fr_300px]">
      {/* Conversation list */}
      <section
        className={`flex min-h-0 flex-col overflow-hidden rounded-card border border-border/80 bg-surface shadow-soft ${selectedId ? "hidden lg:flex" : "flex"}`}
      >
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-lg font-semibold">Inbox</h1>
              <p className="text-xs text-text-secondary">{counts.ALL} percakapan · diperbarui otomatis</p>
            </div>
            {counts.NEEDS_HUMAN > 0 && (
              <Pill tone="warning" dot pulse>
                {counts.NEEDS_HUMAN} menunggu
              </Pill>
            )}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-text-secondary" />
            <Input
              aria-label="Cari percakapan"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, nomor, atau pesan…"
              className="w-full pl-9"
            />
          </div>
          <SegmentedControl<Filter>
            id="inbox-filter"
            size="sm"
            ariaLabel="Filter status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "ALL", label: "Semua", count: counts.ALL },
              { value: "NEEDS_HUMAN", label: "Perlu CS", count: counts.NEEDS_HUMAN },
              { value: "HUMAN", label: "Ditangani CS", count: counts.HUMAN },
              { value: "BOT", label: "Bot", count: counts.BOT },
              { value: "CLOSED", label: "Selesai", count: counts.CLOSED },
            ]}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {listError && <div className="p-2"><ErrorBanner message={listError} onRetry={loadList} /></div>}
          {!conversations && !listError && <SkeletonRows rows={6} className="p-3" />}
          {conversations && visible.length === 0 && (
            <EmptyState
              icon={<InboxIcon className="size-6" />}
              title={query || filter !== "ALL" ? "Tidak ada yang cocok" : "Inbox masih kosong"}
              description={query || filter !== "ALL" ? "Ubah kata kunci atau filter status." : "Percakapan dari Simulator akan muncul di sini."}
              action={!query && filter === "ALL" ? <Link href="/chat" className="text-sm font-semibold text-accent hover:underline">Buka Simulator →</Link> : undefined}
            />
          )}
          <AnimatePresence initial={false}>
            {visible.map((c) => {
              const active = selectedId === c.id;
              const last = c.messages?.[0];
              const s = CONVERSATION_STATUS[c.status];
              const st = STAGE[c.stage];
              return (
                <motion.button
                  layout
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  type="button"
                  onClick={() => open(c.id)}
                  className={`relative mb-1 flex w-full items-start gap-3 rounded-xl p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    active ? "bg-accent-soft/70" : "hover:bg-surface-secondary"
                  }`}
                >
                  {c.status === "NEEDS_HUMAN" && <span className="absolute inset-y-3 left-0 w-1 rounded-full bg-warning" />}
                  <CustomerAvatar customer={c.customer} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-text-primary">{c.customer?.name ?? "Pelanggan"}</span>
                      <span className="shrink-0 text-[11px] text-text-secondary">{timeAgo(last?.createdAt || c.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">
                      {last ? `${last.sender === "CUSTOMER" ? "" : `${SENDER_LABEL[last.sender] ?? last.sender}: `}${last.content}` : "Belum ada pesan"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {st && <Pill tone={st.tone} size="xs">{st.label}</Pill>}
                      {s && <Pill tone={s.tone} size="xs" dot={c.status === "NEEDS_HUMAN"}>{s.label}</Pill>}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* Conversation detail */}
      <section className={`min-h-0 flex-col overflow-hidden rounded-card border border-border/80 bg-surface shadow-soft ${selectedId ? "flex" : "hidden lg:flex"}`}>
        {!selectedId || !detail ? (
          <EmptyState
            className="my-auto"
            icon={<MessageSquareDashed className="size-6" />}
            title="Pilih percakapan"
            description="Percakapan yang perlu CS ditandai oranye dan selalu tampil paling atas."
          />
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Button isIconOnly size="sm" variant="ghost" aria-label="Kembali ke daftar" className="lg:hidden" onPress={() => select(null)}>
                  <ArrowLeft className="size-4" />
                </Button>
                <CustomerAvatar customer={customer} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text-primary">{customer?.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {stage && <Pill tone={stage.tone} size="xs">{stage.label}</Pill>}
                    {status && <Pill tone={status.tone} size="xs" dot>{status.label}</Pill>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {detail.status === "HUMAN" ? (
                  <Button size="sm" variant="secondary" onPress={() => act("return")} isDisabled={busy !== null}>
                    {busy === "return" ? <Spinner size="sm" color="current" /> : <Bot className="size-4" />}
                    Kembalikan ke bot
                  </Button>
                ) : (
                  <Button size="sm" variant="primary" onPress={() => act("takeover")} isDisabled={busy !== null}>
                    {busy === "takeover" ? <Spinner size="sm" color="current" /> : <Hand className="size-4" />}
                    Ambil alih
                  </Button>
                )}
              </div>
            </header>

            <AnimatePresence>
              {detail.handoffReason && detail.status !== "BOT" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mx-4 mt-3 flex items-start gap-3 rounded-xl border border-warning-fg/15 bg-warning-bg/80 px-4 py-3 md:mx-5">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-fg" />
                    <div className="text-sm">
                      <p className="font-semibold text-warning-fg">Bot menyerahkan percakapan ini</p>
                      <p className="text-text-secondary">Alasan: {detail.handoffReason}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={scrollRef} className="dot-grid min-h-0 flex-1 space-y-4 overflow-y-auto bg-surface-secondary/50 px-4 py-5 md:px-6">
              {!detail.messages && <SkeletonRows rows={4} />}
              {detail.messages?.length === 0 && <p className="py-10 text-center text-sm text-text-secondary">Belum ada pesan.</p>}
              {detail.messages?.map((message) => <MessageBubble key={message.id} message={message} />)}
            </div>

            {detail.status === "HUMAN" ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendReply();
                }}
                className="flex items-center gap-2 border-t border-border p-3"
              >
                <Input
                  aria-label="Balasan untuk pelanggan"
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Tulis balasan untuk pelanggan…"
                  className="min-w-0 flex-1"
                />
                <Button type="submit" variant="primary" isDisabled={busy === "reply" || !reply.trim()}>
                  {busy === "reply" ? <Spinner size="sm" color="current" /> : <SendHorizontal className="size-4" />}
                  <span className="hidden sm:inline">Kirim</span>
                </Button>
              </form>
            ) : (
              <div className="flex items-center justify-center gap-2 border-t border-border p-3.5 text-sm text-text-secondary">
                <CornerDownLeft className="size-4" />
                Ambil alih percakapan untuk membalas pelanggan.
              </div>
            )}
          </>
        )}
      </section>

      {/* Customer profile */}
      <aside className="hidden min-h-0 overflow-y-auto rounded-card border border-border/80 bg-surface shadow-soft 2xl:block">
        {customer ? (
          <motion.div key={customer.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="p-5">
            <div className="flex flex-col items-center border-b border-border pb-5 text-center">
              <Avatar size="lg" className={toneFor(customer.id)}>
                <AvatarFallback className="text-base font-bold">{initials(customer.name)}</AvatarFallback>
              </Avatar>
              <p className="mt-3 font-heading text-base font-semibold">{customer.name}</p>
              <p className="text-xs text-text-secondary">{LIFECYCLE[customer.lifecycleStage] ?? customer.lifecycleStage}</p>
            </div>
            <div className="divide-y divide-border/70">
              <ProfileRow icon={<Phone className="size-4" />} label="Nomor HP" value={customer.phone} />
              {customer.village && <ProfileRow icon={<MapPin className="size-4" />} label="Desa" value={customer.village} />}
              <ProfileRow
                icon={<UserRound className="size-4" />}
                label="Paket"
                value={
                  subscription?.package ? (
                    <>
                      {subscription.package.name} · {subscription.package.speedMbps} Mbps
                      <span className="block text-xs font-normal text-text-secondary">
                        {SUBSCRIPTION_STATUS[subscription.status] ?? subscription.status} · {rupiah(subscription.package.monthlyPrice)}/bln
                      </span>
                    </>
                  ) : (
                    <span className="text-text-secondary">Belum berlangganan</span>
                  )
                }
              />
              <ProfileRow
                icon={<CornerDownLeft className="size-4 rotate-180" />}
                label="Tagihan terakhir"
                value={
                  invoice ? (
                    <span className="flex flex-wrap items-center gap-2">
                      {rupiah(invoice.amount)}
                      <Pill tone={INVOICE_STATUS[invoice.status]?.tone ?? "neutral"} size="xs">
                        {INVOICE_STATUS[invoice.status]?.label ?? invoice.status}
                      </Pill>
                      <span className="block w-full text-xs font-normal text-text-secondary">Jatuh tempo {fullDate(invoice.dueDate)}</span>
                    </span>
                  ) : (
                    <span className="text-text-secondary">Tidak ada</span>
                  )
                }
              />
              <ProfileRow
                icon={<Ticket className="size-4" />}
                label="Tiket terbuka"
                value={
                  <Link href="/tickets" className="text-accent hover:underline">
                    {customer._count?.tickets ?? 0} tiket
                  </Link>
                }
              />
              <ProfileRow
                icon={<Sparkles className="size-4" />}
                label="Opt-in promosi"
                value={<Pill tone={customer.marketingOptIn ? "success" : "neutral"} size="xs">{customer.marketingOptIn ? "Bersedia" : "Tidak bersedia"}</Pill>}
              />
            </div>
          </motion.div>
        ) : (
          <EmptyState className="h-full" icon={<UserRound className="size-6" />} title="Profil pelanggan" description="Detail pelanggan tampil saat percakapan dipilih." />
        )}
      </aside>
    </div>
  );
}
