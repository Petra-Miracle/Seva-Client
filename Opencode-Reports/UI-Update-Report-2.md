# Report Update UI (Putaran 2) — SevaAI

## Perubahan

### Halaman yang Diperbarui dengan HeroUI v3
- `/inbox` — 3 kolom (daftar percakapan, detail chat, profil pelanggan), filter status, badge tahap & handoff, ringkasan bot, kolom balas (Button/Input/Chip/Avatar/Spinner).
- `/campaigns` — segmen + pratinjau, form buat kampanye, daftar kampanye dengan tombol jalankan (Button/Input/Card/Chip/Spinner).
- `/knowledge` — tab FAQ/Katalog Paket, FAQ cards, paket cards (Card/Chip/Button).
- `/tickets` — tabel tiket dengan badge prioritas & status (Card/Chip).

### Komponen HeroUI yang Dipakai
Button, Input, Card, CardContent, Avatar, AvatarFallback, Chip, Spinner.

### Chart.js
- Dashboard: Bar chart (metrik utama) + Doughnut (efisiensi AI).

### Perbaikan Teknis
- Semua prop `color`/`variant` disesuaikan dengan HeroUI v3 (variant: primary/secondary/ghost/soft, color: accent/success/danger/warning/default).
- `Input` size diubah ke default (number-based di v3).
- `Card` tidak lagi pakai `isPressable` (diganti button wrapper).

### Status
- Build frontend: ✅ OK.
- Dev server: http://localhost:3000 (hot-reload aktif).

### Langkah Selanjutnya
- Polish animasi (framer-motion) pada transisi pesan & kartu.
- Tambah chart tren (line) di dashboard.
- Sinkronisasi realtime Pusher di frontend (opsional).
