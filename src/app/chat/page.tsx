"use client";
import { useEffect, useState, useRef } from "react";
import { usePartner } from "@/hooks/usePartner";
import { api, API_URL } from "@/lib/api";
import { Button, Input, Card, CardContent, Avatar, AvatarFallback, Chip, Spinner } from "@heroui/react";

type Msg = { id: string; sender: string; type: string; content: string; payload: any };

export default function ChatPage() {
  const { partnerId, partners } = usePartner();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState("baru");
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const startConv = async (prof: string) => {
    setProfile(prof);
    const r = await api("/api/chat/sessions", { method: "POST", body: JSON.stringify({ partnerId, profile: prof }) });
    setConversationId(r.conversation.id);
    setMessages([]);
  };
  useEffect(() => { if (partnerId && !conversationId) startConv("baru"); }, [partnerId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const refresh = async () => {
    if (!conversationId) return;
    const r = await api(`/api/conversations/${conversationId}`);
    setMessages(r.messages || []);
  };
  const sendText = async (txt?: string, button?: string) => {
    if (!conversationId) return;
    setLoading(true);
    try { await api(`/api/chat/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ text: txt ?? text, button }) }); setText(""); await refresh(); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  const sendMedia = async (file: File) => {
    if (!conversationId) return;
    setLoading(true);
    const fd = new FormData(); fd.append("file", file);
    await fetch(`${API_URL}/api/chat/${conversationId}/media`, { method: "POST", body: fd });
    await refresh();
    setLoading(false);
  };
  const startRec = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunks.current = [];
    mr.ondataavailable = (e) => chunks.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/webm" });
      await sendMedia(new File([blob], "voice.webm", { type: "audio/webm" }));
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start(); mediaRecorder.current = mr; setRecording(true);
  };
  const stopRec = () => { mediaRecorder.current?.stop(); setRecording(false); };

  const partnerName = partners.find((p) => p.id === partnerId)?.name || "Mitra Internet Demo";

  return (
    <div className="flex h-screen bg-canvas">
      <aside className="w-72 bg-surface border-r border-border flex flex-col">
        <div className="p-4">
          <Button color="primary" className="w-full" onPress={() => startConv(profile)}>Percakapan baru</Button>
        </div>
        <div className="px-4 flex gap-2">
          {["baru", "aktif", "pasif"].map((p) => (
            <Button key={p} size="sm" variant={profile === p ? "solid" : "bordered"} color="primary" className="flex-1" onPress={() => startConv(p)}>
              {p === "baru" ? "Baru" : p === "aktif" ? "Aktif" : "Pasif"}
            </Button>
          ))}
        </div>
        <div className="px-4 mt-4 text-xs font-semibold text-text-secondary uppercase tracking-wide">Riwayat Percakapan</div>
        <div className="flex-1 overflow-auto px-2 py-2 space-y-1">
          {messages.filter(m => m.sender === "CUSTOMER").slice(0, 8).map((m, i) => (
            <div key={i} className="px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-canvas cursor-pointer truncate">{m.content}</div>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <a href="/inbox" className="flex items-center gap-2 text-sm text-accent font-semibold">Buka konsol CS (/inbox)</a>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-sm">{partnerName}</span>
          <div className="flex items-center gap-3">
            <Chip size="sm" variant="flat" className="bg-canvas text-text-secondary">Data demo</Chip>
            <Chip size="sm" color="primary" variant="flat">Ditangani Bot</Chip>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="max-w-[720px] mx-auto px-6 py-8 space-y-6">
            {messages.length === 0 && (
              <div className="text-center space-y-6 mt-4">
                <h2 className="font-heading text-2xl font-semibold">Halo, ada yang bisa SevaAI bantu?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Pasang internet baru" },
                    { label: "Cek tagihan" },
                    { label: "Lapor gangguan" },
                    { label: "Tanya lainnya" },
                  ].map((s) => (
                    <Card key={s.label} isPressable onPress={() => sendText(s.label)} className="hover:border-accent">
                      <CardContent className="p-4">
                        <div className="text-sm font-semibold text-text-primary">{s.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m) => {
              if (m.sender === "CUSTOMER") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="bg-chat-customer rounded-bubble px-4 py-2.5 max-w-[70%] text-sm">{m.content}</div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="flex gap-3">
                  <Avatar size="sm" className="bg-accent-soft text-accent mt-0.5">
                    <AvatarFallback>S</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Chip size="sm" color={m.sender === "AI" ? "accent" : "default"} variant="soft">
                      {m.sender === "AI" ? "AI" : m.sender === "BOT" ? "Bot" : m.sender}
                    </Chip>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-3 items-center">
                <Avatar size="sm" className="bg-accent-soft">
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
                <Spinner size="sm" color="primary" />
                <span className="text-sm text-text-secondary">SevaAI sedang memproses...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-border bg-surface p-4">
          <div className="max-w-[720px] mx-auto">
            <div className="bg-surface border border-border rounded-2xl p-2 flex items-center gap-2 shadow-sm">
              <Button size="sm" variant="ghost" onPress={() => fileRef.current?.click()}>Lampiran</Button>
              <input ref={fileRef} type="file" accept="image/*,audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && sendMedia(e.target.files[0])} />
              <Button size="sm" variant={recording ? "danger" : "secondary"} onPress={recording ? stopRec : startRec}>
                {recording ? "Stop" : "Rekam"}
              </Button>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendText(); }}
                placeholder="Tulis pesan untuk SevaAI..."
                className="flex-1"
              />
              <Button variant="primary" isIconOnly onPress={() => sendText()}>↑</Button>
            </div>
            <div className="text-center text-xs text-text-secondary mt-2">SevaAI bisa keliru. Info penting akan dikonfirmasi CS.</div>
          </div>
        </div>
      </main>
    </div>
  );
}
