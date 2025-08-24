// Helpdesk IDM Kebonrejo - script.js
// Penyimpanan sementara di localStorage
const STORAGE_KEY = 'helpdeskidmkebonrejo:data';
let dataList = [];

const form = document.getElementById('idmForm');
const thead = document.querySelector('#dataTable thead');
const tbody = document.querySelector('#dataTable tbody');

const columns = [
  // Identitas
  {key:'rt_rw', label:'RT/RW'},
  {key:'dusun', label:'Dusun'},
  {key:'nama_kk', label:'Nama KK'},
  {key:'nik', label:'NIK'},
  {key:'jml_anggota', label:'Jumlah Anggota'},
  {key:'hp', label:'HP'},
  {key:'foto_rumah', label:'Nama Berkas Foto'},
  {key:'lat', label:'Latitude'},
  {key:'lng', label:'Longitude'},
  {key:'acc', label:'Akurasi(m)'},
  // Sosial - Pendidikan
  {key:'pend_daftar', label:'Anak 7–18 terdaftar'},
  {key:'pend_jml_anak', label:'Jml Anak 7–18'},
  {key:'pend_jarak_sd', label:'Jarak SD (km)'},
  {key:'pend_paud', label:'PAUD di desa'},
  {key:'pend_smp', label:'SMP di desa'},
  {key:'pend_sma', label:'SMA/SMK di kec.'},
  // Sosial - Kesehatan
  {key:'kes_jkn', label:'Kepesertaan JKN'},
  {key:'kes_posyandu', label:'Posyandu ≤3 km'},
  {key:'kes_jarak_pkm', label:'Jarak Puskesmas (km)'},
  {key:'kes_kader', label:'Kader aktif'},
  {key:'kes_imunisasi', label:'Cakupan imunisasi'},
  {key:'kes_rujukan', label:'Faskes rujukan ≤10 km'},
  // Utilitas
  {key:'util_air', label:'Akses air layak'},
  {key:'util_sanitasi', label:'Sanitasi layak'},
  {key:'util_listrik', label:'Akses listrik'},
  // Modal sosial
  {key:'ms_goro', label:'Gotong royong'},
  {key:'ms_musdes', label:'Partisipasi Musdes'},
  {key:'ms_kelompok', label:'Keanggotaan kelompok'},
  // Ekonomi - Produksi
  {key:'eko_sumber', label:'Sumber penghasilan'},
  {key:'eko_jml_usaha', label:'Jml jenis usaha'},
  {key:'eko_aset', label:'Aset produksi memadai'},
  // Ekonomi - Pasar & Logistik
  {key:'eko_jarak_pasar', label:'Jarak pasar (km)'},
  {key:'eko_jalan', label:'Kondisi jalan'},
  {key:'eko_logistik', label:'Akses logistik'},
  // Ekonomi - Lembaga Keuangan
  {key:'eko_rekening', label:'Rekening/e-wallet'},
  {key:'eko_kredit', label:'Akses kredit formal'},
  {key:'eko_koperasi', label:'Anggota koperasi'},
  // Lingkungan - Kualitas
  {key:'ling_sampah', label:'Pengelolaan sampah'},
  {key:'ling_airlimbah', label:'Air limbah domestik'},
  {key:'ling_rth', label:'RTH di sekitar'},
  // Lingkungan - Bencana
  {key:'ling_bencana', label:'Risiko bencana'},
  {key:'ling_riwayat', label:'Riwayat 5 th'},
  {key:'ling_kesiap', label:'Kesiapsiagaan'}
];

// Render header tabel
function renderHeader(){
  thead.innerHTML = '<tr>' + columns.map(c => `<th>${c.label}</th>`).join('') + '<th>Aksi</th></tr>';
}
renderHeader();

// Muat data dari localStorage
function loadStorage(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    dataList = raw ? JSON.parse(raw) : [];
  }catch(e){
    dataList = [];
  }
}
function saveStorage(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataList));
}
loadStorage();

function renderBody(){
  tbody.innerHTML = '';
  dataList.forEach((row, idx) => {
    const tds = columns.map(c => `<td>${(row[c.key] ?? '').toString().replace(/</g,'&lt;')}</td>`).join('');
    const tr = document.createElement('tr');
    tr.innerHTML = tds + `<td><button data-idx="${idx}" class="btn-del">Hapus</button></td>`;
    tbody.appendChild(tr);
  });
}
renderBody();

// Hapus satu baris
tbody.addEventListener('click', (e)=>{
  const btn = e.target.closest('.btn-del');
  if(!btn) return;
  const idx = parseInt(btn.getAttribute('data-idx'));
  if(Number.isInteger(idx)){
    dataList.splice(idx,1);
    saveStorage();
    renderBody();
  }
});

// Ambil GPS
document.getElementById('btnGPS').addEventListener('click', ()=>{
  if(!navigator.geolocation){
    alert('Perangkat tidak mendukung geolokasi.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      document.getElementById('lat').value = pos.coords.latitude ?? '';
      document.getElementById('lng').value = pos.coords.longitude ?? '';
      document.getElementById('acc').value = pos.coords.accuracy ?? '';
    },
    (err)=>{
      alert('Gagal ambil lokasi: ' + err.message);
    },
    {enableHighAccuracy:true, timeout:15000, maximumAge:0}
  );
});

// Tambahkan ke tabel
document.getElementById('btnAdd').addEventListener('click', ()=>{
  const fd = new FormData(form);
  const row = {};
  columns.forEach(c => row[c.key] = (fd.get(c.key) ?? '').toString().trim());
  // validasi minimal
  if(!row['rt_rw'] || !row['dusun'] || !row['nama_kk']){
    alert('Mohon isi minimal RT/RW, Dusun, dan Nama KK.');
    return;
  }
  dataList.push(row);
  saveStorage();
  renderBody();
  form.reset();
});

// Hapus semua data
document.getElementById('btnClear').addEventListener('click', ()=>{
  if(confirm('Hapus semua data tersimpan di peramban ini?')){
    dataList = [];
    saveStorage();
    renderBody();
  }
});

// Download Excel
document.getElementById('btnDownload').addEventListener('click', async ()=>{
  if(dataList.length === 0){
    alert('Belum ada data untuk diunduh.');
    return;
  }
  try{
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Helpdesk IDM Kebonrejo';
    wb.created = new Date();
    const ws = wb.addWorksheet('Data IDM');
    ws.columns = columns.map(c => ({ header: c.label, key: c.key, width: Math.max(12, c.label.length + 2) }));
    dataList.forEach(row => ws.addRow(row));
    ws.getRow(1).font = { bold:true };

    // Tambah sheet Metadata
    const meta = wb.addWorksheet('Metadata');
    const metaRows = [
      ['Aplikasi', 'Helpdesk IDM Kebonrejo (Offline)'],
      ['Desa', 'Kebon Rejo'],
      ['Kecamatan', 'Kepung'],
      ['Kabupaten', 'Kediri'],
      ['Tanggal Ekspor', new Date().toLocaleString('id-ID')],
      ['Jumlah Entri', dataList.length.toString()],
      ['Catatan', 'Foto disimpan terpisah, kolom "Nama Berkas Foto" menjadi penghubung.']
    ];
    metaRows.forEach(r => meta.addRow(r));
    meta.getColumn(1).width = 24;
    meta.getColumn(2).width = 50;
    meta.getRow(1).font = { bold:true };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data_idm_kebonrejo.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }catch(e){
    console.error(e);
    alert('Gagal membuat file Excel: ' + e.message);
  }
});
