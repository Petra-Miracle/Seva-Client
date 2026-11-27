# Checklist Skenario Uji SevaAI

1. Dapatkan: calon pelanggan -> cek cakupan -> pilih paket -> jadwal pasang -> muncul di dashboard.
2. Di luar cakupan: bot menawarkan daftar tunggu dengan sopan.
3. Layani FAQ: pertanyaan teks bebas dijawab dari FAQ (label AI); di luar FAQ -> handoff.
4. Layani foto: foto router -> langkah perbaikan -> tiket gangguan dibuat.
5. Layani voice note: transkrip muncul di inbox.
6. Handoff: pelanggan minta diskon -> NEEDS_HUMAN -> CS ambil alih -> balas -> kembalikan ke bot.
7. Pertahankan: segmen tagihan jatuh tempo 3 hari -> jalankan kampanye -> pesan masuk simulator -> pelanggan balas "bayar" -> converted=true -> dashboard realtime.
8. Opt-in: kampanye marketing tidak terkirim ke pelanggan marketingOptIn=false.
9. Keamanan: pelanggan kirim/minta OTP -> bot menolak sopan.
10. Kuota AI habis (429): bot kirim pesan cadangan + handoff, backend tidak crash.
11. Multi-mitra: ganti mitra di header -> data ikut berganti.
