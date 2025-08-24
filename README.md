Helpdesk IDM Kebonrejo — Full 38 Indikator (Siap Deploy)

Ringkasan:
- Form input berbasis inventaris (dropdown pilihan kondisi nyata), bukan input angka.
- Sistem konversi otomatis pilihan -> skor (0 / 0.5 / 1) lalu dihitung rata-rata per dimensi dan total.
- Kategori mengikuti Juknis Kemendesa (thresholds: <0.491 Tertinggal; 0.491–0.598 Berkembang; 0.599–0.706 Maju; >=0.707 Mandiri).
- Dashboard: rekap per Dusun, RT, RW; chart kategori; peta titik KK.
- Export Excel: Data_KK, Rekap_RT, Rekap_RW, Rekap_Dusun, Rekap_Desa, Panduan.

Cara pakai:
1. Ekstrak folder; buka index.html di browser modern.
2. Warga isi form (pilih kondisi real), klik Submit & Hitung IDM — hasil per KK muncul segera.
3. Buka dashboard.html untuk rekap & peta. Klik Download Excel untuk export.

Deploy ke GitHub & Vercel:
- Buat repo, upload isi folder, import ke Vercel sebagai static site (Other/Static).

MIT © 2025 Pemerintah Desa Kebon Rejo
