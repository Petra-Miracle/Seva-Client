# Report Update UI (Putaran 4) — Navigasi Sidebar

## Tujuan
Mengubah navigasi konsol dari **navbar horizontal di atas** menjadi **sidebar vertikal** yang umum dipakai dashboard modern, tanpa mengubah alur data atau fitur yang sudah ada.

## Ringkasan Perubahan

### 1. Shell konsol baru
- Header lama (`AppHeader`) dihapus dan diganti `AppSidebar`.
- Layout `src/app/(app)/layout.tsx` sekarang memakai shell:
  - Desktop: sidebar tetap (fixed) selebar **272px** di kiri, konten bergeser otomatis (`lg:pl-[272px]`).
  - Mobile: top bar ringkas (logo + tombol menu + tombol simulator), drawer navigasi dari kiri.
- Sidebar tidak ikut ter-scroll saat konten halaman panjang; area navigasi punya scroll internal sendiri.

### 2. Isi sidebar (desktop)
- **Brand**: logo SevaAI + label `CONSOLE`.
- **Mitra aktif**: kartu pemilih mitra (HeroUI Select) dengan badge `Data demo` dan state error/retry.
- **Ruang kerja**: 5 menu dengan ikon, sub-label, dan indikator aktif beranimasi (framer-motion `layoutId`):
  - Ringkasan — Metrik & tren
  - Inbox — Percakapan masuk (badge antrean `NEEDS_HUMAN`)
  - Tiket — Keluhan pelanggan
  - Kampanye — Segmen & penawaran
  - Knowledge — FAQ & paket
- **Pintasan**: Antrean butuh CS (dengan badge) dan Buka konsol CS.
- **CTA**: kartu Simulator pelanggan (gradien mint) menuju `/chat`.
- **Footer**: kartu Tim Layanan dengan status “Siap menerima handoff”.

### 3. Mobile
- Top bar sticky dengan tombol hamburger, logo, dan akses cepat simulator.
- Drawer 300px (maks. 86vw) dengan backdrop blur, animasi spring, tombol tutup, dan tautan **“Buka konsol CS”** sesuai revisi mockup.
- Menutup drawer otomatis saat menu diklik; mendukung tombol `Escape`; scroll body dikunci selama drawer terbuka.
- Fokus awal dipindahkan ke tombol tutup, plus `role="dialog"`, `aria-modal`, `aria-controls`, dan `aria-expanded` untuk aksesibilitas.

### 4. Detail visual
- Palet tetap mengikuti token SevaAI: `ink #092c35`, `mint #b8f1df`, `mint-strong #8fe4cc`, aksen `#147d70`.
- Efek glow radial halus di sudut sidebar, garis pemisah `white/10`, dan kartu kaca `white/[0.04]`.
- Item aktif memakai pil `white/[0.09]` + ikon tint mint + chevron.
- Badge antrean diperbarui otomatis tiap **15 detik** dari endpoint percakapan `NEEDS_HUMAN`.

## File yang Diubah
| File | Perubahan |
|---|---|
| `src/components/layout/AppSidebar.tsx` | **Baru** — sidebar desktop, top bar mobile, drawer, badge antrean, pemilih mitra |
| `src/components/layout/Logo.tsx` | **Baru** — logo dipisah agar dipakai sidebar & halaman chat |
| `src/app/(app)/layout.tsx` | Ganti `AppHeader` dengan `AppSidebar` + wrapper konten |
| `src/app/chat/page.tsx` | Import `Logo` dari lokasi baru |
| `src/components/layout/AppHeader.tsx` | **Dihapus** — sudah digantikan sidebar |
| `src/app/(app)/inbox/page.tsx` | Tinggi panel disesuaikan dengan shell baru (`100dvh - 4rem` di desktop, `- 7rem` di mobile) |

## Verifikasi
- `npm run build` — **lolos** (semua route: `/dashboard`, `/inbox`, `/tickets`, `/campaigns`, `/knowledge`, `/chat`).
- `npm run lint` — **lolos tanpa error**.
- Uji render desktop **1440×900**: sidebar 272px, konten tidak tertutup, footer sidebar terlihat penuh.
- Uji render mobile **390×844**: top bar + drawer terbuka, tautan “Buka konsol CS” tampil, body terkunci.
- `GET` semua halaman konsol — **200**.

## Catatan
- Halaman `/chat` tetap memakai layout layar penuh sendiri (bukan shell konsol), hanya import logo yang disesuaikan.
- Pemilih mitra kini berada di sidebar (desktop) dan di dalam drawer (mobile), sehingga top bar mobile tetap ringkas.
- Tidak ada perubahan pada endpoint, hook data, atau Chart.js.
- Report fondasi UI sebelumnya tetap ada di `UI-Update-Report-3.md`.

## Rekomendasi Lanjutan (opsional)
- Tambah mode sidebar collapsed (ikon saja) untuk layar 1024–1280px.
- Tambah breadcrumb di atas `PageHeader` bila halaman bertambah dalam.
- Tambah focus trap penuh pada drawer mobile.
