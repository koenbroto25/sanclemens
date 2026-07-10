## BAB XVIII — Panduan Pembaruan Prompt Tanpa Deploy {#bab-xviii}

Semua system prompt disimpan di tabel `public.ai_prompts` dan dapat diperbarui via dashboard Super Admin **tanpa perlu deploy ulang aplikasi**. Ini memungkinkan Tim ICT dan Pastor melakukan penyesuaian prompt secara cepat jika ada isu pastoral atau kebutuhan mendesak.

**Alur pembaruan prompt:**

```
1. Super Admin / Developer buka dashboard ai_prompts
2. Pilih bot yang akan diperbarui
3. Edit konten prompt (rich text editor)
4. Klik "Simpan sebagai Draft" → versi baru dengan is_active=false
5. Pastor / Tim ICT review
6. Klik "Aktifkan" → versi lama dinonaktifkan, versi baru aktif
7. Semua request AI berikutnya menggunakan prompt baru secara otomatis
```

Untuk mekanisme A/B testing dan versioning lengkap, lihat **BAB XXIV**.

---
