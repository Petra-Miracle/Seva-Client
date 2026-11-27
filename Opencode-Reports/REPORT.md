# Report Build — SevaAI

## Ringkasan
Prototipe SevaAI (multi-mitra customer service WhatsApp-style) dibangun end-to-end: backend Express+Prisma+Neon dan frontend Next.js.

## Yang dibuat

### Backend (D:\Seva-Backend)
- Express + TypeScript + Prisma + Zod, singleton PrismaClient.
- 18 tabel Prisma (Partner, Package, Promo, CoverageArea, Customer, Subscription, InstallSchedule, Invoice, Conversation, Message, Agent, SupportTicket, FaqArticle, FunnelEvent, Segment, MessageTemplate, Campaign, CampaignRecipient) + enum.
- Seed data demo: 2 mitra, 3 paket, area cakupan, 40+ pelanggan, 15 FAQ, 3 segmen, 3 template, 2 agen.
- Engine: router.ts (state machine + keyword + AI fallback), flows acquire/support/retain, rules, handoff, guardrails.
- AI wrapper Gemini (@google/genai) dengan retry 429 dan fallback.
- Realtime Pusher (opsional).
- Endpoint REST lengkap: /health, /api/partners, /api/chat/sessions, /api/chat/:id/messages, /api/chat/:id/media, /api/conversations, takeover/reply/return-to-bot, /api/tickets, /api/segments + preview, /api/templates, /api/campaigns + run, /api/knowledge/faq & packages, /api/metrics, /api/cron/campaigns.
- Kampanye: segmentasi JSON, opt-in enforcement, pengisian template, CampaignRecipient, converted tracking.

### Frontend (D:\Seva-Client)
- Next.js 16 App Router + TypeScript + Tailwind dengan design tokens.
- Halaman: / (redirect dashboard), /chat, /inbox, /tickets, /campaigns, /knowledge, /dashboard.
- Simulator chat: sidebar profil, sapaan + 4 kartu saran, gelembung pelanggan, jawaban bot/AI, composer dengan lampiran & rekam voice (MediaRecorder).
- Inbox CS, tiket, kampanye (segmen+template+run), knowledge, dashboard metrik 3 tahap + efisiensi AI.
- Pemilih mitra di header.

### Design (Pendev/SevaAI.pen)
- Revisi putaran 2 diterapkan: badge "Data demo" melayang dihapus (2 instance), kategori template UTILITY/MARKETING diganti Pengingat/Penawaran.

## Cara menjalankan
Backend: cd D:\Seva-Backend; npm install; npx prisma db push; npm run prisma:seed; npm run dev (port 4000).
Frontend: cd D:\Seva-Client; npm install; npm run dev (port 3000).

## Status
- Backend build: OK. Frontend build: OK.
- Skenario 7 (kampanye) teruji: 3 penerima, converted setelah reply "bayar".
- Gemini memerlukan GEMINI_API_KEY untuk fitur AI; tanpa key, free text memicu handoff (simulasi kuota habis).
