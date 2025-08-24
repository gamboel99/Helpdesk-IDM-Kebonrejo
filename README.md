# Helpdesk IDM Kebonrejo (Offline)

Aplikasi formulir **offline** untuk penggalian data **Indeks Desa Membangun (IDM)** di Desa Kebon Rejo, Kec. Kepung, Kab. Kediri.

## Fitur
- Form lengkap mencakup **ketahanan sosial, ekonomi, dan lingkungan/ekologi**.
- Ambil **GPS** (latitude/longitude) langsung dari browser.
- Input banyak entri (multi-KK) lalu **unduh Excel (.xlsx)** sekali klik.
- Data sementara disimpan di **localStorage** per peramban (bisa dihapus melalui tombol "Hapus Semua Data").
- **Offline-ready**: cukup buka `index.html` di peramban modern (Chrome/Edge/Firefox).

## Struktur
```
helpdeskidmkebonrejo/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Cara Pakai (Offline)
1. Salin folder ini ke laptop/PC/HP.
2. Buka `index.html` (double click).
3. Isi form per rumah tangga → klik **Tambahkan ke Tabel**.
4. Ulangi sampai semua data masuk.
5. Klik **Download Excel** → file `data_idm_kebonrejo.xlsx` akan terunduh.
6. Simpan foto pada folder terpisah, gunakan **nama file foto** yang sama seperti di kolom formulir.

> Catatan: Geolokasi akan meminta izin. Jika ditolak, isi manual lat/lng.

## Deploy ke GitHub + Vercel
1. **GitHub**
   - Buat repository baru bernama `helpdeskidmkebonrejo`.
   - Upload semua file/folder ini ke repo.
2. **Vercel**
   - Login ke vercel.com → Import Project dari GitHub → pilih repo `helpdeskidmkebonrejo`.
   - Framework: **Other** (Static Site). Build Command: *(kosongkan)*. Output Directory: **/**.
   - Deploy. URL publik akan tersedia, misal `https://helpdeskidmkebonrejo.vercel.app`.

## Keamanan & Privasi
- Tidak ada server/DB; data hanya berada di perangkat pengguna sampai diekspor ke Excel.
- Hati-hati saat memindahkan file Excel karena memuat data pribadi.

## Lisensi
MIT © 2025 Pemerintah Desa Kebon Rejo
