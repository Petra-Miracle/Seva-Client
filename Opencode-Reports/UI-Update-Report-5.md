# Report Update UI (Putaran 5) — Perbaikan Tampilan Mode HP (Mobile)

## Tujuan
Memperbaiki tampilan antarmuka pada lebar layar mobile (360–390 px) yang terlihat "kaku" dan bermasalah pada screenshot `public/Img/Dashboard.png` (navbar horizontal lama menimpa konten) dan `public/Img/RoomChat.png` (header chat bertumpuk dengan konten, kontrol padat).

## Ringkasan Perubahan

### 1. Chat Simulator (`src/app/chat/page.tsx`) — header & empty state
- Header diubah dari `glass` (transparan) menjadi **opaque** (`bg-surface/95` + `backdrop-blur-xl`) agar konten tidak tembus.
- Tinggi header tetap 64 px, tetapi isi header kini **tidak meluap**: kolom judul (partner) mendapat `min-w-0 flex-1` (sebelumnya hanya 41 px → teks subtitle membungkus 5 baris dan keluar dari header).
- Subtitle dipersingkat menjadi "Asisten virtual · online" agar muat di 390 px.
- Kontrol kanan diringkas: status pill hanya tampil di `sm+`, badge "Data demo" hanya di `md+`, tombol percakapan baru (`+`) dan tombol pengaturan (`SlidersHorizontal`) tetap 36 px.
- Profil pelanggan (3 pilihan) yang sebelumnya berupa `AppSelect` 150 px di header dipindahkan ke **bottom sheet** "Pengaturan percakapan" yang dibuka via tombol settings — sheet berisi pemilih mitra + profil + CTA "Percakapan baru" + catatan "Data demo".
- Sheet mendukung `Escape`, fokus awal ke tombol tutup, `role="dialog"`/`aria-modal`, dan mengunci scroll body.
- Empty state "Halo, ada yang bisa kami bantu?" diperkecil dari `text-3xl` ke `text-[28px]` agar tidak terpotong di 360 px; konten mulai di bawah header (`top: 152 px`).
- Composer padding bawah memakai `pb-[max(1rem,env(safe-area-inset-bottom))]` agar tidak tertutup gesture bar HP.

### 2. Knowledge (`src/app/(app)/knowledge/page.tsx`) — overflow horizontal
- Grid `lg:grid-cols-[260px_1fr]` sebelumnya melebar menjadi 976 px di mobile (kolom filter memaksa max-content).
- Diperbaiki: container grid diberi `min-w-0`, `Card` filter diberi `min-w-0`, dan chip kategori diubah dari scroll horizontal (`overflow-x-auto`) menjadi **wrap** (`flex flex-wrap`) sehingga tidak ada lagi scroll horizontal di 390 px.
- Verifikasi: `docW/bodyW = 390` (sebelumnya 992).

### 3. SegmentedControl (`src/components/ui/motion.tsx`)
- Container diubah dari `overflow-x-auto` (memotong item tanpa affordance) menjadi `flex-wrap`, sehingga semua chip filter (Inbox 5 status, Tiket 5 status) terlihat di mobile tanpa terpotong.
- Berlaku untuk Dashboard (periode), Inbox, Tiket, dan Knowledge.

### 4. Dashboard (`src/app/(app)/dashboard/page.tsx`)
- KPI card padding responsif `p-4 sm:p-5` dan angka `text-[30px] sm:text-[34px]`.
- Chart tinggi 240 px di mobile (`sm:h-[280px]`) agar tidak terlalu tinggi.
- Shell konsol sudah memakai sidebar (putaran 4), jadi navbar horizontal lama yang muncul di screenshot `Dashboard.png` (deployed Vercel lama) tidak lagi terjadi di build lokal.

### 5. Verifikasi mobile (CDP, 390×844)
- Semua route (`/dashboard`, `/inbox`, `/tickets`, `/campaigns`, `/knowledge`, `/chat`) → `docW = 390`, `offenderCount = 0` (tidak ada elemen keluar viewport).
- Chat header 64 px, tidak meluap; empty state mulai 152 px.
- Sheet pengaturan tampil 568 px tanpa overflow.

## File yang Diubah
| File | Perubahan |
|---|---|
| `src/app/chat/page.tsx` | Header opaque + ringkas, subtitle, bottom sheet pengaturan, empty state, safe-area |
| `src/app/(app)/knowledge/page.tsx` | `min-w-0` + filter wrap, hilangkan overflow horizontal |
| `src/components/ui/motion.tsx` | `SegmentedControl` wrap di mobile |
| `src/app/(app)/dashboard/page.tsx` | Padding/ukuran responsif KPI & chart |

## Verifikasi
- `npm run build` — **lolos** (semua route static).
- `npm run lint` — **lolos tanpa error**.
- Audit CDP mobile 390×844: tidak ada horizontal overflow di 6 halaman.
- `UI-Update-Report-3.md` dan `UI-Update-Report-4.md` tetap utuh (tidak ditimpa).

## Catatan
- Screenshot `Dashboard.png` menunjukkan build lama (Vercel) dengan navbar horizontal; build lokal sudah memakai sidebar (putaran 4) dan tidak lagi menampilkan navbar tersebut.
- Revisi file desain `Pendev/SevaAI.pen` (badge "Data demo" di header, filter inbox 360/300/358 px, kartu "Ringkasan" kampanye, frame 27 ~680 px, link "Buka konsol CS") memerlukan aplikasi Pencil yang berjalan; pada pass ini aplikasi Pencil tidak tersedia, sehingga revisi .pen belum diterapkan. Kode sudah mengikuti pola yang diminta (badge di header/sidebar, filter wrap, link konsol CS di drawer chat/console).
