# Prompt Design Tambahan — SevaAI

> Berikan prompt ini ke agen desain di pen.dev, dengan file `Pendev/SevaAI.pen` terbuka.
> Kerjakan per BAGIAN. Setelah satu bagian selesai, ambil screenshot, cek tidak ada layout yang rusak atau terpotong, lalu lanjut ke bagian berikutnya.

---

## 0. Konteks dan aturan

Kamu melanjutkan file `SevaAI.pen`. File ini sudah punya frame **"01 Design System"** berisi token (warna, tipografi, spasi, radius) dan sekitar 36 komponen reusable. Belum ada **satu pun layar halaman**. Tugasmu:

1. Melengkapi komponen yang belum ada (Bagian A).
2. Menyusun layar per halaman dari komponen yang ada (Bagian B–H).

Aturan wajib:

- **Pakai variabel yang sudah ada**, jangan menulis hex langsung: `$bg-canvas`, `$bg-surface`, `$text-primary`, `$text-secondary`, `$border-default`, `$accent-*`, `$status-*`, `$chat-customer-bg`, `$stage-acquire-*` (Dapatkan, teal), `$stage-serve-*` (Layani, biru), `$stage-retain-*` (Pertahankan, ungu), `$sender-bot-*`, `$sender-ai-*`, `$font-heading` (Space Grotesk), `$font-body` (Inter), `$radius-control` (8), `$radius-card` (12), `$radius-bubble`, `$space-1..8`.
- **Pakai ulang komponen yang ada** sebagai instance (`ref`): AppHeader, ChatHeader, Sidebar/History, Sidebar/HistoryItem, ChatBubble/Customer, ChatAnswer/Bot, ChatAnswer/AI, ChatMessage/System, ChatMessage/Photo, ChatMessage/VoiceNote, SuggestionCard, ChatInput/Floating, ProcessingIndicator, VoiceRecorder, Card/Package, Card/Bill, Card/Ticket, Card/Location, Banner/Handoff, Toast, Modal/Confirm, EmptyState, KpiTile/Primary, FunnelRow, Table/HeaderRow, Table/DataRow, SegmentRule, TemplateCard, Panel/CustomerProfile. Hanya buat komponen baru jika benar-benar belum ada.
- Tanpa gradien mencolok dan **tanpa emoji**. Ikon pakai Lucide.
- Warna tahap **selalu disertai label teks** (Dapatkan / Layani / Pertahankan).
- Target sentuh ≥ 44 px, kontras WCAG AA.
- **Semua isi berupa data demo.** Nama pelanggan pakai nama netral ("Pelanggan Demo 01", "Rina (demo)"). Mitra: "Mitra Internet Demo" dan "Mitra Kedua Demo". Paket: "Paket Demo A/B/C".
- **Jangan mengarang angka bisnis.** Untuk harga, kecepatan, persentase, dan jumlah, pakai placeholder dalam kurung siku seperti `[Rp harga]`, `[xx Mbps]`, `[xx %]`, `[jumlah]`. Komponen yang sudah ada juga memakai gaya ini.
- Tampilkan badge kecil **"Data demo"** di header setiap halaman.
- Ukuran frame: desktop **1440 × 900** (boleh lebih tinggi untuk halaman yang di-scroll), mobile **390 × 844**.
- Beri nama yang jelas pada setiap frame, misalnya `02 Chat — Kosong (Desktop)`. Tempatkan layar berjajar di kanan frame Design System dengan `FindEmptySpace`, tanpa saling tumpang tindih.

---

## A. Komponen yang belum ada

Tambahkan komponen berikut ke frame "01 Design System" dalam section baru **"Komponen — Tambahan"**. Setiap komponen dibuat reusable.

### A1. Chat (pelanggan)

1. **CustomerPicker**: pemilih pelanggan dummy di sidebar chat. Tiga opsi segmented: *Baru (lead)*, *Aktif*, *Pasif*. Masing-masing dengan keterangan satu baris dan tombol "Mulai percakapan".
2. **Card/Coverage**: hasil cek cakupan, dua varian:
   - *Tercakup*: ikon centang, alamat desa/kecamatan, tombol "Lihat paket".
   - *Di luar cakupan*: ikon info, teks sopan, tombol "Daftar tunggu" dan "Cek alamat lain".
3. **Card/ScheduleSlot**: pemilih jadwal pemasangan. Deretan chip tanggal (5 hari) ditambah chip slot waktu (Pagi / Siang / Sore), dengan state terpilih dan nonaktif.
4. **Card/OrderSummary**: ringkasan konfirmasi berisi paket, kecepatan, biaya bulanan `[Rp]`, biaya pasang `[Rp]`, jadwal, dan alamat, plus tombol "Konfirmasi" dan "Ubah".
5. **ChatMessage/Campaign**: pesan kampanye yang masuk ke pelanggan. Ada label "Pesan dari Mitra Internet Demo", badge kategori (*Pengingat* = UTILITY, *Penawaran* = MARKETING), body template, dan tombol balasan cepat ("Bayar sekarang", "Nanti saja").
6. **ChatMessage/Fallback**: pesan cadangan saat kuota AI habis, berupa nada netral/warning, teks sopan, dan tombol "Hubungi CS".
7. **ChatMessage/SecurityRefusal**: balasan penolakan permintaan OTP/PIN dengan ikon perisai.
8. **MobileDrawer/ChatSidebar**: sidebar riwayat dalam bentuk drawer mobile dengan overlay gelap transparan dan tombol tutup.

### A2. Inbox CS

9. **Inbox/ConversationItem**: berisi avatar inisial, nama, cuplikan pesan terakhir, waktu, badge tahap, badge status (`Bot`, `Perlu CS`, `Ditangani CS`, `Selesai`), dan badge alasan handoff bila ada. Varian: default, terpilih, belum dibaca.
10. **Inbox/FilterBar**: tab status (Semua / Perlu CS / Ditangani CS / Bot / Selesai) dengan jumlah, ditambah kolom cari.
11. **Inbox/BotSummary**: kartu "Ringkasan dari bot" berisi 2–3 baris ringkasan, alasan handoff, dan label sumber ("Dibuat AI" atau "Dari aturan").
12. **Inbox/VoiceTranscript**: blok transkrip voice note di bawah pesan audio (teks miring dan label "Transkrip AI").
13. **Inbox/ReplyBox**: kolom balas CS berisi textarea, tombol kirim, dan state nonaktif dengan teks "Ambil alih percakapan untuk membalas".
14. **Inbox/DetailHeader**: berisi nama pelanggan, badge tahap dan status, tombol **Ambil alih** (primary) atau **Kembalikan ke bot** (secondary), sesuai state.

### A3. Kampanye, Knowledge, Dashboard

15. **Campaign/ListItem**: berisi nama kampanye, segmen, template, jadwal, badge status (`Draf`, `Terjadwal`, `Terkirim`), dan tombol "Jalankan sekarang".
16. **Campaign/Progress**: progress bar "Terkirim [n] dari [total]" dengan state berjalan dan selesai.
17. **Campaign/OptInNotice**: catatan info "[n] pelanggan dilewati karena belum memberi izin pemasaran".
18. **Recipient status chip**: Terkirim / Dibaca / Membalas / Converted.
19. **Knowledge/FaqRow**: berisi kategori, pertanyaan, cuplikan jawaban, chip kata kunci, toggle aktif, dan tombol edit.
20. **Knowledge/FaqForm**: form dalam drawer kanan dengan field kategori (select), pertanyaan, jawaban (textarea), kata kunci (input chip), dan toggle aktif.
21. **Dashboard/StageSection**: header section berisi badge tahap, judul, dan deskripsi satu baris, dengan slot untuk KPI tile.
22. **KpiTile/Secondary**: tile lebih kecil dengan nilai, label, dan teks bantu (misalnya "waktu respons rata-rata").
23. **Dashboard/AiEfficiency**: bar bertumpuk "Tanpa AI vs Dengan AI" `[xx %]`, ditambah perkiraan token `[jumlah]`.
24. **Realtime indicator**: titik hijau kecil dengan label "Live".

### A4. State umum

25. **Skeleton**: baris list, kartu, dan tabel.
26. **ErrorState**: ikon, judul "Gagal memuat data", deskripsi, dan tombol "Coba lagi".
27. **Badge/DataDemo**: badge netral "Data demo".
28. **AppHeader/Mobile**: logo, pemilih mitra versi ringkas, dan tombol menu (hamburger) yang membuka drawer navigasi.

---

## B. Halaman `/chat`: simulator pelanggan

Gaya ruang chat asisten AI modern dengan identitas SevaAI. Layout: sidebar kiri 280 px (Sidebar/History dan CustomerPicker), area percakapan terpusat dengan lebar maksimal 720 px, dan ChatInput/Floating di bawah.

Pesan pelanggan memakai gelembung rata kanan. Jawaban SevaAI ditampilkan sebagai teks penuh tanpa gelembung, dengan label "Bot" atau "AI".

1. **02 Chat — Kosong (Desktop)**: sapaan "Halo, ada yang bisa SevaAI bantu?" dengan 4 SuggestionCard di bawahnya.
2. **03 Chat — Dapatkan (Desktop)**: alur lengkap berisi:

   - pelanggan meminta cek cakupan;
   - Card/Coverage (tercakup);
   - pelanggan memilih kebutuhan lewat chip;
   - 3 Card/Package;
   - Card/ScheduleSlot;
   - Card/OrderSummary;
   - pesan sukses.

   Semua jawaban berlabel "Bot" untuk menunjukkan alur ini tanpa AI.
3. **04 Chat — Di luar cakupan (Desktop)**: Card/Coverage varian di luar cakupan, dengan tombol daftar tunggu.
4. **05 Chat — Layani multimodal (Desktop)**: berisi:

   - pertanyaan FAQ yang dijawab ChatAnswer/AI (label AI);
   - pelanggan mengirim foto router;
   - ProcessingIndicator ("SevaAI sedang menganalisis foto...");
   - jawaban AI berisi langkah perbaikan;
   - Card/Ticket dibuat;
   - satu ChatMessage/VoiceNote dari pelanggan.
5. **06 Chat — Handoff (Desktop)**: pelanggan meminta diskon, lalu ChatMessage/System menampilkan "Percakapan diteruskan ke CS". Composer tetap aktif. Setelahnya ada balasan dari agen CS dengan label "CS".
6. **07 Chat — Kampanye & keamanan (Desktop)**: berisi ChatMessage/Campaign (pengingat tagihan), pelanggan membalas "bayar", Card/Bill, dan konfirmasi. Di bawahnya, contoh pelanggan menulis kode OTP lalu ChatMessage/SecurityRefusal, kemudian contoh ChatMessage/Fallback.
7. **08 Chat — Merekam suara (Desktop)**: composer berganti menjadi VoiceRecorder dengan timer dan batas 60 detik.
8. **09 Chat — Mobile**: tiga frame 390 px:

   - kosong;
   - percakapan aktif;
   - drawer sidebar terbuka.

---

## C. Halaman `/inbox`: CS

Layout tiga kolom: daftar percakapan (360 px), detail percakapan (fleksibel), dan Panel/CustomerProfile (320 px). AppHeader ada di atas, dengan tab "Inbox" aktif.

1. **10 Inbox — Perlu CS**: item yang dipilih berstatus "Perlu CS" dengan alasan "Minta diskon". Detail berisi Banner/Handoff, Inbox/BotSummary, riwayat chat, tombol **Ambil alih**, dan ReplyBox nonaktif.
2. **11 Inbox — Ditangani CS**: setelah ambil alih, ReplyBox aktif, pesan CS terkirim, dan tombol **Kembalikan ke bot** muncul.
3. **12 Inbox — Voice note**: pesan audio pelanggan dengan Inbox/VoiceTranscript di bawahnya.
4. **13 Inbox — Kosong & Modal**: daftar kosong (EmptyState "Tidak ada percakapan yang perlu ditangani"), ditambah varian Modal/Confirm "Kembalikan ke bot?".
5. **14 Inbox — Mobile**: daftar menjadi layar penuh, lalu detail tampil di layar berikutnya dengan tombol kembali. Panel profil bisa dibuka sebagai sheet.

## D. Layout demo berdampingan

15. **15 Demo — Chat + Inbox (1440)**: `/chat` versi ringkas (sekitar 560 px, tanpa sidebar) di kiri dan `/inbox` di kanan. Ini menunjukkan cara membuka kedua halaman saat presentasi juri.

## E. Halaman `/dashboard`

16. **16 Dashboard (Desktop)** berisi:
    - Baris atas: judul "Dashboard", pemilih periode (7 hari / 30 hari), dan indikator "Live".
    - **Dapatkan**: KPI lead, berlangganan, konversi `[xx %]`, dan funnel memakai FunnelRow (Lead → Cek cakupan → Pilih paket → Jadwal → Berlangganan).
    - **Layani**: KPI % selesai tanpa CS, waktu respons rata-rata, tiket terbuka, dan percakapan perlu CS.
    - **Pertahankan**: KPI penerima kampanye, converted `[xx %]`, dan daftar 3 kampanye terakhir.
    - **Efisiensi AI**: Dashboard/AiEfficiency (% pesan memakai AI, perkiraan token, jumlah event kuota 429).
17. **17 Dashboard — Loading & Error**: varian skeleton dan ErrorState.
18. **18 Dashboard — Mobile**: semua section ditumpuk menjadi satu kolom, dengan KPI tile 2 kolom.

## F. Halaman `/campaigns`

19. **19 Kampanye — Daftar**: list Campaign/ListItem dan tombol "Buat kampanye".
20. **20 Kampanye — Buat** (wizard 3 langkah dalam satu layar atau stepper):
    1. **Segmen**: SegmentRule (status tagihan, jatuh tempo ≤ N hari, tahap siklus, hari tidak aktif, kecepatan paket <, lama berlangganan ≥), ditambah pratinjau "[jumlah] pelanggan cocok" dan tabel pratinjau singkat.
    2. **Template**: grid TemplateCard (Pengingat tagihan / Tawaran upgrade / Ajak kembali) dengan badge kategori MARKETING atau UTILITY, plus pratinjau pesan dengan placeholder `{{nama}}` sudah terisi.
    3. **Jadwal & ringkasan**: nama, tujuan, jadwal, Campaign/OptInNotice, serta tombol "Simpan" dan "Jalankan sekarang".
21. **21 Kampanye — Hasil**: Campaign/Progress (sedang berjalan), lalu tabel penerima (nama, terkirim, dibaca, membalas, converted) dengan chip status dan scroll horizontal di mobile.

## G. Halaman `/tickets`

22. **22 Tiket (Desktop)**: filter (kategori Gangguan/Tagihan/Instalasi/Lainnya, prioritas, status) dan tabel berkolom No. tiket, Pelanggan, Kategori, Prioritas, Status, Dibuat, dan Percakapan (link). Klik baris membuka drawer detail tiket.
23. **23 Tiket — Kosong & Mobile**: EmptyState, ditambah versi mobile di mana tabel berubah menjadi daftar kartu.

## H. Halaman `/knowledge`

24. **24 Knowledge — FAQ**: tab "FAQ" dan "Katalog paket". Berisi filter kategori, kolom cari, list Knowledge/FaqRow, dan tombol "Tambah FAQ".
25. **25 Knowledge — Form FAQ**: drawer Knowledge/FaqForm terbuka.
26. **26 Knowledge — Katalog paket**: grid Card/Package (Paket Demo A/B/C, harga `[Rp]`), dengan daftar promo dan area cakupan (tabel desa/kecamatan dan status tercakup) di bawahnya. Hanya baca.

---

## Definisi selesai desain

- [ ] Semua komponen di Bagian A ada, reusable, dan memakai variabel.
- [ ] 26 frame layar di atas ada, dengan nama berurutan.
- [ ] Setiap halaman punya state kosong, loading, dan error (minimal satu contoh per halaman, boleh digabung dalam satu frame state).
- [ ] Label "Bot", "AI", dan "CS" konsisten di chat dan inbox.
- [ ] Tidak ada angka bisnis yang dikarang (hanya placeholder `[...]`), tidak ada emoji, dan tidak ada nama atau logo perusahaan asli.
- [ ] Screenshot tiap layar sudah dicek: tidak ada teks terpotong atau layout bertumpuk.
