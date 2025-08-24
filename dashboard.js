// dashboard.js for full38 - aggregates, charts, map, exports
const STORAGE_KEY = 'helpdeskidmkebonrejo:full38:data';
function loadData(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }catch(e){ return []; } }
function avg(nums){ const n = nums.map(x=>Number(x)).filter(v=>isFinite(v)); return n.length? Math.round(n.reduce((a,b)=>a+b,0)/n.length): '-' }
function categorize(score){ if(score==='-'||score===''||score==null) return 'Belum'; const t=Number(score)/100; if(t<0.491) return 'Tertinggal'; if(t<0.599) return 'Berkembang'; if(t<0.707) return 'Maju'; return 'Mandiri' }
function colorByCategory(cat){ if(cat==='Mandiri') return '#16a34a'; if(cat==='Maju') return '#3b82f6'; if(cat==='Berkembang') return '#f59e0b'; if(cat==='Tertinggal') return '#ef4444'; return '#9aa4b2' }

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
  new Chart(ctx,{type:'pie',data:{labels:cats,datasets:[{data:counts}]},options:{plugins:{legend:{position:'bottom'}}}});

  // per dusun cards with RW breakdown
  const dusunList = document.getElementById('dusunList');
  dusunList.innerHTML='';
  dusuns.forEach(ds=>{
    const items = data.filter(d=>d.dusun===ds);
    const avgTotal = avg(items.map(i=>i.skor_total));
    const cat = categorize(avgTotal);
    const card = document.createElement('div'); card.className='card';
    let html = `<h3>${ds} — Skor Rata: ${avgTotal} — <span style="color:${colorByCategory(cat)}">${cat}</span></h3>`;
    // group by RW (last part after slash)
    const byRW = items.reduce((acc,cur)=>{ const rw=(cur.rt_rw||'').split('/').slice(-1)[0]||cur.rt_rw; (acc[rw]=acc[rw]||[]).push(cur); return acc; },{});
    html += '<table><thead><tr><th>RW</th><th>Entri</th><th>Skor Rata</th><th>Kategori</th></tr></thead><tbody>';
    Object.keys(byRW).forEach(rw=>{ const arr=byRW[rw]; const a=avg(arr.map(x=>x.skor_total)); html+=`<tr><td>${rw}</td><td>${arr.length}</td><td>${a}</td><td>${categorize(a)}</td></tr>` });
    html += '</tbody></table>';
    card.innerHTML = html;
    dusunList.appendChild(card);
  });

  // map
  try{
    const map = L.map('mapDash').setView([-7.816,112.108],13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    data.forEach(d=>{
      const lat=parseFloat(d.lat), lng=parseFloat(d.lng); if(!isFinite(lat)||!isFinite(lng)) return;
      const m = L.circleMarker([lat,lng],{radius:6,color:colorByCategory(d.kategori),fillColor:colorByCategory(d.kategori),fillOpacity:0.8}).addTo(map);
      m.bindPopup(`<strong>${d.nama_kk}</strong><br>${d.dusun} - ${d.rt_rw}<br>Skor: ${d.skor_total} (${d.kategori})`);
    });
  }catch(e){ console.warn('Map init failed'); }

  // export and clear handlers
  document.getElementById('btnExportAll').addEventListener('click', ()=> exportExcel(data));
  document.getElementById('btnClearAll').addEventListener('click', ()=>{ if(confirm('Hapus semua data?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } });
});

async function exportExcel(data){
  try{
    const wb = new ExcelJS.Workbook(); wb.creator='Helpdesk IDM Kebonrejo'; wb.created=new Date();
    // Data_KK sheet with all fields
    const allKeys = Object.keys(data[0]||{});
    const ws1 = wb.addWorksheet('Data_KK');
    const cols = [{header:'Dusun',key:'dusun',width:14},{header:'RT/RW',key:'rt_rw',width:12},{header:'Nama KK',key:'nama_kk',width:22},{header:'NIK',key:'nik',width:18}];
    cols.push({header:'Jml Ang',key:'jml_anggota',width:8},{header:'HP',key:'hp',width:12},{header:'Foto',key:'foto_rumah',width:18},{header:'Tgl',key:'tgl',width:14},{header:'Lat',key:'lat',width:12},{header:'Lng',key:'lng',width:12});
    // add all skor fields and kategori
    cols.push({header:'Skor A',key:'skor_a',width:10},{header:'Skor B',key:'skor_b',width:10},{header:'Skor C',key:'skor_c',width:10},{header:'Skor D',key:'skor_d',width:10},{header:'Skor E',key:'skor_e',width:10},{header:'Skor F',key:'skor_f',width:10},{header:'Skor Total',key:'skor_total',width:12},{header:'Kategori',key:'kategori',width:14});
    ws1.columns = cols;
    data.forEach(d=> ws1.addRow(d));
    ws1.getRow(1).font={bold:true};

    // Rekap RT
    const byRT = data.reduce((acc,cur)=>{ const k=cur.rt_rw||'Unknown'; (acc[k]=acc[k]||[]).push(cur); return acc; },{});
    const wsRT = wb.addWorksheet('Rekap_RT'); wsRT.columns=[{header:'RT/RW',key:'rt',width:12},{header:'Entri',key:'cnt',width:8},{header:'Skor Rata',key:'avg',width:12},{header:'Kategori',key:'kategori',width:14}];
    Object.keys(byRT).forEach(k=>{ const arr=byRT[k]; wsRT.addRow({rt:k,cnt:arr.length,avg:avg(arr.map(x=>x.skor_total)),kategori:categorize(avg(arr.map(x=>x.skor_total)))}); });
    wsRT.getRow(1).font={bold:true};

    // Rekap RW (group by part after slash)
    const byRW = data.reduce((acc,cur)=>{ const key=(cur.rt_rw||'').split('/').slice(-1)[0]||cur.rt_rw; (acc[key]=acc[key]||[]).push(cur); return acc; },{});
    const wsRW = wb.addWorksheet('Rekap_RW'); wsRW.columns=[{header:'RW',key:'rw',width:8},{header:'Entri',key:'cnt',width:8},{header:'Skor Rata',key:'avg',width:12},{header:'Kategori',key:'kategori',width:14}];
    Object.keys(byRW).forEach(k=>{ const arr=byRW[k]; wsRW.addRow({rw:k,cnt:arr.length,avg:avg(arr.map(x=>x.skor_total)),kategori:categorize(avg(arr.map(x=>x.skor_total)))}); });
    wsRW.getRow(1).font={bold:true};

    // Rekap Dusun
    const byDusun = data.reduce((acc,cur)=>{ const k=cur.dusun||'Unknown'; (acc[k]=acc[k]||[]).push(cur); return acc; },{});
    const wsDusun = wb.addWorksheet('Rekap_Dusun'); wsDusun.columns=[{header:'Dusun',key:'dusun',width:18},{header:'Entri',key:'cnt',width:8},{header:'Skor Rata',key:'avg',width:12},{header:'Kategori',key:'kategori',width:14}];
    Object.keys(byDusun).forEach(k=>{ const arr=byDusun[k]; wsDusun.addRow({dusun:k,cnt:arr.length,avg:avg(arr.map(x=>x.skor_total)),kategori:categorize(avg(arr.map(x=>x.skor_total)))}); });
    wsDusun.getRow(1).font={bold:true};

    // Rekap Desa
    const wsDesa = wb.addWorksheet('Rekap_Desa'); wsDesa.addRow(['Skor Rata Desa',avg(data.map(d=>d.skor_total))]); wsDesa.addRow(['Kategori Desa',categorize(avg(data.map(d=>d.skor_total)))]); wsDesa.getRow(1).font={bold:true};

    // Panduan
    const wsP = wb.addWorksheet('Panduan'); wsP.addRow(['Helpdesk IDM Kebonrejo — Full 38 Indikator']); wsP.addRow(['Tanggal Ekspor', new Date().toLocaleString('id-ID')]); wsP.addRow(['Catatan','Mapping pilihan ke skor 0/0.5/1; skor dimensi = rata-rata; skor total = rata-rata dimensi yang terisi; kategori sesuai Juknis Kemendesa']); wsP.getColumn(1).width=28; wsP.getColumn(2).width=60;

    const buffer = await wb.xlsx.writeBuffer(); const blob = new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='data_idm_kebonrejo_full38.xlsx'; a.click(); URL.revokeObjectURL(url);
  }catch(e){ console.error(e); alert('Gagal ekspor: '+e.message); }
}
