// Helpdesk IDM Kebonrejo v3 - script.js (versi ringan 6 dimensi)
const STORAGE_KEY = 'helpdeskidmkebonrejo:v3:data';
let dataList = [];

const form = document.getElementById('idmForm');
const thead = document.querySelector('#dataTable thead');
const tbody = document.querySelector('#dataTable tbody');

// Kolom ekspor + tabel (ringkas, termasuk skor per dimensi)
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

  // Dimensi input (angka 0-100)
  {key:'ld_air', label:'LD Air Layak'},
  {key:'ld_sanitasi', label:'LD Sanitasi'},
  {key:'ld_listrik', label:'LD Listrik'},
  {key:'ld_sekolah', label:'LD Sekolah'},
  {key:'ld_jkn', label:'LD JKN'},
  {key:'sos_gotong', label:'SOS Gotong'},
  {key:'sos_musdes', label:'SOS Musdes'},
  {key:'sos_keamanan', label:'SOS Keamanan'},
  {key:'sos_budaya', label:'SOS Budaya'},
  {key:'eko_keragaman', label:'EKO Keragaman'},
  {key:'eko_pasar', label:'EKO Pasar'},
  {key:'eko_keuangan', label:'EKO Keuangan'},
  {key:'ling_sampah', label:'LING Sampah'},
  {key:'ling_airlimbah', label:'LING Air Limbah'},
  {key:'ling_rth', label:'LING RTH'},
  {key:'ling_kesiap', label:'LING Kesiap'},
  {key:'aks_sd', label:'AKS SD'},
  {key:'aks_puskesmas', label:'AKS Puskesmas'},
  {key:'aks_pasar', label:'AKS Pasar'},
  {key:'aks_kantor', label:'AKS Kantor Desa'},
  {key:'tg_transparansi', label:'TG Transparansi'},
  {key:'tg_musrenbang', label:'TG Musrenbang'},
  {key:'tg_rkpdes', label:'TG RKPDes'},
  {key:'tg_perdes', label:'TG Perdes'},

  // Skor dimensi
  {key:'skor_ld', label:'Skor Layanan Dasar'},
  {key:'skor_sos', label:'Skor Sosial'},
  {key:'skor_eko', label:'Skor Ekonomi'},
  {key:'skor_ling', label:'Skor Lingkungan'},
  {key:'skor_aks', label:'Skor Aksesibilitas'},
  {key:'skor_tg', label:'Skor Tata Kelola'},
  {key:'skor_total', label:'Skor Total'}
];

// ====== Tabel ======
function renderHeader(){
  thead.innerHTML = '<tr>' + columns.map(c => `<th>${c.label}</th>`).join('') + '<th>Aksi</th></tr>';
}
renderHeader();

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

// ====== Peta (Leaflet) ======
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
  }catch(e){}
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

document.getElementById('btnGPS').addEventListener('click', ()=>{
  if(!navigator.geolocation){
    alert('Perangkat tidak mendukung geolokasi.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos)=> setLatLng(pos.coords.latitude ?? '', pos.coords.longitude ?? '', pos.coords.accuracy ?? ''),
    (err)=> alert('Gagal ambil lokasi: ' + err.message),
    {enableHighAccuracy:true, timeout:15000, maximumAge:0}
  );
});

// ====== Validasi ======
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

  // Semua indikator angka 0-100 jika diisi
  const numNames = [
    'ld_air','ld_sanitasi','ld_listrik','ld_sekolah','ld_jkn',
    'sos_gotong','sos_musdes','sos_keamanan','sos_budaya',
    'eko_keragaman','eko_pasar','eko_keuangan',
    'ling_sampah','ling_airlimbah','ling_rth','ling_kesiap',
    'aks_sd','aks_puskesmas','aks_pasar','aks_kantor',
    'tg_transparansi','tg_musrenbang','tg_rkpdes','tg_perdes'
  ];
  numNames.forEach(n => {
    const el = form.elements[n];
    if(!el) return;
    const v = el.value.trim();
    if(v==='') return;
    const num = +v;
    if(!isFinite(num) || num<0 || num>100){
      el.closest('label').classList.add('invalid');
      el.closest('label').querySelector('.err').textContent = 'Isi bilangan 0–100';
      ok = false;
    }
  });

  return ok;
}

// ====== Skoring (rata-rata per dimensi, abaikan kolom kosong) ======
const dimGroups = {
  ld: ['ld_air','ld_sanitasi','ld_listrik','ld_sekolah','ld_jkn'],
  sos: ['sos_gotong','sos_musdes','sos_keamanan','sos_budaya'],
  eko: ['eko_keragaman','eko_pasar','eko_keuangan'],
  ling: ['ling_sampah','ling_airlimbah','ling_rth','ling_kesiap'],
  aks: ['aks_sd','aks_puskesmas','aks_pasar','aks_kantor'],
  tg: ['tg_transparansi','tg_musrenbang','tg_rkpdes','tg_perdes']
};

function avg(arr){
  const nums = arr.map(x => +x).filter(x => isFinite(x));
  if(nums.length===0) return '';
  return Math.round(nums.reduce((a,b)=>a+b,0) / nums.length);
}

function computeScores(row){
  const sLD = avg(dimGroups.ld.map(k => row[k]));
  const sSOS = avg(dimGroups.sos.map(k => row[k]));
  const sEKO = avg(dimGroups.eko.map(k => row[k]));
  const sLING = avg(dimGroups.ling.map(k => row[k]));
  const sAKS = avg(dimGroups.aks.map(k => row[k]));
  const sTG = avg(dimGroups.tg.map(k => row[k]));

  const parts = [sLD,sSOS,sEKO,sLING,sAKS,sTG].filter(x => x!=='' && isFinite(+x));
  const total = parts.length? Math.round(parts.reduce((a,b)=>a+b,0)/parts.length) : '';

  return {
    skor_ld: sLD, skor_sos: sSOS, skor_eko: sEKO,
    skor_ling: sLING, skor_aks: sAKS, skor_tg: sTG,
    skor_total: total
  };
}

// ====== Tambahkan ke tabel ======
document.getElementById('btnAdd').addEventListener('click', ()=>{
  if(!validateForm()) return;
  const fd = new FormData(form);
  const row = {};
  columns.forEach(c => {
    if(['skor_ld','skor_sos','skor_eko','skor_ling','skor_aks','skor_tg','skor_total'].includes(c.key)) return;
    row[c.key] = (fd.get(c.key) ?? '').toString().trim();
  });
  Object.assign(row, computeScores(row));
  dataList.push(row);
  saveStorage();
  renderBody();
  form.reset();
});

// ====== Clear ======
document.getElementById('btnClear').addEventListener('click', ()=>{
  if(confirm('Hapus semua data tersimpan di peramban ini?')){
    dataList = [];
    saveStorage();
    renderBody();
  }
});

// ====== Download Excel ======
document.getElementById('btnDownload').addEventListener('click', async ()=>{
  if(dataList.length === 0){
    alert('Belum ada data untuk diunduh.');
    return;
  }
  try{
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Helpdesk IDM Kebonrejo v3';
    wb.created = new Date();

    // Sheet 1: Data IDM (lengkap)
    const ws1 = wb.addWorksheet('Data IDM');
    ws1.columns = columns.map(c => ({ header: c.label, key: c.key, width: Math.max(12, c.label.length + 2) }));
    dataList.forEach(row => ws1.addRow(row));
    ws1.getRow(1).font = { bold:true };

    // Sheet 2: Rekap Dimensi
    const ws2 = wb.addWorksheet('Rekap Dimensi');
    const rekapCols = [
      {header:'RT/RW', key:'rt_rw', width:10},
      {header:'Dusun', key:'dusun', width:14},
      {header:'Nama KK', key:'nama_kk', width:22},
      {header:'Skor Layanan Dasar', key:'skor_ld', width:18},
      {header:'Skor Sosial', key:'skor_sos', width:14},
      {header:'Skor Ekonomi', key:'skor_eko', width:16},
      {header:'Skor Lingkungan', key:'skor_ling', width:18},
      {header:'Skor Aksesibilitas', key:'skor_aks', width:18},
      {header:'Skor Tata Kelola', key:'skor_tg', width:18},
      {header:'Skor Total', key:'skor_total', width:14}
    ];
    ws2.columns = rekapCols;
    dataList.forEach(row => {
      const r = {};
      rekapCols.forEach(c => r[c.key] = row[c.key] ?? '');
      ws2.addRow(r);
    });
    ws2.getRow(1).font = { bold:true };

    // Sheet 3: Panduan
    const ws3 = wb.addWorksheet('Panduan');
    const notes = [
      ['Helpdesk IDM Kebonrejo v3 (Versi Ringan 6 Dimensi)'],
      ['Tanggal Ekspor', new Date().toLocaleString('id-ID')],
      ['Deskripsi', 'Skor dihitung sebagai rata-rata indikator per dimensi (0–100). Total = rata-rata dari 6 dimensi yang terisi.'],
      ['Catatan', 'Gunakan nilai 0–100 pada setiap indikator. Kosongkan jika tidak relevan.'],
      ['Privasi', 'Data tersimpan di perangkat (localStorage) hingga dihapus atau diekspor.'],
      ['Koordinat', 'Klik "Ambil Koordinat" atau klik peta (butuh internet untuk tiles).'],
      ['Penyesuaian', 'Nama indikator dapat disesuaikan agar mengikuti Juknis Kemendesa terbaru.']
    ];
    notes.forEach(r => ws3.addRow(r));
    ws3.getColumn(1).width = 24;
    ws3.getColumn(2).width = 80;
    ws3.getRow(1).font = { bold:true };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data_idm_kebonrejo_v3.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }catch(e){
    console.error(e);
    alert('Gagal membuat file Excel: ' + e.message);
  }
});
