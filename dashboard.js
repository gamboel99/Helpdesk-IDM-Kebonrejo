// dashboard.js - reads STORAGE_KEY, builds aggregates, charts, map, export
const STORAGE_KEY = 'helpdeskidmkebonrejo:v4:data';
function loadData(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }catch(e){ return []; } }
function formatNum(n){ return (n===''||n==null)? '-' : n; }

document.addEventListener('DOMContentLoaded', ()=>{
  const data = loadData();
  document.getElementById('totalEntries').textContent = data.length;
  const dusuns = [...new Set(data.map(d=>d.dusun).filter(Boolean))];
  document.getElementById('uniqueDusun').textContent = dusuns.length;
  const rts = [...new Set(data.map(d=>d.rt_rw).filter(Boolean))];
  document.getElementById('uniqueRT').textContent = rts.length;

  // category distribution
  const cats = ['Mandiri','Maju','Berkembang','Tertinggal','Belum'];
  const counts = cats.map(c=> data.filter(d=>d.kategori===c).length);
  const ctx = document.getElementById('chartCategory').getContext('2d');
  const chart = new Chart(ctx, {
    type:'pie',
    data:{ labels:cats, datasets:[{ data:counts }] },
    options:{plugins:{legend:{position:'bottom'}}}
  });

  // per dusun cards
  const dusunList = document.getElementById('dusunList');
  dusunList.innerHTML = '';
  dusuns.forEach(ds=>{
    const items = data.filter(d=>d.dusun===ds);
    const avg = avgOf(items.map(i=>i.skor_total));
    const cat = categorize(avg);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${ds} — Skor Rata: ${avg} — <span class="muted">${cat}</span></h3>`;
    // breakdown per RW
    const byRW = groupBy(items, d=>d.rt_rw.split('/').slice(-1)[0] || d.rt_rw);
    const tbl = document.createElement('div');
    tbl.innerHTML = '<table><thead><tr><th>RT/RW</th><th>Entri</th><th>Skor Rata</th><th>Kategori</th></tr></thead><tbody>' +
      Object.keys(byRW).map(k=>{
        const arr = byRW[k];
        const a = avgOf(arr.map(x=>x.skor_total));
        return `<tr><td>${k}</td><td>${arr.length}</td><td>${a}</td><td>${categorize(a)}</td></tr>`;
      }).join('') + '</tbody></table>';
    card.appendChild(tbl);
    dusunList.appendChild(card);
  });

  // map points
  let map;
  try{
    map = L.map('mapDash').setView([-7.816,112.108], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    data.forEach(d=>{
      const lat = parseFloat(d.lat), lng = parseFloat(d.lng);
      if(!isFinite(lat) || !isFinite(lng)) return;
      const color = colorByCategory(d.kategori);
      const m = L.circleMarker([lat,lng], {radius:6, color:color, fillColor:color, fillOpacity:0.8}).addTo(map);
      m.bindPopup(`<strong>${d.nama_kk}</strong><br>${d.dusun} – ${d.rt_rw}<br>Skor: ${d.skor_total} (${d.kategori})`);
    });
  }catch(e){ console.warn('Map init failed'); }

  // export excel button
  document.getElementById('btnExportAll').addEventListener('click', ()=> exportExcel(data));
  document.getElementById('btnClearAll').addEventListener('click', ()=>{
    if(confirm('Hapus semua data di peramban?')){
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    }
  });
});

function avgOf(arr){ const nums = arr.map(x=>Number(x)).filter(v=>isFinite(v)); return nums.length? Math.round(nums.reduce((a,b)=>a+b,0)/nums.length): '-'; }
function groupBy(arr, fn){ return arr.reduce((acc,cur)=>{ const k = fn(cur) || 'Unknown'; (acc[k] = acc[k]||[]).push(cur); return acc; }, {}); }
function categorize(score){
  if(score === '-' || score === '' || score == null) return 'Belum';
  const t = Number(score)/100;
  if(isNaN(t)) return 'Belum';
  if(t <= 0.49) return 'Tertinggal';
  if(t <= 0.74) return 'Berkembang';
  if(t <= 0.82) return 'Maju';
  return 'Mandiri';
}
function colorByCategory(cat){
  if(cat==='Mandiri') return '#16a34a';
  if(cat==='Maju') return '#3b82f6';
  if(cat==='Berkembang') return '#f59e0b';
  if(cat==='Tertinggal') return '#ef4444';
  return '#9aa4b2';
}

// Export Excel (Data KK, Rekap RT, RW, Dusun, Desa)
async function exportExcel(data){
  try{
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Helpdesk IDM Kebonrejo v4';
    wb.created = new Date();

    // Sheet Data KK
    const ws1 = wb.addWorksheet('Data_KK');
    ws1.columns = [ {header:'Dusun', key:'dusun', width:14}, {header:'RT/RW',key:'rt_rw',width:12},
      {header:'Nama KK',key:'nama_kk',width:22}, {header:'NIK',key:'nik',width:18}, {header:'Jml Anggota',key:'jml_anggota',width:12},
      {header:'HP',key:'hp',width:12}, {header:'Foto',key:'foto_rumah',width:20}, {header:'Tgl',key:'tgl',width:14},
      {header:'Lat',key:'lat',width:12}, {header:'Lng',key:'lng',width:12}, {header:'Skor Total',key:'skor_total',width:12}, {header:'Kategori',key:'kategori',width:14} ];
    data.forEach(d=> ws1.addRow({dusun:d.dusun, rt_rw:d.rt_rw, nama_kk:d.nama_kk, nik:d.nik, jml_anggota:d.jml_anggota, hp:d.hp, foto_rumah:d.foto_rumah, tgl:d.tgl, lat:d.lat, lng:d.lng, skor_total:d.skor_total, kategori:d.kategori}));
    ws1.getRow(1).font = {bold:true};

    // Rekap RT
    const byRT = groupBy(data, d=>d.rt_rw);
    const wsRT = wb.addWorksheet('Rekap_RT');
    wsRT.columns = [{header:'RT/RW',key:'rt_rw',width:12},{header:'Entri',key:'cnt',width:8},{header:'Skor Rata',key:'avg',width:12},{header:'Kategori',key:'kategori',width:14}];
    Object.keys(byRT).forEach(k=>{
      const arr = byRT[k]; const avg = avgOf(arr.map(x=>x.skor_total)); wsRT.addRow({rt_rw:k, cnt:arr.length, avg:avg, kategori:categorize(avg)});
    });
    wsRT.getRow(1).font = {bold:true};

    // Rekap RW (group by RW part of rt_rw)
    const byRW = groupBy(data, d=> (d.rt_rw||'').split('/').slice(-1)[0] || d.rt_rw );
    const wsRW = wb.addWorksheet('Rekap_RW');
    wsRW.columns = [{header:'RW',key:'rw',width:8},{header:'Entri',key:'cnt',width:8},{header:'Skor Rata',key:'avg',width:12},{header:'Kategori',key:'kategori',width:14}];
    Object.keys(byRW).forEach(k=>{ const arr=byRW[k]; const avg=avgOf(arr.map(x=>x.skor_total)); wsRW.addRow({rw:k,cnt:arr.length,avg:avg,kategori:categorize(avg)}); });
    wsRW.getRow(1).font = {bold:true};

    // Rekap Dusun
    const byDusun = groupBy(data, d=>d.dusun);
    const wsDusun = wb.addWorksheet('Rekap_Dusun');
    wsDusun.columns = [{header:'Dusun',key:'dusun',width:18},{header:'Entri',key:'cnt',width:8},{header:'Skor Rata',key:'avg',width:12},{header:'Kategori',key:'kategori',width:14}];
    Object.keys(byDusun).forEach(k=>{ const arr=byDusun[k]; const avg=avgOf(arr.map(x=>x.skor_total)); wsDusun.addRow({dusun:k,cnt:arr.length,avg:avg,kategori:categorize(avg)}); });
    wsDusun.getRow(1).font = {bold:true};

    // Rekap Desa (overall)
    const wsDesa = wb.addWorksheet('Rekap_Desa');
    const desaAvg = avgOf(data.map(d=>d.skor_total));
    wsDesa.addRow(['Skor Rata Desa', desaAvg]);
    wsDesa.addRow(['Kategori Desa', categorize(desaAvg)]);
    wsDesa.getColumn(1).width = 20; wsDesa.getColumn(2).width = 18;
    wsDesa.getRow(1).font = {bold:true};

    // Panduan
    const wsP = wb.addWorksheet('Panduan');
    wsP.addRow(['Helpdesk IDM Kebonrejo v4 - Rekap lengkap']);
    wsP.addRow(['Tanggal Ekspor', new Date().toLocaleString('id-ID')]);
    wsP.addRow(['Catatan', 'Skor dihitung 0–100, kategori mengikuti threshold resmi (0-1).']);
    wsP.getColumn(1).width = 30; wsP.getColumn(2).width = 60;

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'data_idm_kebonrejo_v4.xlsx'; a.click();
    URL.revokeObjectURL(url);
  }catch(e){ console.error(e); alert('Gagal ekspor: '+e.message); }
}
