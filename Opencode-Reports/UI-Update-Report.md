# Report Update UI — SevaAI

## Perubahan Terbaru

### Library UI Terpasang
- `@heroui/react` (v3) — Button, Input, Card, CardContent, Avatar, AvatarFallback, Chip, Spinner, Badge, Modal, Drawer, dll.
- `chart.js` + `react-chartjs-2` — grafik bar & doughnut untuk dashboard.
- `framer-motion` — animasi (tersedia).

### Halaman yang Diperbarui

#### /chat (Simulator Chat)
- Sidebar: tombol "Percakapan baru" (HeroUI Button), profil Baru/Aktif/Pasif (Button variant), riwayat, link konsol CS.
- Header: nama mitra, badge "Data demo" (Chip), status "Ditangani Bot" (Chip).
- Empty state: sapaan + 4 kartu saran (Card + CardContent) grid 2x2.
- Pesan: gelembung pelanggan (kanan), jawaban bot/AI dengan Avatar + Chip label pengirim.
- Loading: Avatar + Spinner.
- Composer mengambang: Input + Button (Lampiran, Rekam, Kirim) dengan shadow.

#### /dashboard
- Header: judul, pemilih periode 7/30 hari, indikator Live (Chip success).
- 3 KPI Card (Dapatkan/Layani/Pertahankan) dengan Chip tahap & angka Space Grotesk.
- Grafik Bar (Chart.js) untuk metrik utama.
- Doughnut chart untuk efisiensi AI (Tanpa AI vs Dengan AI).
- Funnel Dapatkan (bar horizontal).
- Token terpakai & event kuota AI.

### Perbaikan Tema
- `globals.css` diubah ke Tailwind v4 CSS-first (`@theme inline`) dengan semua token warna SevaAI.
- Dark-mode override (yang membuat background hitam) dihapus.
- Font Space Grotesk (heading) & Inter (body) via next/font.

### File yang Diubah
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/chat/page.tsx`
- `src/app/(app)/dashboard/page.tsx`

### Status
- Build frontend: ✅ OK.
- Dev server: http://localhost:3000 (hot-reload aktif).

### Langkah Selanjutnya (Opsional)
- Polish /inbox, /tickets, /campaigns, /knowledge dengan HeroUI components.
- Tambah animasi framer-motion pada transisi pesan.
- Tambah chart tambahan (line chart tren) di dashboard.
