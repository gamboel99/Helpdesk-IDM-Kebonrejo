// script.js — full 38 indicators (mapping dropdown choices to scores 0 / 0.5 / 1)
// Storage key
const STORAGE_KEY = 'helpdeskidmkebonrejo:full38:data';
// indicator keys in arrays per dimension (for compute)
const dims = {
  A: ['a1_air','a2_sanitasi','a3_listrik','a4_jkn','a5_pendidikan','a6_posyandu','a7_pdam'],
  B: ['b1_gotong','b2_musdes','b3_paud','b4_ibu','b5_kelompok','b6_keamanan','b7_rawan'],
  C: ['c1_keragaman','c2_pasar','c3_aset','c4_keu','c5_kredit','c6_tk','c7_infra'],
  D: ['d1_sampah','d2_airlimbah','d3_kualitas','d4_rth','d5_bencana','d6_kesiap'],
  E: ['e1_sd','e2_pkm','e3_pasar'],
  F: ['f1_musrenbang','f2_rkpdes','f3_apbdes','f4_perdes','f5_partisipasi','f6_aset','f7_pengaduan','f8_sdm']
};

// mapping table: option value -> numeric score (0, 0.5, 1)
// We'll use defaults: best -> 1, middle -> 0.5, worst -> 0
const mapping = {
  // A
  'layak':1, 'tidak_layak':0.5, 'tidak_ada':0,
  'pln_stabil':1, 'pln_tidak':0.5,
  'semua':1, 'sebagian':0.5, 'tidak':0,
  'terjangkau':1, 'sulit':0.5, 'pdam':1, 'pipa':1, 'sumur':0.5, 'lain':0,
  'terjangkau':1, 'sulit':0.5, 'tidak_ada':0,
  // B
  'sering':1, 'jarang':0.5, 'tidak':0,
  'ada':1, 'baik':1, 'kurang':0.5, 'rendah':1, 'sedang':0.5, 'tinggi':0,
  'ada_tidak':0.5,
  // C
  'tinggi':1, 'sedang':0.5, 'rendah':0,
  'mudah':1, 'sulit':0.5, 'tidak':0,
  'ya':1, 'tidak':0,
  'pernah':1, 'tidak_pernah':0, 'tidak pernah':0,
  'cukup':1, 'kurang':0.5, 'sedikit':0.3,
  'ada_tidak':0.5,
  // D
  'terpilah':1, 'mandiri':0.7, 'sebar':0,
  'baik':1, 'tidak':0,
  'memadai':1, 'kurang':0.5,
  'rendah':1, 'sedang':0.6, 'tinggi':0.3,
  'aktif':1, 'pasif':0.5,
  // E
  'dekat':1, 'jauh':0.5,
  'mudah':1,
  // F
  'aktif':1, 'kurang':0.5, 'tidak':0,
  'ada':1, 'lama':0.5,
  'terbuka':1, 'terbatas':0.5,
  'banyak':1, 'sedikit':0.5,
  'tinggi':1, 'sedang':0.5, 'rendah':0.3,
  'baik':1, 'kurang':0.5, 'tidak':0,
  'ada_tidak':0.5,
  'memadai':1
};

// helper to map option to numeric score
function mapScore(val){
  if(val===null || val==='' ) return null;
  const key = val.toString().trim();
  if(Object.prototype.hasOwnProperty.call(mapping, key)) return mapping[key];
  // fallback: try parse number
  const n = Number(key);
  if(!isNaN(n)) return n;
  return null;
}

// compute averages per dimension and total (0-100 scale)
function avgScores(keys, row){
  const nums = keys.map(k=> mapScore(row[k])).filter(v=> v!==null && v!==undefined);
  if(nums.length===0) return null;
  const avg = nums.reduce((a,b)=>a+b,0)/nums.length;
  return Math.round(avg * 100); // convert to 0-100
}

// category thresholds per Kemendesa (using 0-1 thresholds); input total in 0-100
function categorize(total100){
  if(total100===null || total100==='') return 'Belum';
  const t = total100/100;
  if(t < 0.491) return 'Tertinggal';
  if(t < 0.599) return 'Berkembang';
  if(t < 0.707) return 'Maju';
  return 'Mandiri';
}

// storage helpers
function loadData(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }catch(e){ return []; } }
function saveData(d){ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

// on DOM ready - attach handlers
document.addEventListener('DOMContentLoaded', ()=>{
  // map init
  try{
    const map = L.map('map').setView([-7.816,112.108], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    let marker = L.marker([-7.816,112.108]).addTo(map);
    map.on('click', e=>{
      document.getElementById('lat').value = e.latlng.lat.toFixed(6);
      document.getElementById('lng').value = e.latlng.lng.toFixed(6);
      document.getElementById('acc').value = 0;
      marker.setLatLng(e.latlng);
    });
    document.getElementById('btnGPS').addEventListener('click', ()=>{
      if(!navigator.geolocation){ alert('Geolocation tidak didukung'); return; }
      navigator.geolocation.getCurrentPosition(pos=>{
        const lat = pos.coords.latitude.toFixed(6), lng = pos.coords.longitude.toFixed(6), acc = Math.round(pos.coords.accuracy||0);
        document.getElementById('lat').value = lat; document.getElementById('lng').value = lng; document.getElementById('acc').value = acc;
        marker.setLatLng([lat,lng]); map.setView([lat,lng],17);
      }, err=> alert('Gagal ambil lokasi: '+err.message), {enableHighAccuracy:true, timeout:15000, maximumAge:0});
    });
  }catch(e){ console.warn('Map init gagal'); }

  const form = document.getElementById('idmForm');
  const btnAdd = document.getElementById('btnAdd');
  const resultBox = document.getElementById('resultBox');

  btnAdd.addEventListener('click', ()=>{
    // read form
    // basic validation for required identity fields
    const required = ['dusun','rt_rw','nama_kk','jml_anggota'];
    let ok = true;
    form.querySelectorAll('.err').forEach(e=>e.textContent='');
    required.forEach(k=>{
      const el = form.elements[k];
      if(!el || !el.value.trim()){ el.closest('label').querySelector('.err').textContent='Wajib diisi'; ok=false; }
    });
    const nikEl = form.elements['nik'];
    if(nikEl && nikEl.value && !/^\d{16}$/.test(nikEl.value)){ nikEl.closest('label').querySelector('.err').textContent='NIK harus 16 digit'; ok=false; }

    if(!ok) return;

    const row = {};
    // collect all inputs
    const inputs = form.querySelectorAll('select,input[name]');
    inputs.forEach(inp=>{
      if(!inp.name) return;
      row[inp.name] = inp.value || '';
    });

    // compute scores per dimension
    const skorA = avgScores(dims.A, row);
    const skorB = avgScores(dims.B, row);
    const skorC = avgScores(dims.C, row);
    const skorD = avgScores(dims.D, row);
    const skorE = avgScores(dims.E, row);
    const skorF = avgScores(dims.F, row);

    // total average across dimensions that have values
    const parts = [skorA,skorB,skorC,skorD,skorE,skorF].filter(v=> v!==null);
    const skorTotal = parts.length? Math.round(parts.reduce((a,b)=>a+b,0)/parts.length) : null;

    const kategori = skorTotal===null ? 'Belum' : categorize(skorTotal);

    // attach scores to row
    row['skor_a'] = skorA===null?'':skorA;
    row['skor_b'] = skorB===null?'':skorB;
    row['skor_c'] = skorC===null?'':skorC;
    row['skor_d'] = skorD===null?'':skorD;
    row['skor_e'] = skorE===null?'':skorE;
    row['skor_f'] = skorF===null?'':skorF;
    row['skor_total'] = skorTotal===null?'':skorTotal;
    row['kategori'] = kategori;
    row['_created'] = new Date().toISOString();

    // save
    const data = loadData();
    data.push(row);
    saveData(data);

    // show result
    resultBox.style.display='block';
    resultBox.innerHTML = `<h3>Hasil IDM: ${kategori}</h3>
      <p>Skor Total: <strong>${row['skor_total']||'-'}</strong> (0–100)</p>
      <p>Detail: A ${row['skor_a']||'-'} | B ${row['skor_b']||'-'} | C ${row['skor_c']||'-'} | D ${row['skor_d']||'-'} | E ${row['skor_e']||'-'} | F ${row['skor_f']||'-'}</p>
      <p class="muted">Data tersimpan di perangkat Anda. Buka <a href="dashboard.html">Dashboard</a> untuk rekap & peta.</p>`;

    form.reset();
    localStorage.setItem('helpdeskidmkebonrejo:full38:updated', new Date().toISOString());
  });
});
