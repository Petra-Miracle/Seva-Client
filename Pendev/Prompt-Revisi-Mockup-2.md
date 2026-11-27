# Prompt Revisi Mockup (Putaran 2) — SevaAI

Revisi kecil untuk `SevaAI.pen`. Hampir semua poin putaran 1 sudah beres. Kerjakan **hanya** poin di bawah dan pertahankan semua yang lain.

## Aturan

Aturannya tetap sama seperti putaran 1:

- Pakai variabel dan komponen yang sudah ada.
- Tanpa emoji dan glyph teks. Pakai ikon lucide.
- Placeholder ditulis dengan gaya `[...]`.
- Ubah komponen induknya, bukan instance-nya.
- Setelah selesai, tidak boleh ada teks yang tertimpa atau terpotong.

---

## P1 — Wajib

### 1. Badge "Data demo" menimpa header (hampir semua frame)

Badge saat ini diletakkan melayang (absolute) di posisi `x 1290, y 16` untuk desktop dan `x 285, y 64` untuk mobile. Akibatnya badge menimpa:

- **Desktop (AppHeader):** teks pemilih mitra "Mitra Internet Demo". Terjadi di layar 10, 11, 12, 13, 17, 19, 20 (ketiga langkah), 21, 22, 22 Tabel, 23, 24, 25, 26, dan 27.
- **Chat desktop (ChatHeader):** status "Ditangani Bot / Ditangani AI / Terhubung dengan CS". Terjadi di layar 02–08.
- **Mobile:**
  - Chip "Bot" di FilterBar pada layar 14 Daftar.
  - Live indicator pada layar 18 Mobile.
  - Judul "Hasil Kampanye" pada layar 21 Hasil Mobile.
  - Pemilih mitra di dalam drawer pada layar 28.

Perbaikannya:

- Hapus semua badge yang melayang.
- Jadikan badge bagian dari komponen:
  - **AppHeader**: taruh di Right Group, di sebelah kiri Partner Dropdown, dengan gap 12.
  - **ChatHeader**: taruh di sebelah kiri status, atau di bawah nama mitra.
  - **AppHeader/Mobile**: taruh di sebelah kiri tombol Mitra, atau sebagai baris tipis di bawah header.
- Pada layar 15, badge sudah benar karena berada di Top Bar. Jangan diubah.

### 2. Inbox/FilterBar masih terpotong

Total lebar kelima chip adalah 431 px, sedangkan lebar kolomnya 360 px. Di layar 15 lebar kolom hanya 300 px, dan di mobile 358 px. Akibatnya "Bot" terpotong setengah dan "Selesai" tidak terlihat sama sekali.

Pilih salah satu:

- **Opsi A (disarankan):** chip dibuat lebih ringkas sampai total lebarnya ≤ 328 px.
  - Ukuran font 12, padding horizontal 8, gap 4.
  - Jumlah ditampilkan sebagai badge kecil.
  - Jika masih belum muat, bagi chip menjadi 2 baris: `Semua · Perlu CS · Ditangani CS` lalu `Bot · Selesai`.
- **Opsi B:** pertahankan scroll horizontal dan tambahkan petunjuk visual berupa gradasi memudar di tepi kanan dengan ikon `chevron-right`, supaya jelas masih ada chip lain.

Perbaikan ini berlaku di layar 10, 11, 12, 13, 14 Daftar, dan 15.

## P2 — Isi

### 3. 20 Kampanye — Langkah 3 Jadwal dan Ringkasan

- Isinya sudah ada, tetapi masih berbentuk form. Kelompokkan Segmen, Template, Jadwal, dan OptInNotice ke dalam kartu yang diberi judul **"Ringkasan"**. Kolom Nama Kampanye dan Jadwal Pengiriman tetap berupa input di atas kartu tersebut.
- Badge kategori template saat ini bertuliskan `UTILITY`. Ganti dengan label berbahasa Indonesia sesuai spesifikasi, yaitu **Pengingat** atau **Penawaran**.

## P3 — Pelengkap

### 4. 27 Pendukung — Pemilih Mitra dan Agen CS

Dropdown agen CS terpotong di bagian bawah frame. Tinggikan frame menjadi sekitar 680 px, atau naikkan posisi dropdown-nya.

### 5. 09 Chat — Mobile Drawer Terbuka

Tambahkan link kecil "Buka konsol CS" di footer drawer, sama seperti footer sidebar chat desktop di layar 02.

---

## Definisi selesai

- [ ] Tidak ada badge "Data demo" yang melayang. Badge menjadi bagian dari AppHeader, ChatHeader, dan AppHeader/Mobile, dan tidak menimpa teks apa pun.
- [ ] Kelima status filter inbox terlihat, atau jelas bisa di-scroll, di semua lebar kolom: 360, 300, dan 358 px.
- [ ] Langkah 3 kampanye punya kartu "Ringkasan" dengan kategori berbahasa Indonesia.
- [ ] Frame 27 tidak ada yang terpotong.
