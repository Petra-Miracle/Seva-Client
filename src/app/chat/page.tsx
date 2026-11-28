"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, Button, Input, Spinner } from "@heroui/react";
import {
  ArrowLeft,
  ArrowUp,
  Bot,
  Check,
  CircleHelp,
  Headset,
  Mic,
  Paperclip,
  Plus,
  ReceiptText,
  RefreshCw,
  Rocket,
  SlidersHorizontal,
  Sparkles,
  Square,
  UserRound,
  Wifi,
  X,
} from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { useInterval } from "@/hooks/useInterval";
import { api, errorMessage, isAbort } from "@/lib/api";
import { clock, CONVERSATION_STATUS } from "@/lib/format";
import { Logo } from "@/components/layout/Logo";
import AppSelect from "@/components/ui/AppSelect";
import Pill from "@/components/ui/Pill";
import RichContent, { isRich, type ChatAction, type ChatMessage } from "@/components/chat/RichContent";

const profiles = [
  { id: "baru", label: "Pelanggan baru", hint: "Belum berlangganan" },
  { id: "aktif", label: "Pelanggan aktif", hint: "Punya paket & tagihan" },
  { id: "pasif", label: "Pelanggan pasif", hint: "Lama tidak aktif" },
];

type Suggestion = { label: string; detail: string; icon: React.ReactNode; tone: string; send?: string; action?: ChatAction };

const suggestions: Suggestion[] = [
  { label: "Pasang internet baru", detail: "Cek cakupan & pilih paket", icon: <Rocket className="size-5" />, tone: "bg-accent-soft text-accent", action: { button: "menu", label: "Saya mau pasang internet baru" } },
  { label: "Cek tagihan", detail: "Lihat tagihan terbaru", icon: <ReceiptText className="size-5" />, tone: "bg-stage-serve-bg text-stage-serve-fg", send: "Cek tagihan saya" },
  { label: "Lapor gangguan", detail: "Internet lambat atau mati", icon: <Wifi className="size-5" />, tone: "bg-warning-bg text-warning-fg", send: "Internet saya gangguan, tidak bisa connect" },
  { label: "Tanya lainnya", detail: "Tulis pertanyaan sendiri", icon: <CircleHelp className="size-5" />, tone: "bg-stage-retain-bg text-stage-retain-fg" },
];

function TypingDots() {
  return (
    <span className="flex items-center gap-1" aria-label="SevaAI sedang mengetik">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-accent"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function BotAvatar({ sender }: { sender: string }) {
  if (sender === "AGENT") {
    return (
      <Avatar size="sm" className="mb-5 shrink-0 bg-ink text-white">
        <AvatarFallback><Headset className="size-4" /></AvatarFallback>
      </Avatar>
    );
  }
  return (
    <Avatar size="sm" className="mb-5 shrink-0 bg-gradient-to-br from-mint to-mint-strong text-ink">
      <AvatarFallback>{sender === "AI" ? <Sparkles className="size-4" /> : <Bot className="size-4" />}</AvatarFallback>
    </Avatar>
  );
}

export default function ChatPage() {
  const { partnerId } = usePartner();
  return <Chat key={partnerId} />;
}

const nowIso = () => new Date().toISOString();

function Chat() {
  const { partnerId, setPartnerId, partners, loading: partnersLoading, error: partnerError, reload: reloadPartners } = usePartner();
  const [session, setSession] = useState<{ partnerId: string; id: string } | null>(null);
  const [sessionFailure, setSessionFailure] = useState<{ partnerId: string; message: string } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("BOT");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState("baru");
  const [recording, setRecording] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingSeq = useRef(0);
  const conversationId = session?.partnerId === partnerId ? session.id : null;
  const visibleMessages = useMemo(() => (conversationId ? messages : []), [conversationId, messages]);
  const creatingSession = Boolean(partnerId && !conversationId && sessionFailure?.partnerId !== partnerId);

  const createSession = useCallback(
    async (nextProfile: string) => {
      if (!partnerId) return;
      setProfile(nextProfile);
      setSession(null);
      setSessionFailure(null);
      setError(null);
      setStatus("BOT");
      try {
        const response = await api<{ conversation: { id: string } }>("/api/chat/sessions", {
          method: "POST",
          body: JSON.stringify({ partnerId, profile: nextProfile }),
        });
        setMessages([]);
        setSession({ partnerId, id: response.conversation.id });
      } catch (cause) {
        const message = errorMessage(cause, "Percakapan baru gagal dibuat.");
        setSessionFailure({ partnerId, message });
        setError(message);
      }
    },
    [partnerId],
  );

  // First session for this partner (the component is keyed by partner, so state starts clean).
  useEffect(() => {
    if (!partnerId) return;
    const controller = new AbortController();
    api<{ conversation: { id: string } }>("/api/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ partnerId, profile: "baru" }),
      signal: controller.signal,
    }).then(
      (response) => setSession({ partnerId, id: response.conversation.id }),
      (cause: unknown) => {
        if (isAbort(cause)) return;
        const message = errorMessage(cause, "Percakapan baru gagal dibuat.");
        setSessionFailure({ partnerId, message });
        setError(message);
      },
    );
    return () => controller.abort();
  }, [partnerId]);

  const refresh = useCallback(async (id: string) => {
    const response = await api<{ status: string; messages?: ChatMessage[] }>(`/api/conversations/${id}`);
    setMessages((current) => {
      const next = response.messages || [];
      // Avoid re-renders when nothing changed (polling).
      return next.length === current.length && next.at(-1)?.id === current.at(-1)?.id ? current : next;
    });
    setStatus(response.status);
  }, []);

  // Poll so CS replies from the inbox and campaign messages show up here.
  useInterval(() => {
    if (conversationId && !sending) void refresh(conversationId).catch(() => {});
  }, conversationId ? 3500 : null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleMessages, sending]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useInterval(() => setRecording((s) => (s == null ? s : s + 1)), recording != null ? 1000 : null);

  const post = async (body: Record<string, string>) => {
    if (!conversationId || sending) return;
    setSending(true);
    setError(null);
    // Show the customer's bubble right away; the server copy replaces it on refresh.
    const pendingId = `pending-${++pendingSeq.current}`;
    const shown = body.text ?? body.label;
    if (shown) {
      setMessages((current) => [...current, { id: pendingId, sender: "CUSTOMER", type: "TEXT", content: shown, createdAt: nowIso() }]);
    }
    try {
      await api(`/api/chat/${conversationId}/messages`, { method: "POST", body: JSON.stringify(body) });
      await refresh(conversationId);
      return true;
    } catch (cause) {
      setMessages((current) => current.filter((m) => m.id !== pendingId));
      setError(errorMessage(cause, "Pesan gagal dikirim."));
      return false;
    } finally {
      setSending(false);
    }
  };

  const sendText = async (value?: string) => {
    const message = (value ?? text).trim();
    if (!message) return;
    if (value === undefined) setText("");
    const ok = await post({ text: message });
    if (!ok && value === undefined) setText(message);
  };

  const sendAction = (action: ChatAction) => void post({ button: action.button, label: action.label });

  const sendMedia = async (file: File) => {
    if (!conversationId || sending) return;
    setSending(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api(`/api/chat/${conversationId}/media`, { method: "POST", body: formData });
      await refresh(conversationId);
    } catch (cause) {
      setError(errorMessage(cause, "Lampiran gagal dikirim."));
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];
      recorder.ondataavailable = (event) => chunks.current.push(event.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const file = new File([new Blob(chunks.current, { type: "audio/webm" })], "voice.webm", { type: "audio/webm" });
        await sendMedia(file);
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(0);
      setError(null);
    } catch (cause) {
      setError(errorMessage(cause, "Mikrofon tidak dapat diakses."));
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setRecording(null);
  };

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendText();
  };

  const pickSuggestion = (s: Suggestion) => {
    if (s.action) sendAction(s.action);
    else if (s.send) void sendText(s.send);
    else inputRef.current?.focus();
  };

  const partnerName = partners.find((partner) => partner.id === partnerId)?.name || "Pilih mitra";
  const statusInfo = CONVERSATION_STATUS[status] ?? CONVERSATION_STATUS.BOT;
  const headerSubtitle = creatingSession
    ? "Menyiapkan percakapan…"
    : !conversationId
      ? "Menunggu koneksi"
      : status === "NEEDS_HUMAN"
        ? "Menghubungkan ke tim CS…"
        : status === "HUMAN"
          ? "Dilayani tim CS"
          : status === "CLOSED"
            ? "Percakapan selesai"
            : "Asisten virtual · online";
  const lastBotIndex = visibleMessages.findLastIndex((m) => m.sender !== "CUSTOMER");
  const customerMessages = visibleMessages.filter((m) => m.sender === "CUSTOMER");

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar */}
      <aside className="relative hidden w-[290px] shrink-0 flex-col overflow-hidden bg-ink text-white lg:flex">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-mint-strong/20 blur-3xl" />
        <div className="relative flex items-center gap-3 px-6 pb-6 pt-6">
          <Logo />
        </div>

        <div className="relative space-y-3 px-4">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/65 transition hover:bg-white/[0.07] hover:text-white">
            <ArrowLeft className="size-4" />
            Kembali ke konsol
          </Link>
          <Button
            className="h-11 w-full rounded-xl bg-mint font-semibold text-ink shadow-[0_10px_24px_-10px_rgba(143,228,204,0.9)] hover:bg-white"
            onPress={() => void createSession(profile)}
            isDisabled={creatingSession || !partnerId}
          >
            <Plus className="size-4" />
            Percakapan baru
          </Button>
        </div>

        <div className="relative mt-7 px-4">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Mitra</p>
          <AppSelect
            ariaLabel="Pilih mitra"
            items={partners.map((p) => ({ id: p.id, label: p.name }))}
            value={partnerId}
            onChange={(id) => id && setPartnerId(id)}
            isDisabled={partnersLoading || partners.length === 0}
            placeholder={partnersLoading ? "Memuat…" : "Pilih mitra"}
            className="w-full"
            triggerClassName="!border-white/12 !bg-white/[0.07] !text-white !shadow-none hover:!bg-white/[0.12] [&_*]:!text-white"
          />
        </div>

        <div className="relative mt-6 px-4">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Simulasikan sebagai</p>
          <div className="space-y-1">
            {profiles.map((item) => {
              const active = profile === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => void createSession(item.id)}
                  disabled={creatingSession || !partnerId}
                  className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition disabled:opacity-50"
                >
                  {active && <motion.span layoutId="profile-pill" className="absolute inset-0 rounded-xl bg-white/10 ring-1 ring-inset ring-white/10" />}
                  <span className={`relative size-2 rounded-full ${active ? "bg-mint-strong shadow-[0_0_10px_2px_rgba(143,228,204,0.6)]" : "bg-white/25"}`} />
                  <span className="relative">
                    <span className={`block text-sm ${active ? "font-semibold text-white" : "text-white/70"}`}>{item.label}</span>
                    <span className="block text-[11px] text-white/40">{item.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative mt-6 flex min-h-0 flex-1 flex-col px-4">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Pesan Anda</p>
          <div className="no-scrollbar space-y-0.5 overflow-y-auto">
            {customerMessages.slice(-8).reverse().map((message) => (
              <p key={message.id} className="truncate rounded-lg px-3 py-2 text-xs text-white/60" title={message.content}>
                {message.content}
              </p>
            ))}
            {customerMessages.length === 0 && <p className="px-3 py-2 text-xs leading-5 text-white/35">Belum ada pesan di sesi ini.</p>}
          </div>
        </div>

        <div className="relative m-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-white/80">
            <span className="size-1.5 rounded-full bg-mint-strong" /> Data demo
          </p>
          <p className="mt-1 text-[11px] leading-4 text-white/45">Gunakan data fiktif. Foto & suara hanya diproses sementara, tidak disimpan.</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="z-10 flex h-16 shrink-0 items-center gap-2.5 border-b border-border/80 bg-surface/95 px-3 backdrop-blur-xl md:px-8">
          <Link href="/dashboard" aria-label="Kembali ke konsol" className="grid size-9 shrink-0 place-items-center rounded-xl text-text-secondary transition hover:bg-surface-tertiary lg:hidden">
            <ArrowLeft className="size-5" />
          </Link>
          <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-mint to-mint-strong text-ink">
            <Sparkles className="size-5" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white ${
                status === "BOT" ? "bg-success" : status === "NEEDS_HUMAN" ? "bg-warning" : "bg-accent"
              }`}
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">{partnerName}</p>
            <p className="truncate text-[11px] text-text-secondary sm:text-xs">{headerSubtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:block">
              <Pill tone={statusInfo.tone} dot pulse={status === "NEEDS_HUMAN"}>
                {statusInfo.label}
              </Pill>
            </div>
            <span className="hidden rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-semibold text-text-secondary md:inline-flex">Data demo</span>
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label="Percakapan baru"
              onPress={() => void createSession(profile)}
              isDisabled={creatingSession || !partnerId}
              className="lg:hidden"
            >
              <Plus className="size-4" />
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Pengaturan percakapan"
              aria-expanded={menuOpen}
              aria-controls="chat-settings"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-surface text-text-secondary transition hover:bg-surface-tertiary hover:text-text-primary lg:hidden"
            >
              <SlidersHorizontal className="size-[18px]" />
            </button>
          </div>
        </header>

        {partnerError && (
          <div role="alert" className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger-fg/15 bg-danger-bg/70 px-4 py-3 text-sm text-danger-fg md:mx-8">
            <span>Daftar mitra gagal dimuat: {partnerError}</span>
            <Button size="sm" variant="secondary" onPress={reloadPartners}>
              <RefreshCw className="size-3.5" /> Coba lagi
            </Button>
          </div>
        )}

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto flex min-h-full max-w-[820px] flex-col">
            {visibleMessages.length === 0 ? (
              <div className="my-auto w-full py-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mx-auto max-w-[560px] text-center">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Asisten virtual {partnerName}</p>
                  <h1 className="font-heading text-[28px] font-semibold leading-tight tracking-tight sm:text-3xl md:text-[40px]">
                    Halo, ada yang bisa <span className="text-gradient">kami bantu?</span>
                  </h1>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-secondary md:text-base">
                    Pilih topik di bawah atau tulis pertanyaan Anda sendiri.
                  </p>
                </motion.div>
                <div className="mx-auto mt-8 grid max-w-[660px] gap-3 sm:grid-cols-2">
                  {suggestions.map((s, index) => (
                    <motion.button
                      key={s.label}
                      type="button"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + index * 0.06 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => pickSuggestion(s)}
                      disabled={!conversationId || sending}
                      className="group flex items-center gap-4 rounded-2xl border border-border bg-white p-4 text-left shadow-soft transition-[border-color,box-shadow] hover:border-accent/30 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${s.tone}`}>{s.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-text-primary">{s.label}</span>
                        <span className="mt-0.5 block text-xs text-text-secondary">{s.detail}</span>
                      </span>
                      <span className="text-text-secondary transition-transform group-hover:translate-x-1 group-hover:text-accent">→</span>
                    </motion.button>
                  ))}
                </div>
                {(partnersLoading || creatingSession) && (
                  <p className="mt-6 flex items-center justify-center gap-2 text-xs text-text-secondary">
                    <Spinner size="sm" color="accent" /> Menyiapkan percakapan…
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-auto space-y-5 py-2">
                <div className="text-center">
                  <span className="rounded-full border border-border bg-white/80 px-3 py-1 text-[11px] font-medium text-text-secondary">
                    Hari ini · {profiles.find((p) => p.id === profile)?.label}
                  </span>
                </div>
                <AnimatePresence initial={false}>
                  {visibleMessages.map((message, index) => {
                    const isCustomer = message.sender === "CUSTOMER";
                    if (message.sender === "SYSTEM") {
                      return (
                        <motion.p key={message.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-text-secondary">
                          {message.content}
                        </motion.p>
                      );
                    }
                    const rich = isRich(message);
                    return (
                      <motion.div
                        key={message.id}
                        layout="position"
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        style={{ originX: isCustomer ? 1 : 0 }}
                        className={`flex items-end gap-2.5 ${isCustomer ? "justify-end" : "justify-start"}`}
                      >
                        {!isCustomer && <BotAvatar sender={message.sender} />}
                        <div className={`max-w-[min(85%,600px)] ${isCustomer ? "text-right" : ""}`}>
                          <div
                            className={`inline-block text-left text-sm leading-6 ${
                              isCustomer
                                ? "rounded-bubble rounded-br-md bg-ink px-4 py-2.5 text-white shadow-[0_8px_20px_-10px_rgba(9,44,53,0.6)]"
                                : message.sender === "AGENT"
                                  ? "rounded-bubble rounded-bl-md border border-ink/10 bg-white px-4 py-2.5 shadow-soft"
                                  : `rounded-bubble rounded-bl-md border border-border bg-white shadow-soft ${rich ? "p-3.5" : "px-4 py-2.5"}`
                            }`}
                          >
                            {rich ? (
                              <RichContent message={message} onAction={!isCustomer ? sendAction : undefined} disabled={sending || index !== lastBotIndex || status !== "BOT"} />
                            ) : (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            )}
                          </div>
                          <p className={`mt-1 flex items-center gap-1.5 px-1 text-[11px] text-text-secondary ${isCustomer ? "justify-end" : ""}`}>
                            {!isCustomer && (
                              <span className={`font-semibold ${message.sender === "AI" ? "text-accent" : message.sender === "AGENT" ? "text-ink" : ""}`}>
                                {message.sender === "AI" ? "SevaAI · dijawab AI" : message.sender === "AGENT" ? "Tim CS" : "Asisten"}
                              </span>
                            )}
                            {message.createdAt && <span>{clock(message.createdAt)}</span>}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <AnimatePresence>
                  {sending && (
                    <motion.div key="typing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-end gap-2.5">
                      <BotAvatar sender="BOT" />
                      <div className="mb-5 rounded-bubble rounded-bl-md border border-border bg-white px-4 py-3.5 shadow-soft">
                        <TypingDots />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {status !== "BOT" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-center">
                      <span className="inline-flex items-center gap-2 rounded-full border border-warning-fg/15 bg-warning-bg px-3 py-1.5 text-xs font-medium text-warning-fg">
                        <Headset className="size-3.5" />
                        {status === "NEEDS_HUMAN" ? "Menghubungkan ke tim CS… bot dijeda." : status === "HUMAN" ? "Anda sedang dilayani tim CS." : "Percakapan selesai."}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 md:px-8 md:pb-6">
          <div className="mx-auto max-w-[820px]">
            <AnimatePresence>
              {error && (
                <motion.div
                  role="alert"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger-fg/15 bg-danger-bg/80 px-3 py-2 text-xs text-danger-fg"
                >
                  <span>{error}</span>
                  {partnerError ? (
                    <Button size="sm" variant="secondary" onPress={reloadPartners}>Coba lagi</Button>
                  ) : (
                    sessionFailure?.partnerId === partnerId && (
                      <Button size="sm" variant="secondary" onPress={() => void createSession(profile)}>Buat percakapan lagi</Button>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <form
              onSubmit={submitMessage}
              className="rounded-[22px] border border-border bg-white p-2 shadow-lift transition focus-within:border-accent/40 focus-within:ring-4 focus-within:ring-accent/10"
            >
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  isIconOnly
                  variant="ghost"
                  aria-label="Lampirkan foto"
                  isDisabled={!conversationId || sending || recording != null}
                  onPress={() => fileRef.current?.click()}
                  className="shrink-0 rounded-xl text-text-secondary"
                >
                  <Paperclip className="size-5" />
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,audio/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void sendMedia(file);
                    event.currentTarget.value = "";
                  }}
                />
                {recording != null ? (
                  <div className="flex min-w-0 flex-1 items-center gap-2 px-2 text-sm text-danger-fg">
                    <span className="relative size-2.5 rounded-full bg-danger">
                      <span className="absolute inset-0 animate-ping rounded-full bg-danger opacity-60" />
                    </span>
                    Merekam… {String(Math.floor(recording / 60)).padStart(2, "0")}:{String(recording % 60).padStart(2, "0")}
                  </div>
                ) : (
                  <Input
                    ref={inputRef}
                    aria-label="Tulis pesan"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={status === "BOT" ? "Tulis pesan untuk SevaAI…" : "Tulis pesan untuk tim CS…"}
                    disabled={!conversationId}
                    className="min-w-0 flex-1 border-0 bg-transparent shadow-none focus:ring-0"
                  />
                )}
                <Button
                  type="button"
                  isIconOnly
                  variant={recording != null ? "danger" : "ghost"}
                  aria-label={recording != null ? "Hentikan dan kirim rekaman" : "Rekam voice note"}
                  isDisabled={!conversationId || sending}
                  onPress={recording != null ? stopRecording : startRecording}
                  className={`shrink-0 rounded-xl ${recording != null ? "" : "text-text-secondary"}`}
                >
                  {recording != null ? <Square className="size-4 fill-current" /> : <Mic className="size-5" />}
                </Button>
                <motion.div whileTap={{ scale: 0.92 }}>
                  <Button
                    type="submit"
                    isIconOnly
                    variant="primary"
                    aria-label="Kirim pesan"
                    isDisabled={!conversationId || !text.trim() || sending || recording != null}
                    className="shrink-0 rounded-xl"
                  >
                    {sending ? <Spinner size="sm" color="current" /> : <ArrowUp className="size-5" />}
                  </Button>
                </motion.div>
              </div>
            </form>
            <p className="mt-2 text-center text-[11px] leading-4 text-text-secondary">
              SevaAI dapat keliru. Informasi penting dikonfirmasi oleh tim layanan pelanggan.
            </p>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <motion.div
              id="chat-settings"
              role="dialog"
              aria-modal="true"
              aria-label="Pengaturan percakapan"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
            >
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Pengaturan</p>
                  <h2 className="mt-1 font-heading text-lg font-semibold text-text-primary">Percakapan</h2>
                  <p className="mt-0.5 text-xs text-text-secondary">Pilih mitra dan profil pelanggan untuk simulasi.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Tutup pengaturan"
                  autoFocus
                  className="grid size-9 shrink-0 place-items-center rounded-xl border border-border text-text-secondary transition hover:bg-surface-tertiary hover:text-text-primary"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold text-text-primary">Mitra</p>
                <AppSelect
                  ariaLabel="Pilih mitra"
                  items={partners.map((partner) => ({ id: partner.id, label: partner.name }))}
                  value={partnerId}
                  onChange={(id) => {
                    if (!id) return;
                    setPartnerId(id);
                    setMenuOpen(false);
                  }}
                  isDisabled={partnersLoading || partners.length === 0}
                  placeholder={partnersLoading ? "Memuat mitra…" : "Pilih mitra"}
                  className="w-full"
                />
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold text-text-primary">Simulasikan sebagai</p>
                <div className="mt-2 space-y-2">
                  {profiles.map((item) => {
                    const active = profile === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        disabled={creatingSession || !partnerId}
                        onClick={() => {
                          setMenuOpen(false);
                          void createSession(item.id);
                        }}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition disabled:opacity-50 ${
                          active ? "border-accent/30 bg-accent-soft/60" : "border-border bg-surface hover:bg-surface-secondary"
                        }`}
                      >
                        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${active ? "bg-accent text-white" : "bg-surface-tertiary text-text-secondary"}`}>
                          {active ? <Check className="size-4" /> : <UserRound className="size-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-text-primary">{item.label}</span>
                          <span className="block text-xs text-text-secondary">{item.hint}</span>
                        </span>
                        {active && <Pill tone="accent" size="xs">Aktif</Pill>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                className="mt-5 h-11 w-full rounded-xl"
                variant="primary"
                onPress={() => {
                  setMenuOpen(false);
                  void createSession(profile);
                }}
                isDisabled={creatingSession || !partnerId}
              >
                <Plus className="size-4" />
                Percakapan baru
              </Button>
              <p className="mt-3 text-center text-[11px] leading-4 text-text-secondary">
                Data demo · percakapan ini tidak memengaruhi pelanggan sungguhan.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
