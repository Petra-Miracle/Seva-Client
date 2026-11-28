
# Prompt Improvement — SevaAI (Progress 2)

> Salin seluruh isi di bawah garis ini ke AI coding agent kamu.
> Kerjakan per FASE. Setelah setiap fase selesai, BERHENTI: tampilkan ringkasan perubahan, file yang diubah, cara menguji, dan hasil uji, lalu tunggu konfirmasi sebelum lanjut.

---

## 0. Konteks dan tujuan

Kamu melanjutkan pengembangan **SevaAI**, sistem layanan pelanggan multi-mitra berbasis chat untuk penyedia internet (data demo). Struktur proyek:

- Frontend: `D:\Seva-Client` (Next.js + TypeScript + Tailwind), live di `https://seva-client.vercel.app`
- Backend: `D:\Seva-Backend` (Express + TypeScript + Prisma + Pusher + Gemini via `@google/genai`)

**Tujuan improvement:** mengubah SevaAI dari "chatbot menu berbasis kata kunci" menjadi **CS yang mengenal pelanggannya, peduli saat mereka kesal, dan menyapa lebih dulu sebelum mereka mengeluh.** Tiga pembeda yang harus bisa dibuktikan saat demo:

1. **Ingat konteks:** jawaban selalu memakai data pelanggan (paket, tagihan, tiket, gangguan di area).
2. **Peka emosi:** mendeteksi pelanggan yang kesal, menyesuaikan nada, menaikkan prioritas, dan mengukur sentimen.
3. **Proaktif:** memberi tahu pelanggan tentang gangguan di area mereka sebelum mereka melapor, lalu menindaklanjuti setelah pulih.

### Aturan kerja (wajib)

1. **Baca kode yang ada dulu** sebelum mengubah apa pun. Sesuaikan nama file/fungsi di prompt ini dengan struktur yang sebenarnya; jangan membuat struktur paralel yang menduplikasi logika.
2. Perubahan sekecil mungkin yang menyelesaikan masalah. Jangan merombak bagian yang sudah berjalan baik (tampilan chat, simulasi 3 jenis pelanggan, pemilih mitra, dashboard per tahap).
3. Tidak ada secret di kode. Tidak ada data pelanggan asli. Semua data tetap berlabel demo.
4. Jangan mengarang angka di UI. Metrik yang berupa perkiraan wajib diberi label "perkiraan".
5. Setiap perubahan skema database lewat migration Prisma + update seed.
6. Catat setiap keputusan penting di `DECISIONS.md` dan hasil uji di `TESTING.md`.

---

## 1. Bukti masalah (hasil uji langsung di versi live)

| # | Langkah                                                                                           | Hasil sekarang                                                    | Masalah                                                                                     |
| - | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1 | Pelanggan baru klik "Pasang internet baru"                                                        | Bot menyapa + tombol Cek cakupan / Lihat paket / Kembali          | ✅ Berjalan baik                                                                            |
| 2 | Ketik: *"internet saya udah 2 hari mati terus, kesel bgt, padahal tagihan udh dibayar"*         | "Belum ada tagihan untuk Kakak saat ini."                         | Kata kunci "tagihan" membajak niat utama (internet mati). Emosi diabaikan. Tidak ada tiket. |
| 3 | Pelanggan aktif ketik: *"wifi saya lampunya merah2 dari kemarin, gimana ya? udah restart juga"* | "Halo Kak! Ada yang bisa SevaAI bantu? Ketik 'menu' untuk mulai." | Teks bebas tidak dipahami sama sekali. Fallback menyuruh pelanggan mengulang.               |
| 4 | Buka `/dashboard`                                                                               | "Dijawab AI: 0%" dari 103 pesan                                   | Gemini tidak pernah berhasil dipanggil di produksi.                                         |
| 5 | Navigasi keyboard di layar awal chat                                                              | Kartu saran berupa `div` (bukan `button`)                     | Tidak bisa difokus/diaktifkan dengan keyboard.                                              |
| 6 | Label pengirim pesan                                                                              | Semua balasan berlabel "Asisten"                                  | Tidak membedakan Bot (aturan) vs AI.                                                        |

---

## FASE 1 — Diagnosis & hidupkan Gemini (wajib pertama)

**Tujuan:** memastikan Gemini benar-benar terpanggil di lokal DAN di Vercel.

1. Cek alur pemanggilan AI dari router sampai wrapper Gemini. Cari kondisi yang membuat AI tidak pernah dipanggil (misalnya fallback "Ketik menu" dijalankan sebelum AI, flag fitur mati, atau error yang ditelan `try/catch` tanpa log).
2. Cek Environment Variables di backend Vercel: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_MODEL_LITE`. Pastikan nama model sesuai ID yang tersedia di Google AI Studio saat ini (nama model sering berganti). Validasi env saat startup dengan zod; jika kosong, log error yang jelas.
3. Tambahkan endpoint diagnostik `GET /api/health/ai` (dilindungi header `x-admin-key` dari env `ADMIN_KEY`) yang memanggil model Flash-Lite dengan prompt pendek dan mengembalikan `{ ok, model, latencyMs, error? }`. Jangan pernah mengembalikan API key.
4. Logging terstruktur untuk setiap pemanggilan AI: `{ conversationId, purpose, model, latencyMs, tokens, status, errorCode }`. Error dari Gemini (termasuk 429 dan error nama model) **tidak boleh ditelan diam-diam**.
5. Pastikan setiap balasan yang dihasilkan AI tersimpan dengan `sender = AI`, `usedAi = true`, `aiModel`, dan `aiTokens`, sehingga dashboard "Dijawab AI" ikut berubah.

**Kriteria selesai:**

- [ ] `GET /api/health/ai` mengembalikan `ok: true` di lokal dan di Vercel.
- [ ] Mengirim pesan teks bebas di versi live menghasilkan balasan berlabel AI.
- [ ] Dashboard "Dijawab AI" > 0%.

---

## FASE 2 — Rombak router pesan (pemahaman niat)

**Masalah:** kata kunci dicocokkan sebelum memahami kalimat, dan teks yang tidak cocok jatuh ke "Ketik menu".

### 2.1 Urutan router yang baru

1. Jika conversation berstatus `NEEDS_HUMAN` / `HUMAN` → bot diam, teruskan ke inbox CS.
2. **Klik tombol (payload)** → lanjutkan alur aturan. Tanpa AI.
3. **Perintah pendek yang pasti** (≤ 3 kata dan cocok persis dengan daftar perintah: `menu`, `cek tagihan`, `lapor gangguan`, `pasang baru`, `bicara dengan cs`) → alur aturan. Tanpa AI.
4. **Semua teks lain** (kalimat bebas, lebih dari 3 kata, atau mengandung lebih dari satu topik) → **wajib lewat `analyzeMessage` (AI)** sebelum memilih alur. Kata kunci boleh dipakai sebagai *petunjuk* yang dikirim ke AI, bukan sebagai penentu.
5. Jika AI gagal (error/429) → **fallback heuristik** berbasis kata kunci berbobot (gangguan > tagihan bila ada kata "mati", "lambat", "lampu merah", "LOS", "tidak bisa connect"), lalu tawarkan pilihan yang paling mungkin dengan tombol. Jangan menyuruh pelanggan mengetik ulang.

### 2.2 Fungsi `analyzeMessage` (Gemini Flash-Lite, structured output)

Input: teks pelanggan, 6 pesan terakhir, ringkasan konteks pelanggan (Fase 3), daftar niat yang tersedia.
Output JSON (validasi dengan zod; jika tidak valid → fallback heuristik):

```json
{
  "primaryIntent": "OUTAGE_REPORT",
  "secondaryIntents": ["BILLING_STATUS"],
  "stage": "SUPPORT",
  "sentiment": "NEGATIVE",
  "frustrationLevel": 2,
  "urgency": "HIGH",
  "entities": { "durationText": "2 hari", "claimsPaid": true, "routerLight": "red" },
  "needsHuman": false,
  "needsHumanReason": null,
  "confidence": 0.86
}
```

Daftar niat minimal: `NEW_INSTALL`, `COVERAGE_CHECK`, `PACKAGE_INFO`, `BILLING_STATUS`, `PAYMENT_HOW`, `OUTAGE_REPORT`, `SLOW_INTERNET`, `INSTALL_STATUS`, `UPGRADE`, `CANCEL`, `PROMO_REPLY`, `GENERAL_QUESTION`, `SMALLTALK`, `TALK_TO_HUMAN`, `UNKNOWN`.

- `frustrationLevel`: 0 = tenang, 1 = sedikit kesal, 2 = kesal, 3 = marah/kasar.
- Jika `confidence < 0.6` → tanyakan klarifikasi dengan 2–3 tombol pilihan niat teratas.

### 2.3 Menangani lebih dari satu niat

Jika ada `secondaryIntents`, jawaban harus menangani niat utama lebih dulu, lalu menyinggung niat kedua dengan singkat. Contoh: keluhan internet mati + "padahal sudah bayar" → tangani gangguan, sekaligus konfirmasi status tagihan dari data.

### 2.4 Fallback yang manusiawi

Ganti semua "Ketik 'menu' untuk mulai" dengan: *"Maaf Kak, saya belum yakin maksudnya. Apakah ini tentang salah satu ini?"* + tombol 3 niat paling mungkin + tombol "Bicara dengan CS".

**Kriteria selesai:**

- [ ] Pesan uji #2 (bagian 1) dikenali sebagai `OUTAGE_REPORT` + `BILLING_STATUS`, sentimen negatif.
- [ ] Pesan uji #3 dikenali sebagai `OUTAGE_REPORT` dengan `routerLight = red`.
- [ ] Tidak ada lagi balasan "Ketik 'menu' untuk mulai".

---

## FASE 3 — Konteks pelanggan di setiap jawaban

**Tujuan:** SevaAI tidak pernah bertanya hal yang sudah diketahui.

### 3.1 `buildCustomerContext(customerId)`

Kembalikan ringkasan ringkas (maks ± 800 karakter) yang dikirim ke setiap pemanggilan AI:

- nama panggilan, tahap siklus (`lifecycleStage`)
- paket aktif + kecepatan, status langganan
- tagihan terakhir: periode, jumlah, jatuh tempo, status (`PAID`/`UNPAID`/`OVERDUE`)
- tiket terbuka: jumlah, kategori, umur tiket
- **gangguan aktif di area pelanggan** (dari Fase 5, jika ada)
- jumlah keluhan dalam 30 hari terakhir
- ringkasan percakapan sebelumnya (jika ada)

Jangan sertakan nomor HP lengkap atau data yang tidak relevan.

### 3.2 Alur `OUTAGE_REPORT` / `SLOW_INTERNET` (berbasis data + AI)

1. Cek status pelanggan:
   - Pelanggan baru/belum berlangganan → jelaskan dengan sopan bahwa layanan belum aktif dan tawarkan alur pasang baru atau CS.
   - Tagihan `OVERDUE` → sampaikan dengan halus bahwa layanan mungkin terdampak tagihan, beri cara bayar.
   - Tagihan `PAID` dan pelanggan bilang "sudah bayar" → **konfirmasi bahwa tagihannya memang lunas**.
2. Cek **gangguan aktif di area** → jika ada, sampaikan estimasi pulih dan bahwa pelanggan tidak perlu melapor.
3. Jika tidak ada gangguan area → berikan langkah troubleshooting singkat (dari FAQ) sesuai entitas (`routerLight`, "sudah restart" → lewati langkah restart).
4. Jika masalah berlanjut / sudah > 1 hari / pelanggan sudah restart → **buat tiket otomatis** dan tampilkan kartu tiket (nomor, kategori, prioritas, status).
5. Tawarkan follow-up: "Saya kabari lagi begitu ada perkembangan."

### 3.3 Prompt penyusun jawaban (`composeReply`, model Flash)

Aturan untuk model:

- Gunakan HANYA fakta dari konteks pelanggan, hasil tool, dan potongan FAQ yang diberikan. Jangan mengarang harga, tanggal pulih, kompensasi, atau diskon.
- Maksimal 3–4 kalimat + elemen interaktif (tombol/kartu) bila relevan.
- Bahasa Indonesia santai-sopan, sapaan "Kak".
- Jika `frustrationLevel ≥ 2`: buka dengan pengakuan perasaan yang tulus dan spesifik (misalnya "2 hari tanpa internet pasti bikin repot"), tanpa basa-basi berlebihan, lalu langsung ke tindakan.

**Contoh jawaban target untuk pesan uji #2** (pelanggan aktif, tagihan lunas, ada gangguan area):

> "Maaf banget Kak, 2 hari tanpa internet pasti bikin repot. Tagihan Kakak bulan ini sudah lunas, jadi ini bukan soal pembayaran. Ternyata sedang ada gangguan jaringan di area Kakak, estimasi pulih [jam dari data]. Laporan Kakak sudah saya catat (#[nomor tiket]) dan saya kabari begitu normal."

**Kriteria selesai:**

- [ ] Pesan uji #2 sebagai pelanggan aktif (tagihan lunas) → jawaban mengakui emosi, mengonfirmasi tagihan lunas, dan membuat/mengaitkan tiket.
- [ ] Pesan uji #2 sebagai pelanggan baru → dijelaskan bahwa belum ada layanan aktif, bukan "Belum ada tagihan".
- [ ] Pesan uji #3 → langkah troubleshooting yang tidak mengulang "restart", lalu tiket.

---

## FASE 4 — Peka emosi & sentimen terukur

### 4.1 Skema

Tambahkan kolom (migration):

- `Message.sentiment` (`POSITIVE` | `NEUTRAL` | `NEGATIVE`, nullable) dan `Message.frustrationLevel` (Int, nullable) — diisi dari `analyzeMessage` untuk pesan pelanggan.
- `Conversation.sentimentStart`, `Conversation.sentimentEnd` (nullable), `Conversation.priority` (`NORMAL` | `HIGH` | `URGENT`).

### 4.2 Aturan

- `frustrationLevel = 2` → `Conversation.priority = HIGH`, tiket yang dibuat berprioritas tinggi.
- `frustrationLevel = 3`, atau pelanggan kesal pada 2 pesan berturut-turut, atau ≥ 2 tiket terbuka → **handoff ke CS** dengan `handoffReason = "PELANGGAN_KESAL"` dan ringkasan otomatis (masalah, data pelanggan, apa yang sudah dicoba bot).
- `sentimentStart` = sentimen pesan pelanggan pertama; `sentimentEnd` = sentimen pesan pelanggan terakhir saat percakapan ditutup atau 30 menit tanpa aktivitas.
- Setelah masalah selesai, kirim satu pertanyaan kepuasan singkat dengan tombol: "Terbantu" / "Belum".

### 4.3 Inbox CS

- Urutkan inbox berdasarkan `priority`, lalu waktu.
- Tampilkan badge sentimen (dengan teks, bukan hanya warna/ikon): "Kesal", "Netral", "Puas".

**Kriteria selesai:**

- [ ] Pesan uji #2 menghasilkan prioritas HIGH dan badge "Kesal" di inbox.
- [ ] Pesan kasar → handoff otomatis dengan ringkasan.

---

## FASE 5 — Proaktif: notifikasi gangguan area (fitur pembeda utama)

### 5.1 Skema baru

```
OutageIncident
  id, partnerId, title, description,
  villages String[]           // daftar kelurahan terdampak (cocokkan dengan Customer.village)
  status  (ACTIVE | RESOLVED)
  startedAt, estimatedRestoreAt?, resolvedAt?
  createdBy (agentId)

OutageNotification
  id, incidentId, customerId,
  notifiedAt, followUpSentAt?,
  followUpAnswer (RESOLVED | STILL_DOWN | null),
  reportedBeforeNotice Boolean   // pelanggan sudah melapor sebelum diberi tahu
```

Tambahkan `SupportTicket.incidentId?` agar tiket bisa dikaitkan ke insiden.

### 5.2 Alur

1. **Admin membuat insiden** di halaman baru `/outages`: judul, kelurahan terdampak (multi-pilih dari `CoverageArea`), estimasi pulih. Tampilkan pratinjau "[jumlah] pelanggan aktif terdampak".
2. **Kirim pemberitahuan** (tombol "Beri tahu pelanggan terdampak"): untuk setiap pelanggan aktif di kelurahan tersebut, kirim pesan kategori **UTILITY** ke percakapan simulator:
   > "Halo Kak [nama], ada gangguan jaringan di area Kakak sejak [jam]. Tim kami sedang menangani, estimasi pulih [jam]. Kakak tidak perlu melapor, kami kabari lagi ya."
   > Buat `OutageNotification`. Kirim progres via Pusher (`outage:progress`).
   >
3. **Selama insiden aktif:** pelanggan di area itu yang menghubungi soal gangguan langsung mendapat info insiden (Fase 3.2), dan tiketnya dikaitkan ke `incidentId` (bukan tiket baru yang terpisah).
4. **Tandai pulih** (tombol "Tandai sudah pulih"): status `RESOLVED`, lalu kirim follow-up ke semua yang diberi tahu:
   > "Kak [nama], jaringan di area Kakak sudah normal kembali. Internetnya sudah lancar?"
   > dengan tombol **"Sudah lancar"** / **"Masih bermasalah"**. "Masih bermasalah" → buat tiket individual prioritas tinggi.
   >
5. Pesan-pesan ini ditandai `sender = BOT` dan template, bukan AI (tidak memakai kuota).

### 5.3 Realtime

- Channel `partner-{partnerId}-outages`: `outage:created`, `outage:progress`, `outage:resolved`.

**Kriteria selesai:**

- [ ] Admin membuat insiden → pelanggan terdampak menerima pesan di simulator tanpa melapor.
- [ ] Pelanggan terdampak yang chat soal gangguan mendapat info insiden + tiket terkait insiden.
- [ ] Tandai pulih → follow-up terkirim → "Masih bermasalah" membuat tiket baru.

---

## FASE 6 — Dashboard: bukti pembeda

Tambahkan ke `/dashboard` (tetap dikelompokkan per tahap, angka dari data, perkiraan diberi label):

**Layani:**

- **Sentimen awal → akhir:** persentase percakapan yang membaik (`sentimentStart` negatif → `sentimentEnd` netral/positif).
- **Kepuasan:** persentase "Terbantu" dari pertanyaan kepuasan.
- Percakapan prioritas tinggi & handoff karena pelanggan kesal.

**Proaktif (kartu baru):**

- Insiden aktif / selesai.
- Pelanggan diberi tahu sebelum melapor.
- **Laporan gangguan yang tidak perlu dibuat (perkiraan):** jumlah pelanggan terdampak yang diberi tahu dan tidak membuat laporan gangguan selama insiden. Beri label jelas "perkiraan" dan tooltip cara hitungnya.
- Hasil follow-up: "Sudah lancar" vs "Masih bermasalah".

**Efisiensi AI:** pastikan kartu "Dijawab AI" menghitung `usedAi = true`; tambahkan "pesan ditangani Bot (tanpa AI)" agar desain hybrid terlihat.

---

## FASE 7 — Perbaikan UI & aksesibilitas

1. **Kartu saran di layar awal** → ubah dari `div` menjadi `<button type="button">` (atau `<a>` bila navigasi), dengan focus ring terlihat, bisa diaktifkan dengan Enter/Space. Periksa elemen klik lain (pilihan "Simulasikan sebagai", item riwayat) dengan aturan yang sama.
2. **Label pengirim:** ganti "Asisten" menjadi label yang jelas: **"Bot"** (balasan aturan/template), **"AI"** (balasan Gemini), **"CS · [nama]"** (agen manusia). Tambahkan tooltip singkat penjelas.
3. **Indikator proses yang informatif:** tampilkan apa yang sedang dikerjakan, misalnya "SevaAI sedang memeriksa tagihan…", "SevaAI sedang mengecek gangguan di area Kakak…", sesuai tool yang dipanggil.
4. **Kartu tiket** di chat (nomor, kategori, prioritas, status) dan **kartu pemberitahuan gangguan** (judul, sejak, estimasi pulih).
5. Status koneksi "Menunggu koneksi" di sidebar: pastikan berubah menjadi terhubung setelah Pusher tersambung, dan tampilkan pesan yang jelas jika gagal.
6. Halaman baru `/outages` mengikuti gaya dashboard yang ada (desain token yang sama), responsif, dan tombol aksi pentingnya meminta konfirmasi.

---

## FASE 8 — Data seed & skenario uji

### 8.1 Update seed

- Pastikan pelanggan aktif tersebar di minimal 3 kelurahan; satu kelurahan berisi ≥ 8 pelanggan aktif untuk demo insiden.
- Variasi tagihan: lunas, belum lunas, terlambat.
- Tambahkan FAQ troubleshooting: lampu router merah/LOS, lampu mati, internet lambat, sudah restart tapi belum normal.
- 1 insiden contoh berstatus `RESOLVED` (riwayat) — insiden aktif dibuat saat demo.

### 8.2 Skenario uji (tulis di `TESTING.md`, semua wajib lolos)

| #  | Skenario                                                                                                    | Hasil yang diharapkan                                                                          |
| -- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1  | Pelanggan aktif (lunas): *"internet saya udah 2 hari mati terus, kesel bgt, padahal tagihan udh dibayar"* | Empati spesifik, konfirmasi tagihan lunas, cek gangguan area, tiket prioritas tinggi, label AI |
| 2  | Pelanggan baru, pesan yang sama                                                                             | Dijelaskan belum ada layanan aktif + tawaran pasang/CS; bukan "Belum ada tagihan"              |
| 3  | Pelanggan aktif: *"wifi saya lampunya merah2 dari kemarin, gimana ya? udah restart juga"*                 | Troubleshooting tanpa mengulang restart → tiket                                               |
| 4  | Pelanggan dengan tagihan terlambat melapor internet mati                                                    | Disampaikan halus soal tagihan + cara bayar                                                    |
| 5  | Pesan ambigu: *"halo kak mau nanya"*                                                                      | Pertanyaan klarifikasi dengan tombol, bukan "Ketik menu"                                       |
| 6  | Pesan kasar/marah 2x berturut-turut                                                                         | Handoff ke CS dengan ringkasan, prioritas URGENT, badge "Kesal"                                |
| 7  | Admin membuat insiden di kelurahan X                                                                        | Semua pelanggan aktif di X menerima pemberitahuan tanpa melapor                                |
| 8  | Pelanggan di X chat "internet mati" saat insiden aktif                                                      | Diberi info insiden, tiket dikaitkan ke insiden                                                |
| 9  | Admin menandai pulih                                                                                        | Follow-up terkirim; "Masih bermasalah" → tiket baru                                           |
| 10 | Simulasi Gemini error/429                                                                                   | Fallback heuristik + tombol pilihan, tidak crash, tercatat di log                              |
| 11 | Navigasi keyboard di layar awal chat                                                                        | Semua kartu saran bisa difokus dan diaktifkan                                                  |
| 12 | Dashboard setelah skenario 1–9                                                                             | "Dijawab AI" > 0%, sentimen awal→akhir, kartu Proaktif terisi dari data                       |

---

## 9. Urutan & definisi selesai

Urutan wajib: **Fase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.** Fase 1 adalah prasyarat semua fase lain.

Definisi selesai keseluruhan:

- [ ] 12 skenario di Fase 8 lolos di versi yang ter-deploy di Vercel (bukan hanya lokal).
- [ ] Tidak ada balasan "Ketik 'menu' untuk mulai".
- [ ] Dashboard menampilkan bukti tiga pembeda: konteks (tiket & tagihan terkonfirmasi), emosi (sentimen awal→akhir), proaktif (pelanggan diberi tahu sebelum melapor).
- [ ] Semua perubahan skema lewat migration; seed diperbarui; `DECISIONS.md` dan `TESTING.md` diperbarui.
- [ ] Tidak ada secret di repo dan tidak ada data pelanggan asli.
