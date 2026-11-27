# Keputusan

- Media disimpan tidak permanen: file diproses in-memory (multer memoryStorage) untuk prototipe.
- Pusher opsional: jika env kosong, trigger no-op.
- Gemini opsional: jika GEMINI_API_KEY kosong, fitur AI dinonaktifkan dan free text memicu handoff (simulasi kuota habis).
- Prisma db push digunakan untuk prototipe (bukan migrate).
- Frontend memakai polling refresh setelah aksi; realtime via Pusher opsional.
