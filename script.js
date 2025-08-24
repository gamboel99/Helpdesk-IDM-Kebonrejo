// Helpdesk IDM Kebonrejo - script.js (v2: map, validation, scoring)
const STORAGE_KEY = 'helpdeskidmkebonrejo:data';
let dataList = [];

const form = document.getElementById('idmForm');
const thead = document.querySelector('#dataTable thead');
const tbody = document.querySelector('#dataTable tbody');

// Kolom ekspor + tabel
const columns = [
  // Identitas
  {key:'rt_rw', label:'RT/RW'},
  {key:'dusun', label:'Dusun'},
  {key:'nama_kk', label:'Nama KK'},
  {key:'nik', label:'NIK'},
  {key:'jml_anggota', label:'Jumlah Anggota'},
  {key:'hp', label:'HP'},
  {key:'foto_rumah', label:'Nama Berkas Foto'},
  {key:'tgl', label:'Tanggal Pendataan'},
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
  {key:'ling_kesiap', label:'Kesiapsiagaan'},
  // Skor (otomatis)
  {key:'skor_sos', label:'Skor Sosial (0-100)'},
  {key:'skor_eko', label:'Skor Ekonomi (0-100)'},
  {key:'skor_ling', label:'Skor Lingkungan (0-100)'},
  {key:'skor_total', label:'Skor Total (0-100)'}
];

// Header
function renderHeader(){
  thead.innerHTML = '<tr>' + columns.map(c => `<th>${c.label}</th>`).join('') + '<th>Aksi</th></tr>';
}
renderHeader();

// Storage
function loadStorage(){
  try{ dataList = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch(e){ dataList = []; }
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

// Hapus baris
tbody.addEventListener('click', (e)=>{
  const btn = e.target.closest('.btn-del');
  if(!btn) return;
  const idx = +btn.dataset.idx;
  if(Number.isInteger(idx)){
    dataList.splice(idx,1);
    saveStorage();
    renderBody();
  }
});

// ====== Map (Leaflet) ======
let map, marker;
function initMap(){
  try{
    map = L.map('map').setView([-7.816, 112.108], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    marker = L.marker([-7.816, 112.108]).addTo(map);
    map.on('click', (e)=>{
      const {lat, lng} = e.latlng;
      setLatLng(lat, lng, 0);
    });
  }catch(e){
    // offline: map gagal, abaikan
  }
}
function setLatLng(lat, lng, acc){
  const latEl = document.getElementById('lat');
  const lngEl = document.getElementById('lng');
  const accEl = document.getElementById('acc');
  latEl.value = lat || '';
  lngEl.value = lng || '';
  accEl.value = acc || '';
  if(marker && map){
    marker.setLatLng([+lat, +lng]);
    map.setView([+lat, +lng], 17);
  }
}
window.addEventListener('load', initMap);

// GPS
document.getElementById('btnGPS').addEventListener('click', ()=>{
  if(!navigator.geolocation){
    alert('Perangkat tidak mendukung geolokasi.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      setLatLng(pos.coords.latitude ?? '', pos.coords.longitude ?? '', pos.coords.accuracy ?? '');
    },
    (err)=> alert('Gagal ambil lokasi: ' + err.message),
    {enableHighAccuracy:true, timeout:15000, maximumAge:0}
  );
});

// ====== Validation UI ======
function validateForm(){
  let ok = true;
  form.querySelectorAll('label').forEach(lab => lab.classList.remove('invalid'));
  form.querySelectorAll('.err').forEach(e => e.textContent = '');

  const reqNames = ['rt_rw','dusun','nama_kk','jml_anggota'];
  reqNames.forEach(n => {
    const el = form.elements[n];
    if(el && !el.value.trim()){
      el.closest('label').classList.add('invalid');
      el.closest('label').querySelector('.err').textContent = 'Wajib diisi';
      ok = false;
    }
  });

  const nikEl = form.elements['nik'];
  if(nikEl && nikEl.value && !/^\d{16}$/.test(nikEl.value)){
    nikEl.closest('label').classList.add('invalid');
    nikEl.closest('label').querySelector('.err').textContent = 'NIK harus 16 digit';
    ok = false;
  }

  // contoh validasi logis
  const jarakSD = parseFloat(form.elements['pend_jarak_sd'].value || '0');
  if(jarakSD < 0){
    const el = form.elements['pend_jarak_sd'];
    el.closest('label').classList.add('invalid');
    el.closest('label').querySelector('.err').textContent = 'Tidak boleh negatif';
    ok = false;
  }

  return ok;
}

// ====== Skoring sederhana (bobot dapat diatur) ======
const weights = {
  // sosial
  pend_daftar: 1, pend_paud: 0.5, pend_smp: 0.5, pend_sma: 0.5,
  kes_jkn: 1, kes_posyandu: 0.5, kes_kader: 0.5, kes_imunisasi: 1, kes_rujukan: 0.5,
  util_air: 1, util_sanitasi: 1, util_listrik: 0.5,
  ms_goro: 0.5, ms_musdes: 0.5, ms_kelompok: 0.5,
  // ekonomi
  eko_sumber: 0.3, eko_jml_usaha: 0.7, eko_aset: 0.7,
  eko_jarak_pasar: 0.7, eko_jalan: 0.5, eko_logistik: 0.5,
  eko_rekening: 0.7, eko_kredit: 0.5, eko_koperasi: 0.5,
  // lingkungan
  ling_sampah: 0.7, ling_airlimbah: 0.7, ling_rth: 0.3,
  ling_bencana: 0.3, ling_riwayat: 0.3, ling_kesiap: 0.7
};

function scoreRow(row){
  // helper map nilai ke skor 0..1
  function v(name){
    const x = (row[name]||'').toString();
    switch(name){
      // pendidikan & fasilitas
      case 'pend_daftar': return x==='Ya'?1:0;
      case 'pend_paud': case 'pend_smp': case 'pend_sma': return x==='Ya'?1:0;
      // kesehatan
      case 'kes_jkn': return x==='Semua'?1 : (x==='Sebagian'?0.5:0);
      case 'kes_posyandu': case 'kes_kader': case 'kes_rujukan': return x==='Ya'?1:0;
      case 'kes_imunisasi':
        if(x.includes('>= 95')||x.includes('≥')) return 1;
        if(x.includes('70')) return 0.7;
        if(x.includes('<')||x.includes('70%')) return 0.3;
        if(x.includes('Tidak ada balita')) return 1;
        return 0;
      // utilitas
      case 'util_air':
        if(x.startsWith('Pipa')||x.startsWith('Air kemasan')) return 1;
        if(x.startsWith('Sumur')||x.startsWith('Mata air')) return 0.7;
        return 0;
      case 'util_sanitasi':
        if(x.startsWith('Jamban leher angsa')) return 1;
        if(x.startsWith('Jamban cemplung')) return 0.5;
        return 0;
      case 'util_listrik':
        if(x.includes('>=')||x.includes('≥')||x.includes('>=')) return 1;
        if(x.includes('<')) return 0.7;
        if(x==='Non-PLN') return 0.5;
        return 0;
      // modal sosial
      case 'ms_goro': return x==='Sering'?1 : (x==='Jarang'?0.5:0);
      case 'ms_musdes': return x==='Pernah'?1:0;
      case 'ms_kelompok': return x.includes('>= 1')?1:0;
      // ekonomi produksi
      case 'eko_sumber': return x?1:0.8; // apapun ada penghasilan
      case 'eko_jml_usaha': {
        const n = parseFloat(x||'0'); return n>=3?1 : n===2?0.7 : n===1?0.5 : 0;
      }
      case 'eko_aset': return x==='Ya'?1:0;
      // pasar & logistik
      case 'eko_jarak_pasar': {
        const d = parseFloat(x||'0'); return d<=2?1 : d<=5?0.7 : d<=10?0.4 : 0.2;
      }
      case 'eko_jalan':
        return x==='Baik'?1 : x==='Sedang'?0.6 : 0.3;
      case 'eko_logistik': return x==='Ya'?1:0;
      // lembaga keuangan
      case 'eko_rekening': return x==='Ya'?1:0;
      case 'eko_kredit': return x==='Pernah'?1:0;
      case 'eko_koperasi': return x==='Ya'?1:0;
      // lingkungan
      case 'ling_sampah':
        if(x.startsWith('Terpilah')) return 1;
        if(x.startsWith('Dikelola mandiri')) return 0.7;
        return 0.2;
      case 'ling_airlimbah': return x.startsWith('Ada')?1:0.2;
      case 'ling_rth':
        return x==='Memadai'?1 : x==='Kurang'?0.6 : 0.3;
      case 'ling_bencana':
        return x==='Lainnya/Tidak ada'?1 : 0.6; // ada risiko -> turunkan
      case 'ling_riwayat':
        return x.startsWith('Tidak')?1 : x.startsWith('Pernah')?0.6 : 0.3;
      case 'ling_kesiap':
        return x==='Ada & aktif'?1 : x==='Ada tapi pasif'?0.6 : 0.2;
      default: return 0;
    }
  }
  // agregasi dimensi
  function sum(keys){ return keys.reduce((s,k)=> s + (v(k)* (weights[k]||1)), 0); }
  function wsum(keys){ return keys.reduce((s,k)=> s + (weights[k]||1), 0); }

  const sosialKeys = ['pend_daftar','pend_paud','pend_smp','pend_sma','kes_jkn','kes_posyandu','kes_kader','kes_imunisasi','kes_rujukan','util_air','util_sanitasi','util_listrik','ms_goro','ms_musdes','ms_kelompok'];
  const ekonomiKeys = ['eko_sumber','eko_jml_usaha','eko_aset','eko_jarak_pasar','eko_jalan','eko_logistik','eko_rekening','eko_kredit','eko_koperasi'];
  const lingkunganKeys = ['ling_sampah','ling_airlimbah','ling_rth','ling_bencana','ling_riwayat','ling_kesiap'];

  const sSos = sum(sosialKeys) / Math.max(1, wsum(sosialKeys)) * 100;
  const sEko = sum(ekonomiKeys) / Math.max(1, wsum(ekonomiKeys)) * 100;
  const sLing = sum(lingkunganKeys) / Math.max(1, wsum(lingkunganKeys)) * 100;
  const total = (sSos + sEko + sLing) / 3;

  return {
    skor_sos: Math.round(sSos),
    skor_eko: Math.round(sEko),
    skor_ling: Math.round(sLing),
    skor_total: Math.round(total)
  };
}

// Tambahkan ke tabel
document.getElementById('btnAdd').addEventListener('click', ()=>{
  if(!validateForm()) return;
  const fd = new FormData(form);
  const row = {};
  columns.forEach(c => {
    if(['skor_sos','skor_eko','skor_ling','skor_total'].includes(c.key)) return;
    row[c.key] = (fd.get(c.key) ?? '').toString().trim();
  });
  // Hitung skor otomatis
  const sk = scoreRow(row);
  Object.assign(row, sk);

  dataList.push(row);
  saveStorage();
  renderBody();
  form.reset();
});

// Clear
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

    // Sheet Metadata
    const meta = wb.addWorksheet('Metadata');
    const metaRows = [
      ['Aplikasi', 'Helpdesk IDM Kebonrejo (Offline)'],
      ['Desa', 'Kebon Rejo'],
      ['Kecamatan', 'Kepung'],
      ['Kabupaten', 'Kediri'],
      ['Tanggal Ekspor', new Date().toLocaleString('id-ID')],
      ['Jumlah Entri', dataList.length.toString()],
      ['Catatan', 'Skor bersifat indikatif, bukan penetapan resmi Kemendesa.'],
    ];
    metaRows.forEach(r => meta.addRow(r));
    meta.getColumn(1).width = 28;
    meta.getColumn(2).width = 70;
    meta.getRow(1).font = { bold:true };

    // Sheet Skoring
    const sk = wb.addWorksheet('Skoring (Penjelasan)');
    sk.addRow(['Indikator', 'Aturan Ringkas', 'Bobot']);
    sk.getRow(1).font = {bold:true};
    const ruleNotes = [
      ['Pendidikan (terdaftar)', 'Ya=1; Tidak=0', weights.pend_daftar],
      ['PAUD/SMP/SMA', 'Ya=1; Tidak=0', weights.pend_paud],
      ['JKN/KIS', 'Semua=1; Sebagian=0.5; Tidak=0', weights.kes_jkn],
      ['Imunisasi', '>=95%=1; 70-94%=0.7; <70%=0.3; tanpa balita=1', weights.kes_imunisasi],
      ['Air minum layak', 'Pipa/kemasan=1; Sumur/mata air=0.7; Tidak layak=0', weights.util_air],
      ['Sanitasi', 'Leher angsa=1; Cemplung=0.5; Tidak ada=0', weights.util_sanitasi],
      ['Listrik', '>=900VA=1; <900=0.7; Non-PLN=0.5; Tidak ada=0', weights.util_listrik],
      ['Gotong royong', 'Sering=1; Jarang=0.5; Tidak pernah=0', weights.ms_goro],
      ['Keragaman usaha', '3+=1; 2=0.7; 1=0.5; 0=0', weights.eko_jml_usaha],
      ['Jarak pasar', '<=2km=1; <=5=0.7; <=10=0.4; >10=0.2', weights.eko_jarak_pasar],
      ['Jalan ke pasar', 'Baik=1; Sedang=0.6; Rusak=0.3', weights.eko_jalan],
      ['Logistik/ojol', 'Ya=1; Tidak=0', weights.eko_logistik],
      ['Rekening/Kredit/Koperasi', 'Ya/Pernah=1; Tidak=0', weights.eko_rekening],
      ['Sampah', 'Terpilah=1; Mandiri=0.7; Dibakar/Buang=0.2', weights.ling_sampah],
      ['Air limbah', 'Ada & berfungsi=1; Tidak=0.2', weights.ling_airlimbah],
      ['RTH', 'Memadai=1; Kurang=0.6; Tidak ada=0.3', weights.ling_rth],
      ['Risiko bencana', 'Tidak ada/Lainnya=1; Ada risiko=0.6', weights.ling_bencana],
      ['Riwayat bencana', 'Tidak=1; Pernah=0.6; Sering=0.3', weights.ling_riwayat],
      ['Kesiapsiagaan', 'Aktif=1; Pasif=0.6; Tidak=0.2', weights.ling_kesiap]
    ];
    ruleNotes.forEach(r => sk.addRow(r));
    sk.columns = [{width:34},{width:50},{width:14}];

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
