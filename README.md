# Helpdesk IDM Kebonrejo (Offline) – v2

Pembaharuan:
- **Peta (Leaflet)**: pratinjau titik koordinat. Klik pada peta untuk mengubah lat/lng. (Memerlukan internet untuk tiles)
- **Validasi**: penandaan kolom wajib & kesalahan (mis. NIK harus 16 digit).
- **Skoring sederhana**: skor per dimensi (Sosial, Ekonomi, Lingkungan) + total (0–100). *Catatan: indikatif, bukan penetapan resmi Kemendesa.*
- **Sheet Skoring** di Excel berisi ringkasan aturan & bobot (dapat disesuaikan di `script.js` pada variabel `weights`).

## Tetap Offline
- Aplikasi dapat berjalan murni offline. Peta akan kosong saat offline—ini normal. Fitur form & ekspor Excel tetap berfungsi.

## Cara Pakai
1. Buka `index.html`, klik **Ambil Koordinat** atau klik peta untuk set lokasi.
2. Isi form → **Tambahkan ke Tabel** (multi entri).
3. **Download Excel** untuk menyimpan semua data, termasuk skor.

## Penafian
- **Skoring** di versi ini adalah pendekatan praktis berbasis aturan umum indikator; untuk pelaporan resmi, sesuaikan bobot & aturan dengan juknis Kemendesa terbaru.
