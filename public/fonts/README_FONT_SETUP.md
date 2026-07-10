# Font Setup untuk PDF Generator

## Status Saat Ini
PDF generator menggunakan **TimesRoman** (built-in PDF font) sebagai fallback.
Ini sudah cukup untuk menghasilkan PDF yang valid dan bisa dibaca.

## Opsional: Tingkatkan Tampilan dengan Noto Sans

Jika ingin tampilan PDF yang lebih rapi dengan dukungan aksara Indonesia,
download font Noto Sans secara manual:

### Langkah Manual:
1. Buka https://fonts.google.com/noto/specimen/Noto+Sans
2. Download family **Noto Sans**
3. Ekstrak file `.ttf`/`.otf`
4. Copy ke folder ini dengan nama:
   - `NotoSans-Regular.otf` (untuk teks biasa)
   - `NotoSans-Bold.otf` (untuk teks bold)

### Atau download langsung dari Google Fonts API:
```
https://fonts.google.com/download?family=Noto%20Sans
```

Setelah font tersedia, pdf-lib akan otomatis menggunakannya.
Jika tidak ada, sistem fallback ke TimesRoman (tetap berfungsi normal).

## Catatan
- Jangan ubah kode di `pdf-generator.ts`
- Cukup tempatkan file font di folder ini
- Build aplikasi setelah font ditempatkan