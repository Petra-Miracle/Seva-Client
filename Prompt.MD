
# Prompt Build Sistem — SevaAI

> Salin seluruh isi di bawah garis ini ke AI coding agent kamu.
> Kerjakan per FASE. Setelah setiap fase selesai, BERHENTI: tampilkan ringkasan perubahan, cara menjalankan, dan cara mengujinya, lalu tunggu konfirmasi sebelum lanjut.

---

## 0. Peran dan aturan kerja

Kamu adalah Senior Full-Stack Engineer. Bangun prototipe **SevaAI** dari nol untuk Martech Hackathon 2026. Prioritas: berjalan stabil saat demo, hemat kuota AI, kode rapi dan mudah dijelaskan ke juri.

Aturan wajib:

1. **TypeScript** di frontend dan backend.
2. **Tidak ada secret di kode.** Semua lewat `.env` (lokal) dan Environment Variables di Vercel. Sediakan `.env.example` di kedua project. Pastikan `.env` masuk `.gitignore`.
3. **Hanya data dummy.** Free tier Gemini memakai data untuk peningkatan produk Google dan bisa dibaca reviewer manusia, jadi jangan pernah memproses data, foto, atau rekaman suara pelanggan asli. Semua data seed diberi label "data demo".
4. **Jangan mengarang angka bisnis** (harga, statistik) di UI. Semua angka berasal dari database seed.
5. Validasi semua input endpoint dengan `zod`. Backend tidak boleh crash; error dikembalikan sebagai JSON yang jelas.
6. Jika ada keputusan ambigu, pilih opsi paling sederhana yang tetap berjalan, lalu catat di `DECISIONS.md`.
7. Jangan memasang library yang tidak perlu. Setiap dependency baru harus punya alasan.

## 1. Gambaran produk

**SevaAI** (dari bahasa Sanskerta *seva*, "pelayanan yang tulus") adalah sistem layanan pelanggan berbasis WhatsApp yang melayani pelanggan di seluruh siklus hidupnya, untuk banyak mitra (multi-mitra). Mitra demo: **penyedia internet rumah (fiber)**, dengan data dummy.

Tiga pilar dalam satu siklus:

| Tahap                 | Pilar                                  | Fungsi                                                                                                                      |
| --------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Dapatkan**    | Conversational Commerce & AI Sales     | Cek cakupan, rekomendasi paket, transaksi dan jadwal pemasangan di chat                                                     |
| **Layani**      | Customer Support & Automation          | Jawab dari FAQ resmi, cek tagihan dan status pemasangan, terima keluhan (teks, foto, voice note), buat tiket, handoff ke CS |
| **Pertahankan** | Personalized Marketing & Re-engagement | Segmentasi pelanggan, kampanye pesan personal (pengingat tagihan, tawaran upgrade, ajak kembali pelanggan pasif)            |

Semua data dari ketiga tahap disimpan per mitra dan dipakai lagi untuk personalisasi. Inilah pembeda utama SevaAI.

**Prinsip desain: HYBRID (aturan dulu, AI seperlunya).**

- Alur terstruktur (menu, tombol, pilih paket, jadwal, konfirmasi) memakai **aturan/state machine**, tanpa AI.
- **Gemini hanya dipanggil** untuk: memahami teks bebas, menyusun jawaban dari FAQ, menganalisis foto, dan memahami voice note.
- Setiap pesan mencatat apakah AI dipakai, supaya dashboard bisa menunjukkan penghematan kuota.

**Kanal chat:** untuk prototipe, gunakan **simulator chat di web** (tampilan seperti chat di HP). Integrasi WhatsApp Business Platform adalah fase opsional, memakai logika yang sama.

## 2. Struktur proyek dan stack

| Bagian   | Lokasi                                                     | Stack                                                                                                   |
| -------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Frontend | `D:\Seva-Client`                                         | Next.js (App Router) + TypeScript + Tailwind CSS + `pusher-js` + `lucide-react`                     |
| Backend  | `D:\Seva-Backend`                                        | Express.js + TypeScript + Prisma + `zod` + `pusher` (server) + `@google/genai` (SDK resmi Gemini) |
| Database | PostgreSQL terkelola dengan free tier (Neon atau Supabase) | Prisma ORM                                                                                              |
| Realtime | Pusher Channels (paket Sandbox gratis)                     |                                                                                                         |
| AI       | Google AI Studio — Gemini API (free tier)                 |                                                                                                         |
| Deploy   | Vercel — dua project terpisah                             |                                                                                                         |

Catatan Vercel: backend berjalan sebagai serverless function. **Jangan** membuat WebSocket server sendiri dan **jangan** menyimpan state di memori. Realtime lewat Pusher, state di database.

Catatan Prisma di serverless:

- `DATABASE_URL` memakai connection string **pooled** dari Neon/Supabase; `DIRECT_URL` (tanpa pooler) untuk `prisma migrate`.
- Satu instance `PrismaClient` yang dipakai ulang (pola singleton), jangan dibuat baru per request.
- `prisma generate` dijalankan saat build (`postinstall`).

## 3. Integrasi Gemini (Google AI Studio)

- Gunakan SDK resmi `@google/genai` dengan `GEMINI_API_KEY` dari env.
- **Nama model wajib dari env, jangan hardcode** (nama model Gemini sering berganti; salin ID terbaru dari AI Studio):
  - `GEMINI_MODEL_LITE` → model Flash-Lite, untuk tugas ringan (klasifikasi niat, ekstraksi data).
  - `GEMINI_MODEL` → model Flash, untuk tugas lebih berat (menyusun jawaban, analisis foto, voice note).
- Buat wrapper `src/ai/gemini.ts` dengan fungsi:
  - `classifyIntent(text, context)` → JSON terstruktur (pakai *structured output* / response schema).
  - `answerFromFaq(question, faqSnippets, customerContext)` → jawaban singkat yang HANYA berdasar potongan FAQ yang diberikan.
  - `analyzeImage(imageBuffer, mimeType, hint)` → JSON, misalnya `{ kategori: "router_lampu_merah", keyakinan, saranLangkah[] }`.
  - `understandVoiceNote(audioBuffer, mimeType)` → `{ transkrip, niat, ringkasan }`.
  - `personalizeMessage(template, customerProfile)` → mengisi/menyesuaikan teks template secara singkat.
- Batasi biaya kuota: `maxOutputTokens` wajar, riwayat chat yang dikirim maksimal 10 pesan terakhir, foto diperkecil di frontend sebelum diunggah, voice note maksimal 60 detik.
- **Tangani batas kuota (HTTP 429):** retry dengan backoff 1–2 kali; jika tetap gagal, kirim pesan cadangan yang sopan + tawarkan CS, dan catat event-nya. Jangan crash.
- Catat setiap pemanggilan AI: model, perkiraan token (dari `usageMetadata` respons), durasi.

## 4. Backend — `D:\Seva-Backend`

### 4.1 Struktur folder

```
src/
  index.ts                 # export default app (siap Vercel)
  app.ts                   # express, cors, json, routes, error handler
  config/env.ts            # validasi env dengan zod
  lib/prisma.ts            # singleton PrismaClient
  ai/gemini.ts             # wrapper Gemini (bagian 3)
  engine/
    router.ts              # menentukan tahap & alur: tombol/aturan dulu, AI jika teks bebas
    flows/
      acquire.flow.ts      # Dapatkan: cek cakupan → kebutuhan → paket → jadwal → konfirmasi
      support.flow.ts      # Layani: FAQ, tagihan, status pasang, keluhan, tiket, handoff
      retain.flow.ts       # Pertahankan: balasan atas kampanye (upgrade, bayar, kembali berlangganan)
    rules.ts               # kata kunci & aturan sederhana
    handoff.ts             # aturan kapan diserahkan ke CS
    guardrails.ts          # aturan keamanan balasan
  services/                # akses DB per domain
  realtime/pusher.ts       # helper trigger event
  jobs/campaignRunner.ts   # menjalankan kampanye terjadwal
  routes/                  # lihat 4.5
prisma/
  schema.prisma
  seed.ts
```

### 4.2 Model data (Prisma) — 18 tabel

Semua tabel inti punya `partnerId` (multi-mitra). Gunakan `enum` Prisma untuk kolom status.

**Dapatkan:**

- `Partner`: id, name, slug, brandTone, waPhoneNumberId?, createdAt
- `Package`: id, partnerId, name, speedMbps, monthlyPrice, installFee, contractMonths, isActive
- `Promo`: id, partnerId, packageId?, title, terms, startDate, endDate
- `CoverageArea`: id, partnerId, city, district, village, isCovered
- `Customer`: id, partnerId, name, phone, village?, lifecycleStage (`LEAD` | `ACTIVE` | `INACTIVE` | `CHURNED`), marketingOptIn, optInAt?, createdAt
- `Subscription`: id, customerId, packageId, status (`PENDING_INSTALL` | `ACTIVE` | `SUSPENDED` | `TERMINATED`), startDate?, billingDay, endDate?
- `InstallSchedule`: id, subscriptionId, date, timeSlot, status
- `Invoice`: id, subscriptionId, period, amount, dueDate, status (`UNPAID` | `PAID` | `OVERDUE`)

**Layani:**

- `Conversation`: id, partnerId, customerId, assignedAgentId?, status (`BOT` | `NEEDS_HUMAN` | `HUMAN` | `CLOSED`), stage (`ACQUIRE` | `SUPPORT` | `RETAIN`), handoffReason?, summary?, createdAt, closedAt?
- `Message`: id, conversationId, sender (`CUSTOMER` | `BOT` | `AI` | `AGENT` | `SYSTEM`), type (`TEXT` | `BUTTONS` | `CARD` | `IMAGE` | `AUDIO` | `TEMPLATE`), content, payload (Json), mediaUrl?, usedAi (Boolean), aiModel?, aiTokens?, createdAt
- `Agent`: id, partnerId, name, email, role
- `SupportTicket`: id, customerId, conversationId?, category (`GANGGUAN` | `TAGIHAN` | `INSTALASI` | `LAINNYA`), priority, status, createdAt, resolvedAt?
- `FaqArticle`: id, partnerId, category, question, answer, keywords (String[]), isActive
- `FunnelEvent`: id, customerId, conversationId?, stage, eventType, createdAt

**Pertahankan:**

- `Segment`: id, partnerId, name, rules (Json), createdAt
- `MessageTemplate`: id, partnerId, name, category (`MARKETING` | `UTILITY`), body (dengan placeholder `{{nama}}`, `{{paket}}`, dst.), waTemplateName?, approvalStatus
- `Campaign`: id, partnerId, segmentId, templateId, name, goal, scheduledAt, status (`DRAFT` | `SCHEDULED` | `SENT`)
- `CampaignRecipient`: id, campaignId, customerId, sentAt?, deliveredAt?, readAt?, repliedAt?, converted (Boolean)

### 4.3 Cara kerja satu pesan masuk (`engine/router.ts`)

1. Simpan pesan pelanggan → trigger `message:new`.
2. Jika conversation berstatus `NEEDS_HUMAN` atau `HUMAN` → **bot diam**, hanya teruskan ke inbox CS.
3. Jika pesan adalah **klik tombol** (payload) → lanjutkan alur aturan yang sedang berjalan. **Tanpa AI.**
4. Jika pesan teks cocok dengan aturan/kata kunci di `rules.ts` (misalnya "tagihan", "cek cakupan", "menu") → arahkan ke alur terkait. **Tanpa AI.**
5. Jika teks bebas yang tidak cocok → `classifyIntent` (Flash-Lite) → arahkan ke tahap & alur.
6. Pertanyaan informasi → cari FAQ dengan pencarian kata kunci sederhana → `answerFromFaq` (Flash) dengan 3 potongan FAQ teratas. Jika tidak ada FAQ relevan → handoff.
7. **Foto** → `analyzeImage` → jika terkait gangguan, beri langkah perbaikan + tawarkan buat tiket.
8. **Voice note** → `understandVoiceNote` → tampilkan transkrip ringkas di inbox → proses seperti teks.
9. Sebelum mengirim balasan → `guardrails` → simpan balasan (`usedAi` sesuai) → trigger event.
10. Catat `FunnelEvent` dan update `lifecycleStage` bila berubah → trigger `metrics:update`.

### 4.4 Aturan handoff dan guardrails

**Handoff ke CS** (status `NEEDS_HUMAN`, simpan `handoffReason` + ringkasan dari AI atau dari aturan):

- negosiasi harga/diskon, pelanggan marah atau kasar, keluhan berulang (≥ 2 tiket terbuka), FAQ tidak menemukan jawaban, pelanggan meminta "bicara dengan CS", kuota AI habis.

**Guardrails:**

- Tidak pernah meminta OTP, PIN, password, NIK, atau data kartu/rekening.
- Harga, nama paket, dan promo hanya dari database (cek angka harga di balasan AI harus ada di data).
- Tidak menjanjikan diskon, kompensasi, atau tanggal perbaikan.
- Jawaban AI maksimal 3 kalimat, Bahasa Indonesia santai-sopan, sapaan "Kak".
- Setiap balasan AI ditandai `sender = AI` dan diberi label "AI" di UI.

### 4.5 Endpoint REST

| Method   | Path                                                | Fungsi                                                                         |
| -------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| GET      | `/health`                                         | cek hidup                                                                      |
| GET      | `/api/partners`                                   | daftar mitra (untuk pemilih mitra)                                             |
| POST     | `/api/chat/sessions`                              | buat customer dummy + conversation (simulator)                                 |
| POST     | `/api/chat/:conversationId/messages`              | kirim teks atau klik tombol                                                    |
| POST     | `/api/chat/:conversationId/media`                 | kirim foto/voice note (multipart, batas ukuran)                                |
| GET      | `/api/conversations?partnerId=&status=`           | inbox                                                                          |
| GET      | `/api/conversations/:id`                          | detail + messages                                                              |
| POST     | `/api/conversations/:id/takeover`                 | CS ambil alih                                                                  |
| POST     | `/api/conversations/:id/reply`                    | CS membalas                                                                    |
| POST     | `/api/conversations/:id/return-to-bot`            | kembalikan ke bot                                                              |
| GET/POST | `/api/tickets`                                    | daftar & buat tiket                                                            |
| GET/POST | `/api/segments`                                   | daftar & buat segmen; `GET /api/segments/:id/preview` = pelanggan yang cocok |
| GET/POST | `/api/templates`                                  | template pesan                                                                 |
| GET/POST | `/api/campaigns`                                  | daftar & buat kampanye                                                         |
| POST     | `/api/campaigns/:id/run`                          | jalankan kampanye sekarang (untuk demo)                                        |
| GET      | `/api/knowledge/faq`, `/api/knowledge/packages` | data pengetahuan                                                               |
| GET      | `/api/metrics?partnerId=&period=`                 | metrik dashboard                                                               |
| GET      | `/api/cron/campaigns`                             | dipanggil Vercel Cron, dilindungi `CRON_SECRET`                              |

Media: untuk prototipe, simpan file kecil di storage gratis (misalnya Supabase Storage atau Vercel Blob) atau langsung proses tanpa disimpan permanen. Pilih yang paling sederhana dan catat di `DECISIONS.md`.

CORS: hanya izinkan origin frontend (`CLIENT_ORIGIN`).

### 4.6 Kampanye (Pertahankan)

- Segmen didefinisikan dengan aturan JSON sederhana, contoh: `{ "invoiceStatus": "UNPAID", "dueInDays": 3 }`, `{ "lifecycleStage": "INACTIVE", "inactiveDays": 30 }`, `{ "packageSpeedMbpsLt": 50, "activeMonthsGte": 6 }`.
- **Hanya pelanggan dengan `marketingOptIn = true`** yang boleh menerima kampanye kategori MARKETING. Kategori UTILITY (pengingat tagihan) boleh ke pelanggan aktif.
- Menjalankan kampanye: ambil pelanggan di segmen → isi template (placeholder diisi dari data; `personalizeMessage` hanya opsional dan dibatasi) → kirim sebagai pesan ke conversation simulator → buat `CampaignRecipient`.
- Balasan pelanggan atas kampanye ditangani `retain.flow.ts` dan menandai `converted = true` bila berujung pembayaran, upgrade, atau berlangganan lagi.
- Vercel Cron memanggil `/api/cron/campaigns` (cek batas frekuensi cron di plan Vercel kalian). Untuk demo, selalu sediakan tombol "Jalankan sekarang".

### 4.7 Env backend (`.env.example`)

```
DATABASE_URL=
DIRECT_URL=
GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_MODEL_LITE=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=ap1
CLIENT_ORIGIN=http://localhost:3000
CRON_SECRET=
```

## 5. Frontend — `D:\Seva-Client`

### 5.1 Halaman

| Route          | Isi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/chat`      | **Simulator chat pelanggan bergaya ruang chat tools AI** (pola umum asisten AI modern, dengan identitas SevaAI sendiri): sidebar riwayat percakapan + pemilih pelanggan dummy (baru/aktif/pasif), area percakapan terpusat (~720 px), pesan pelanggan berupa gelembung rata kanan, jawaban SevaAI berupa teks penuh tanpa gelembung dengan label "Bot"/"AI", kartu & tombol balasan cepat di dalam jawaban, layar kosong dengan sapaan + 4 kartu saran, kolom input mengambang (lampiran foto, mikrofon voice note via MediaRecorder, kirim), indikator memproses ("SevaAI sedang memeriksa tagihan..."). Responsif: sidebar menjadi drawer di HP |
| `/inbox`     | Inbox CS: filter status, badge tahap (Dapatkan/Layani/Pertahankan) dan alasan handoff, ringkasan dari bot, transkrip voice note, tombol Ambil alih / Kembalikan ke bot, kolom balas                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/tickets`   | Daftar tiket support dengan kategori, prioritas, status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `/campaigns` | Buat segmen (form aturan sederhana + pratinjau jumlah pelanggan), pilih template, buat kampanye, tombol "Jalankan sekarang", hasil per penerima                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `/knowledge` | Kelola FAQ dan lihat katalog paket (data demo)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `/dashboard` | Metrik per tahap: **Dapatkan** (lead → berlangganan), **Layani** (% selesai tanpa CS, waktu respons, tiket terbuka), **Pertahankan** (% penerima kampanye yang kembali/converted), dan **Efisiensi AI** (% pesan yang memakai AI, perkiraan token) — update realtime                                                                                                                                                                                                                                                                                                                                                          |
| `/`          | Redirect ke `/dashboard`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Header berisi **pemilih mitra** (multi-mitra) dan navigasi. Saat demo, `/chat` dan `/inbox` (atau `/dashboard`) harus enak dibuka berdampingan.

### 5.2 Struktur folder

```
src/
  app/(app)/inbox|tickets|campaigns|knowledge|dashboard/page.tsx
  app/chat/page.tsx
  components/
    chat/ ChatSidebar, EmptyState, SuggestionCards, CustomerMessage, AssistantMessage, ButtonReplies, PackageCard, ImageMessage, AudioMessage, ChatComposer, VoiceRecorder, ThinkingIndicator
    inbox/ ConversationList, HandoffBanner, BotSummary, ReplyBox
    campaigns/ SegmentBuilder, TemplatePicker, RecipientTable
    dashboard/ KpiTile, StageSection, FunnelRow
    ui/ Button, Badge, Card, Input, Select, Toggle, EmptyState, Toast
    layout/ AppHeader, PartnerSwitcher
  lib/ api.ts, pusher.ts
  hooks/ useConversation, useInbox, useMetrics, usePartner
  types/
```

### 5.3 Gaya visual (design tokens Tailwind)

- Bersih, modern, profesional; tanpa gradien mencolok dan tanpa emoji di UI.
- Warna: canvas `#F4F6F8`, surface `#FFFFFF`, text `#101828`, text-secondary `#475467`, border `#E4E7EC`, accent `#0B6E8A`, accent-strong `#084F63`, accent-soft `#E6F2F6`, success `#067647`/`#E7F6EE`, warning `#B54708`/`#FEF0E6`, danger `#B42318`/`#FEF3F2`, gelembung pelanggan `#D7EEF5`.
- Warna tahap (konsisten di badge & dashboard): Dapatkan = teal, Layani = biru, Pertahankan = ungu — selalu dengan label teks, tidak hanya warna.
- Font via `next/font`: Space Grotesk (judul, angka KPI), Inter (UI).
- Ikon `lucide-react`. Radius 8 (kontrol), 12 (kartu), 14–18 (gelembung chat).
- Aksesibilitas: `<button>`/`<a>`/`<input>` + label, target sentuh ≥ 44 px, kontras WCAG AA. Responsif: kolom menumpuk di HP, tabel bisa di-scroll horizontal.

### 5.4 Env frontend

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
```

## 6. Kontrak realtime (Pusher)

| Channel                           | Event                    | Payload                               |
| --------------------------------- | ------------------------ | ------------------------------------- |
| `conversation-{id}`             | `message:new`          | `Message`                           |
| `conversation-{id}`             | `bot:typing`           | `{ isTyping }`                      |
| `conversation-{id}`             | `conversation:status`  | `{ status, stage, handoffReason? }` |
| `partner-{partnerId}-inbox`     | `conversation:updated` | ringkasan conversation                |
| `partner-{partnerId}-tickets`   | `ticket:updated`       | `SupportTicket`                     |
| `partner-{partnerId}-metrics`   | `metrics:update`       | `Metrics`                           |
| `partner-{partnerId}-campaigns` | `campaign:progress`    | `{ campaignId, sent, total }`       |

Prototipe boleh memakai public channel. Payload kecil; untuk data besar kirim ID lalu fetch detail.

## 7. Data seed (semua berlabel demo)

- 2 mitra: **"Mitra Internet Demo"** (utama) dan 1 mitra kedua untuk membuktikan multi-mitra.
- 3–4 paket (`Paket Demo A/B/C`), 1–2 promo, 4–6 area cakupan (minimal 1 di luar cakupan).
- 30–50 pelanggan dummy dengan variasi: lead, aktif (tagihan lunas, belum lunas, jatuh tempo dekat), pasif, berhenti; sebagian `marketingOptIn = true`.
- 15–25 FAQ (tagihan, pembayaran, gangguan, pemasangan, upgrade, berhenti langganan).
- 3 segmen dan 3 template contoh (pengingat tagihan, tawaran upgrade, ajak kembali).
- 2 akun agen CS dummy.
- Jangan memakai nama, logo, harga, atau data asli perusahaan mana pun.

## 8. Skenario uji (wajib lolos sebelum demo)

1. **Dapatkan:** calon pelanggan → cek cakupan → pilih paket → jadwal pasang → muncul di dashboard. Alur ini sebagian besar **tanpa AI**.
2. **Di luar cakupan:** bot menawarkan daftar tunggu dengan sopan.
3. **Layani — FAQ:** pertanyaan teks bebas dijawab dari FAQ (label AI tampil); pertanyaan di luar FAQ → handoff.
4. **Layani — foto:** foto router (gambar dummy) → bot memberi langkah perbaikan → tiket gangguan dibuat.
5. **Layani — voice note:** voice note keluhan → transkrip muncul di inbox → ditangani seperti teks.
6. **Handoff:** pelanggan minta diskon → status `NEEDS_HUMAN` → CS ambil alih → balas → kembalikan ke bot.
7. **Pertahankan:** buat segmen "tagihan jatuh tempo 3 hari" → jalankan kampanye → pesan masuk ke simulator → pelanggan membalas "bayar" → `converted = true` → dashboard berubah realtime.
8. **Opt-in:** kampanye marketing tidak terkirim ke pelanggan dengan `marketingOptIn = false`.
9. **Keamanan:** pelanggan mengirim/meminta OTP → bot menolak dengan sopan.
10. **Kuota AI habis (simulasi 429):** bot mengirim pesan cadangan + handoff, backend tidak crash.
11. **Multi-mitra:** ganti mitra di header → data inbox, kampanye, dan dashboard ikut berganti.

Tulis checklist ini di `TESTING.md`.

## 9. Urutan pengerjaan (fase)

- **Fase 1 — Fondasi backend:** setup Express + TS, env validation, Prisma schema 18 tabel + seed, `/health`, deploy awal ke Vercel.
- **Fase 2 — Mesin aturan:** router, alur Dapatkan dan Layani berbasis tombol/kata kunci, endpoint chat. Uji tanpa AI sama sekali.
- **Fase 3 — Gemini:** wrapper AI, klasifikasi niat, jawaban FAQ, guardrails, handoff, penanganan 429.
- **Fase 4 — Realtime + frontend inti:** Pusher, setup Next.js + tema, halaman `/chat` dan `/inbox`.
- **Fase 5 — Multimodal:** unggah foto dan voice note di simulator, `analyzeImage` dan `understandVoiceNote`, tiket otomatis.
- **Fase 6 — Pertahankan:** segmen, template, kampanye, cron + tombol jalankan, `/campaigns`.
- **Fase 7 — Dashboard & polishing:** `/dashboard`, `/tickets`, `/knowledge`, state kosong/loading/error, 11 skenario uji, deploy kedua project + isi env di Vercel.
- **Fase 8 (opsional) — WhatsApp:** webhook WhatsApp Business Platform memakai `router.ts` yang sama.

## 10. Definisi selesai

- [ ] Kedua project berjalan lokal (`npm run dev`) dan ter-deploy di Vercel.
- [ ] Tidak ada secret di repo; `.env.example` lengkap; README berisi cara setup ≤ 10 langkah.
- [ ] 11 skenario di bagian 8 lolos.
- [ ] Dashboard menunjukkan metrik ketiga tahap dan persentase pesan yang memakai AI.
- [ ] Semua data adalah data demo; tidak ada data pelanggan asli yang dikirim ke Gemini.
