
# Prompt Revisi Mockup — SevaAI

Berikut revisi untuk file `SevaAI.pen` yang sudah ada. Revisi ini **bukan desain ulang**. Kerjakan hanya poin-poin di bawah. Pertahankan frame, variabel, dan komponen yang sudah ada.

## Aturan

Aturannya sama dengan prompt desain sebelumnya:

- Pakai variabel dan komponen yang sudah ada.
- Tanpa emoji dan tanpa glyph teks seperti `✓`. Pakai ikon lucide.
- Placeholder ditulis dengan gaya `[...]`.
- Setiap frame punya badge "Data demo".
- Ukuran frame: desktop 1440 px, mobile 390x844.
- Jika komponen diubah, ubah di **komponen induknya**, bukan di instance, supaya semua layar ikut berubah.
- Setelah selesai, pastikan tidak ada node yang terpotong (clipped) atau bertumpuk.

---

## P1 — Layout rusak (wajib)

1. **13 Inbox — Kosong Dan Modal**
   - Frame `Page` kolaps ke ukuran 0x0, akibatnya AppHeader, tab, dan teks saling tumpuk.
   - Susun ulang dengan struktur yang sama seperti layar 10: AppHeader, lalu Body tiga kolom.
   - Kolom daftar berisi FilterBar dengan EmptyState "Tidak ada percakapan yang perlu ditangani" **di tengah kolom**.
   - Kolom detail berisi placeholder netral "Pilih percakapan untuk melihat detail".
   - Di atas semuanya ada Scrim dan Modal/Confirm "Kembalikan ke bot?" di tengah layar.
2. **Inbox/FilterBar (komponen)**
   - Lima tab tidak muat. Hanya Semua, Perlu CS, dan Ditangani CS yang terlihat, sedangkan Bot, Selesai, dan kolom cari terpotong. Masalah ini muncul di layar 10, 11, 12, 15, dan 14 Mobile.
   - Ubah tab menjadi chip yang lebih ringkas (label + jumlah) yang bisa di-scroll horizontal.
   - Taruh kolom cari di baris sendiri dengan lebar penuh.
   - Kelima status harus terlihat atau jelas bisa di-scroll.
3. **09 Chat — Mobile Drawer Terbuka**
   - Scrim hanya menutup bagian atas. Area chat di bawah masih terang.
   - Scrim harus menutup seluruh 390x844 dan drawer harus setinggi layar penuh.
   - Drawer wajib memuat **CustomerPicker** (Baru / Aktif / Pasif) di atas riwayat, sama seperti sidebar desktop.
4. **15 Demo — Chat Dan Inbox Berdampingan**
   - Badge "Data demo" menimpa tombol **Ambil alih** dan header detail. Tab juga terpotong.
   - Pane inbox (880 px) disusun menjadi daftar sekitar 300 px dan detail selebar sisanya. Sembunyikan panel profil.
   - Pastikan DetailHeader, Banner/Handoff, Inbox/BotSummary, dan ReplyBox nonaktif semuanya terlihat.
   - Pindahkan badge ke tempat yang tidak menimpa apa pun.
5. **Inbox/DetailHeader (desktop)**
   - Ikon panah kembali menimpa nama pelanggan di layar 10, 11, dan 12.
   - Buat dua varian:
     - **Desktop**: tanpa tombol kembali.
     - **Mobile**: dengan tombol kembali.

## P2 — State dan isi belum sesuai spesifikasi

6. **Panel/CustomerProfile**

   - Di layar 10 dan 14 Profil Sheet, statusnya "Perlu CS", tetapi panel menampilkan tombol "Kembalikan ke bot". Ini salah.
   - Hapus tombol aksi dari panel profil. Tombol Ambil alih / Kembalikan ke bot cukup ada di DetailHeader.
   - Isi panel:
     - Tahap
     - Paket aktif
     - Status tagihan
     - Tiket terbuka
     - Opt-in promosi
     - Nomor HP dummy yang disamarkan, misalnya `08xx-xxxx-[1234]`
7. **Posisi gelembung di inbox harus konsisten**

   - Saat ini di layar 11 pesan pelanggan ada di kiri, sedangkan di layar 12 voice note pelanggan ada di kanan.
   - Aturannya: di inbox, **pelanggan rata kiri**, sedangkan **Bot, AI, dan CS rata kanan**. Setiap pesan diberi label pengirim: Bot / AI / "CS — [nama]".
   - Terapkan aturan ini di layar 10–15 dan di versi mobile.
8. **14 Inbox — Mobile Detail**

   - Tombol **Ambil alih** belum ada. Pasang tombol sticky di bawah, di atas teks "Ambil alih percakapan untuk membalas".
   - Tambahkan Inbox/BotSummary dalam bentuk yang bisa diciutkan.
   - Tambahkan frame baru **14 Inbox — Mobile Ditangani CS** dengan ReplyBox aktif dan tombol "Kembalikan ke bot" di header.
9. **20 Kampanye — Langkah 3 Jadwal Dan Ringkasan**

   - Kartu ringkasan belum ada. Tambahkan kartu **Ringkasan** berisi:
     - Segmen beserta jumlah penerima `[n]`
     - Template beserta badge kategori (Pengingat / Penawaran)
     - Jadwal
     - OptInNotice yang sudah ada
   - Di stepper layar 20 (langkah 2 dan 3), ganti teks `✓` dengan ikon lucide `check`.
10. **21 Kampanye — Hasil**

    - Tambahkan:
      - Badge status kampanye dan Realtime indicator "Live" di judul.
      - Satu baris KpiTile/Secondary: Terkirim / Dibaca / Membalas / Converted.
      - Campaign/OptInNotice di bawah progress.
    - Tambahkan frame **21 Kampanye — Hasil Mobile** dengan tabel penerima yang di-scroll horizontal.
11. **19 Kampanye — Daftar**: tombol aksi mengikuti status.

    | Status    | Tombol                                    |
    | --------- | ----------------------------------------- |
    | Draf      | "Jalankan sekarang" + "Edit"              |
    | Terjadwal | "Jalankan sekarang"                       |
    | Terkirim  | "Lihat hasil" (tanpa "Jalankan sekarang") |
12. **26 Knowledge — Katalog Paket**

    - Halaman ini hanya baca, jadi hapus tombol "Pilih paket ini".
    - Buat varian Card/Package tanpa CTA khusus untuk admin. Versi dengan CTA tetap dipakai di chat.
13. **18 Dashboard — Mobile**

    - Tambahkan bagian yang belum ada:
      - FunnelRow Dapatkan
      - KpiTile/Secondary "Waktu respons rata-rata"
      - Daftar kampanye terbaru
    - Pastikan badge "Data demo" tidak menimpa judul atau Live indicator.
14. **22 Tiket**

    - Saat ini hanya ada state dengan drawer terbuka, sehingga kolom Status, Dibuat, dan Percakapan tertutup.
    - Tambahkan frame **22 Tiket — Tabel** tanpa drawer agar semua kolom terlihat. Kolom Percakapan berisi link "Lihat".

## P3 — Pelengkap (dipakai backend dan demo)

15. **Pemilih mitra terbuka**: varian dropdown AppHeader yang terbuka. Isinya dua mitra dummy, "Mitra Internet Demo" dan "Mitra Internet Demo 2", dengan state terpilih.
16. **Pemilih agen CS**: dropdown pada avatar di header inbox dengan judul "Masuk sebagai: CS Demo 1 / CS Demo 2". Prototipe ini tanpa login, dan nama agen ini muncul pada label "CS — [nama]".
17. **Drawer navigasi mobile**: frame AppHeader/Mobile dengan menu hamburger terbuka. Isinya:
    - Dashboard, Inbox, Tiket, Kampanye, Pengetahuan, dengan state aktif
    - Pemilih mitra
18. **Toast realtime**: contoh Toast "Percakapan baru perlu CS — Pelanggan Demo [n]" di layar 10 atau 15.
19. **Footer sidebar chat**: link kecil "Buka konsol CS" yang mengarah ke `/inbox`, supaya juri bisa berpindah halaman saat demo.

---

## Definisi selesai

- [ ] Tidak ada node yang terpotong atau bertumpuk di frame 02–26 dan frame baru.
- [ ] FilterBar menampilkan kelima status dan kolom cari.
- [ ] Tidak ada tombol "Kembalikan ke bot" pada state Perlu CS.
- [ ] Posisi gelembung di inbox konsisten: pelanggan di kiri, Bot/AI/CS di kanan.
- [ ] Frame baru tersedia:
  - 14 Mobile Ditangani CS
  - 21 Hasil Mobile
  - 22 Tiket — Tabel
  - Pemilih mitra terbuka
  - Drawer navigasi mobile
- [ ] Tidak ada glyph `✓`. Semua ikon memakai lucide.
