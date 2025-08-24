// script.js for v4 (form + storage + compute + dashboard helper)
// Shared data key
const STORAGE_KEY = 'helpdeskidmkebonrejo:v4:data';
// Columns used for export (ke Excel)
const allKeys = [
  'dusun','rt_rw','nama_kk','nik','jml_anggota','hp','foto_rumah','tgl','lat','lng','acc',
  // indicators
  'ld_air','ld_sanitasi','ld_listrik','ld_sekolah','ld_jkn',
  'sos_gotong','sos_musdes','sos_keamanan','sos_budaya',
  'eko_keragaman','eko_pasar','eko_keuangan',
  'ling_sampah','ling_airlimbah','ling_rth','ling_kesiap',
  'aks_sd','aks_puskesmas','aks_pasar','aks_kantor',
  'tg_transparansi','tg_musrenbang','tg_rkpdes','tg_perdes',
  // scores
  'skor_ld','skor_sos','skor_eko','skor_ling','skor_aks','skor_tg','skor_total','kategori'
];

// util: load/save
function loadData(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }catch(e){ return []; }
}
function saveData(d){ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

// init map
let map, marker;
function initMap(id='map', defaultView=[-7.816,112.108], zoom=13){
  try{
    map = L.map(id).setView(defaultView, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    marker = L.marker(defaultView).addTo(map);
    map.on('click', e => {
      const lat = e.latlng.lat.toFixed(6), lng = e.latlng.lng.toFixed(6);
      document.getElementById('lat').value = lat;
      document.getElementById('lng').value = lng;
      document.getElementById('acc').value = 0;
      marker.setLatLng([lat,lng]);
    });
  }catch(e){ console.warn('Map init failed (possibly offline)'); }
}

// geolocation
document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('btnGPS')){
    initMap();
    document.getElementById('btnGPS').addEventListener('click', ()=>{
      if(!navigator.geolocation){ alert('Perangkat tidak mendukung geolokasi'); return; }
      navigator.geolocation.getCurrentPosition(pos=>{
        const lat = pos.coords.latitude.toFixed(6), lng = pos.coords.longitude.toFixed(6), acc = Math.round(pos.coords.accuracy || 0);
        document.getElementById('lat').value = lat;
        document.getElementById('lng').value = lng;
        document.getElementById('acc').value = acc;
        if(marker) marker.setLatLng([lat,lng]);
        if(map) map.setView([lat,lng],17);
      }, err=> alert('Gagal ambil lokasi: '+err.message), {enableHighAccuracy:true, timeout:15000, maximumAge:0});
    });
  }
});

// validation helper
function validateForm(form){
  let ok = true;
  form.querySelectorAll('.err').forEach(e=>e.textContent='');
  const required = ['dusun','rt_rw','nama_kk','jml_anggota'];
  required.forEach(k=>{
    const el = form.elements[k];
    if(el && !el.value.trim()){ el.closest('label').querySelector('.err').textContent='Wajib diisi'; ok=false; }
  });
  const nik = form.elements['nik'];
  if(nik && nik.value && !/^\d{16}$/.test(nik.value)){ nik.closest('label').querySelector('.err').textContent='NIK harus 16 digit'; ok=false; }
  // numeric ranges
  const nums = [
    'ld_air','ld_sanitasi','ld_listrik','ld_sekolah','ld_jkn',
    'sos_gotong','sos_musdes','sos_keamanan','sos_budaya',
    'eko_keragaman','eko_pasar','eko_keuangan',
    'ling_sampah','ling_airlimbah','ling_rth','ling_kesiap',
    'aks_sd','aks_puskesmas','aks_pasar','aks_kantor',
    'tg_transparansi','tg_musrenbang','tg_rkpdes','tg_perdes'
  ];
  nums.forEach(k=>{
    const el = form.elements[k];
    if(!el) return;
    if(el.value==='') return;
    const n = Number(el.value);
    if(!isFinite(n) || n<0 || n>100){ el.closest('label').querySelector('.err').textContent='Isi 0–100'; ok=false; }
  });
  return ok;
}

// scoring: average per dimensi then total; kategori based on 0-1 thresholds
function avgOf(keys, row){
  const vals = keys.map(k => parseFloat(row[k])).filter(v=>isFinite(v));
  if(vals.length===0) return '';
  return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
}
function computeScores(row){
  const ldKeys = ['ld_air','ld_sanitasi','ld_listrik','ld_sekolah','ld_jkn'];
  const sosKeys = ['sos_gotong','sos_musdes','sos_keamanan','sos_budaya'];
  const ekoKeys = ['eko_keragaman','eko_pasar','eko_keuangan'];
  const lingKeys = ['ling_sampah','ling_airlimbah','ling_rth','ling_kesiap'];
  const aksKeys = ['aks_sd','aks_puskesmas','aks_pasar','aks_kantor'];
  const tgKeys = ['tg_transparansi','tg_musrenbang','tg_rkpdes','tg_perdes'];

  const skor_ld = avgOf(ldKeys,row);
  const skor_sos = avgOf(sosKeys,row);
  const skor_eko = avgOf(ekoKeys,row);
  const skor_ling = avgOf(lingKeys,row);
  const skor_aks = avgOf(aksKeys,row);
  const skor_tg = avgOf(tgKeys,row);

  const parts = [skor_ld,skor_sos,skor_eko,skor_ling,skor_aks,skor_tg].filter(x=>x!=='');
  const skor_total = parts.length? Math.round(parts.reduce((a,b)=>a+b,0)/parts.length) : '';

  // kategori using 0-1 thresholds (convert skor_total 0-100 -> 0-1)
  let kategori = '';
  if(skor_total==='') kategori='Belum';
  else{
    const t = skor_total / 100;
    if(t <= 0.49) kategori = 'Tertinggal';
    else if(t <= 0.74) kategori = 'Berkembang';
    else if(t <= 0.82) kategori = 'Maju';
    else kategori = 'Mandiri';
  }

  return {
    skor_ld, skor_sos, skor_eko, skor_ling, skor_aks, skor_tg, skor_total, kategori
  };
}

// add entry from form
document.addEventListener('DOMContentLoaded', ()=>{
  const form = document.getElementById('idmForm');
  const btnAdd = document.getElementById('btnAdd');
  const resultBox = document.getElementById('resultBox');

  btnAdd.addEventListener('click', ()=>{
    if(!validateForm(form)) return;
    const fd = new FormData(form);
    const row = {};
    allKeys.forEach(k=> row[k] = (fd.get(k) ?? '').toString().trim());
    // compute scores
    const sc = computeScores(row);
    Object.assign(row, sc);
    // timestamp
    row._created = new Date().toISOString();
    // save
    const data = loadData();
    data.push(row);
    saveData(data);
    // show result
    resultBox.style.display = 'block';
    resultBox.innerHTML = `<h3>Hasil Skoring: ${row.kategori}</h3>
      <p>Skor Total: <strong>${row.skor_total}</strong> (0–100)</p>
      <p>Detail: LD ${row.skor_ld} | Sos ${row.skor_sos} | Eko ${row.skor_eko} | Ling ${row.skor_ling} | Aks ${row.skor_aks} | Tg ${row.skor_tg}</p>
      <p class="muted">Data disimpan di perangkat Anda. Gunakan Dashboard untuk rekap atau klik Download Excel di Dashboard.</p>`;
    form.reset();
    // update dashboard storage flag so dashboard reloads when opened
    localStorage.setItem('helpdeskidmkebonrejo:v4:updated', new Date().toISOString());
  });
});
