# Report Update UI (Putaran 3) — SevaAI

## Akar masalah tampilan "kaku"
- `@heroui/styles` tidak pernah di-import di `globals.css`, jadi semua komponen HeroUI (Button, Card, Chip, Input, Spinner) tampil tanpa gaya.
- Kelas yang tidak ada (`bg-status-warning-bg`, dll.) membuat badge tidak berwarna.
- Variabel font memakai referensi melingkar (`--font-heading: var(--font-heading)`).
- `tailwind.config.ts` sisa Tailwind v3 dengan palet berbeda (tidak dipakai v4). File ini dihapus.

## Fondasi baru
- `globals.css`: import HeroUI, variabel tema HeroUI dipetakan ke warna brand, latar gradasi halus, utilitas `glass`, `text-gradient`, `shimmer-bg`, `dot-grid`, `no-scrollbar`.
- `components/ui/motion.tsx` (gaya ala Skiper/Vengeance/Forge, dibangun dengan framer-motion): `FadeIn`, `Stagger`, `AnimatedNumber`, `SpotlightCard`, `SegmentedControl` (indikator meluncur).
- `components/ui`: `Pill`, `PageHeader`, `AppSelect` (HeroUI Select), `EmptyState`, `ErrorBanner`, `SkeletonRows`.
- `components/chat/RichContent.tsx` merender pesan BUTTONS/CARD (area, paket, jadwal, tagihan, tiket).
- `lib/format.ts` berisi label Indonesia, waktu relatif, dan rupiah. `hooks/useInterval.ts` untuk polling.
- Toast HeroUI menggantikan `alert()`. Transisi halaman ada di `(app)/template.tsx`. Ikon memakai `lucide-react`.
- `/` dialihkan lewat `redirects()` di `next.config.ts`.

## Per halaman
- **Header:** pill navigasi meluncur, badge jumlah "Perlu CS", HeroUI Select untuk mitra (tersimpan di localStorage), tombol Simulator.
- **Dashboard:** KPI dengan angka beranimasi, line chart tren harian, doughnut AI, corong akuisisi, meter layanan dan retensi. Periode 7/30/90 hari benar-benar dipakai. Refresh otomatis 30 detik.
- **Inbox:**
  - Pencarian berfungsi.
  - Filter menampilkan jumlah per status; percakapan "Perlu CS" tampil paling atas.
  - Waktu diambil dari data asli, bukan lagi "09:41".
  - Polling: daftar tiap 8 detik, detail tiap 4 detik.
  - Profil pelanggan memakai data asli: paket, tagihan, dan jumlah tiket.
  - Layout responsif di mobile.
- **Tiket:** kartu statistik, filter, pencarian, tombol Proses/Selesaikan (PATCH), dan tampilan kartu di mobile.
- **Kampanye:**
  - Formulir dengan ringkasan: perkiraan penerima dan pratinjau template.
  - Pratinjau segmen tampil inline.
  - Aturan segmen ditulis dalam bahasa yang mudah dibaca.
  - Kampanye yang sudah SENT tidak bisa dijalankan ulang, untuk mencegah pesan ganda.
- **Knowledge:** FAQ accordion dengan kategori dan pencarian, kartu paket dengan sorotan.
- **Chat:**
  - Tombol dan kartu bot kini bisa diklik, sehingga alur pasang baru bisa diselesaikan dari UI.
  - Indikator mengetik dan timer rekaman.
  - Polling agar balasan CS muncul di simulator, plus status handoff.

## Perubahan backend (D:\Seva-Backend)
- `GET /api/metrics`: memakai `period` dan menambah `daily`, `handoffs`, `converted`.
- `GET /api/tickets`: filter `partnerId` kini berjalan. Sebelumnya tiket semua mitra ikut tampil.
- `PATCH /api/tickets/:id`: ubah status tiket.
- `GET /api/conversations/:id`: menyertakan langganan, paket, tagihan terakhir, dan jumlah tiket terbuka.
- `POST /api/chat/:id/messages`: menerima `label` opsional sebagai teks tampilan tombol. Logika routing tidak berubah.

## Status
- `tsc`, `eslint`, dan `next build` di frontend: OK. `tsc` di backend: OK.
- Semua halaman merespons 200. Alur tombol `lihat_paket` sudah diuji lewat API.
