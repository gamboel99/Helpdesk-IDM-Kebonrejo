# Helpdesk IDM Kebonrejo v3 (Versi Ringan 6 Dimensi)

Aplikasi formulir **offline** untuk penggalian data **IDM 2025** di Desa Kebon Rejo, Kec. Kepung, Kab. Kediri.

## Pembaruan v3
- Form 6 dimensi (Layanan Dasar, Sosial, Ekonomi, Lingkungan, Aksesibilitas, Tata Kelola).
- Semua indikator dimasukkan sebagai **angka 0–100** (versi ringan).
- **Skor otomatis** per dimensi = rata-rata indikator pada dimensi tsb. **Skor total** = rata-rata 6 dimensi yang terisi.
- **Excel**: Sheet *Data IDM*, *Rekap Dimensi*, dan *Panduan*.
- **Peta** (Leaflet) untuk pratinjau koordinat (opsional, perlu internet untuk tiles).

## Cara Pakai (Offline)
1. Buka `index.html` di peramban modern.
2. Isi identitas, ambil koordinat, lengkapi indikator (0–100).
3. Klik **Tambahkan ke Tabel** (bisa banyak entri).
4. Klik **Download Excel** → `data_idm_kebonrejo_v3.xlsx` akan diunduh.

## Deploy ke GitHub + Vercel
- Repo GitHub: unggah seluruh isi folder ini.
- Vercel: Import repo → Framework **Other/Static** → tanpa build command → deploy.

## Catatan Penting
- Skor versi ringan ini **indikatif**. Untuk pelaporan resmi, sesuaikan indikator/nama/rumus agar sesuai **Juknis Kemendesa** terbaru.
- Data tidak dikirim ke server mana pun; hanya tersimpan di perangkat hingga diekspor.

MIT © 2025 Pemerintah Desa Kebon Rejo
