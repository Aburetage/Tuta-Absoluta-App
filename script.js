// ============================================
// Tuta Absoluta App - Script.js (Final Updated)
// الميزات: Side Drawer, Silent SW Update, No Scale Hover, Phase 1 & 2 Features
// ============================================

// ============================================
// Global Variables
// ============================================

let curTemp = 25, curStage = -1, autoInt = null, isAuto = false;
let currentSingleGroup = null;
let T0, TH, K;

let stagesData = [];
let egyptMonthsData = [];
let calendarDataObj = {};
let planCardsData = [];
let sourcesData = [];
let bioAgentsData = [];

// Web Worker Initialization
let thermalWorker = null;
try {
    thermalWorker = new Worker('js/worker.js');
    thermalWorker.onmessage = function(e) {
        if (e.data.type === 'CALCULATION_RESULT') {
            applyThermalResult(e.data.payload);
        }
    };
} catch (err) {
    console.warn('[Worker] Web Worker not supported or failed to load. Falling back to main thread.');
}

// ============================================
// Performance Utilities
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// Phase 1 Helpers: Skeleton & Empty States
// ============================================

function showSkeleton(containerId, count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="skeleton skeleton-card"></div>`;
    }
    container.innerHTML = html;
}

function showEmptyState(containerId, message = "لا توجد نتائج مطابقة لهذا الفلتر حالياً 🌿") {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>لا توجد نتائج</h3>
            <p>${message}</p>
        </div>
    `;
}

// ============================================
// Group Mapping
// ============================================

const groupMap = {
    'biology': ['about', 'thermal', 'daysSection', 'lifecycle'],
    'spread-economic': ['spread', 'economic'],
    'seasonal-heatmap': ['seasonal', 'heatmap'],
    'calendar': ['calendar'],
    'ipm': ['ipm'],
    'bioagents': ['bioagents'],
    'resistance': ['resistance'],
    'faq': ['faq'],
    'sources': ['sources']
};

const groupNames = {
    'biology': 'البيولوجيا والنموذج الحراري',
    'spread-economic': 'الانتشار والتأثير الاقتصادي',
    'seasonal-heatmap': 'النشاط الموسمي والخريطة الحرارية',
    'calendar': 'تقويم المكافحة',
    'ipm': 'برنامج المكافحة المتكاملة',
    'bioagents': 'الأعداء الحيوية',
    'resistance': 'مقاومة المبيدات',
    'faq': 'أسئلة شائعة',
    'sources': 'المصادر'
};

const groupOrder = ['biology', 'spread-economic', 'seasonal-heatmap', 'calendar', 'ipm', 'bioagents', 'resistance', 'faq', 'sources'];

// ============================================
// Side Drawer Logic (NEW)
// ============================================

function toggleSideDrawer() {
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('sideDrawerOverlay');
    const btn = document.getElementById('navMenuBtn');
    const isOpen = drawer.classList.contains('open');

    if (isOpen) {
        closeSideDrawer();
    } else {
        drawer.classList.add('open');
        overlay.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        drawer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeSideDrawer() {
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('sideDrawerOverlay');
    const btn = document.getElementById('navMenuBtn');
    
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

// ============================================
// Thermal Calculation Functions
// ============================================

function calcDaysSync(T) {
    if (T <= T0 || T >= TH) return { egg: -1, larva: -1, pupa: -1, adult: -1, dev: -1, gen: -1 };
    const dE = K.egg / (T - T0);
    const dL = K.larva / (T - T0);
    const dP = K.pupa / (T - T0);
    let dA = T <= 30 ? 24 - .8 * (T - 10) : Math.max(4, 8 - (T - 30) * .5);
    const dev = Math.round((dE + dL + dP) * 10) / 10;
    const gen = Math.round((dE + dL + dP + dA) * 10) / 10;
    return { egg: Math.round(dE * 10) / 10, larva: Math.round(dL * 10) / 10, pupa: Math.round(dP * 10) / 10, adult: Math.round(dA * 10) / 10, dev, gen };
}

function requestThermalCalculation(T) {
    if (thermalWorker) {
        thermalWorker.postMessage({
            type: 'CALCULATE_DAYS',
            payload: { T, T0, TH, K }
        });
    } else {
        applyThermalResult(calcDaysSync(T));
    }
}

function applyThermalResult(d) {
    const z = getZone(curTemp);
    const tc = tClr(curTemp);
    
    document.getElementById('tempVal').textContent = curTemp;
    document.getElementById('tempVal').style.color = tc;
    document.getElementById('tempDesc').textContent = z.l;
    
    const zb = document.getElementById('tempZone');
    zb.textContent = z.z;
    zb.style.background = z.c + '20';
    zb.style.color = z.c;
    
    updTempGrid(d);
    updDaysBars(d);
    drawChart();
    buildHeatmap();
    if (curStage >= 0) updDet();
    updSD(d);
    
    updateDynamicTheme(z.z);
}

function getZone(T) {
    if (T <= T0) return { l: 'لا تطور', c: '#6a9cc8', z: 'متوقف' };
    if (T < 15) return { l: 'نمو بطيء', c: '#68b8c8', z: 'بطيء' };
    if (T < 22) return { l: 'نمو معتدل', c: '#c8b448', z: 'معتدل' };
    if (T < 28) return { l: 'منطقة مثالية', c: '#2ecc71', z: 'مثالي' };
    if (T <= 30) return { l: 'الحرارة المثلى', c: '#27ae60', z: 'مثالي' };
    if (T < 34) return { l: 'إجهاد حراري', c: '#e8a838', z: 'إجهاد' };
    if (T < TH) return { l: 'إجهاد شديد', c: '#e74c3c', z: 'خطر' };
    return { l: 'حرارة مميتة', c: '#ff3040', z: 'مميت' };
}

function tClr(T) {
    if (T < 12) return '#6a9cc8';
    if (T < 18) return '#68b8c8';
    if (T < 22) return '#90c050';
    if (T < 26) return '#c8c040';
    if (T < 30) return '#e8a838';
    if (T < 34) return '#e87030';
    return '#e74c3c';
}

function hmClr(v) {
    if (v <= 30) return 'rgba(100,180,200,.35)';
    if (v <= 50) return 'rgba(200,180,70,.5)';
    if (v <= 75) return 'rgba(46,204,113,.55)';
    return 'rgba(231,76,60,.65)';
}

function updateDynamicTheme(riskLevel) {
    const root = document.documentElement;
    if (riskLevel === 'خطر' || riskLevel === 'مميت') {
        root.style.setProperty('--plan-accent', '#e74c3c');
        root.style.setProperty('--plan-accent2', '#ff5252');
    } else if (riskLevel === 'إجهاد' || riskLevel === 'إجهاد شديد') {
        root.style.setProperty('--plan-accent', '#f39c12');
        root.style.setProperty('--plan-accent2', '#f1c40f');
    } else {
        root.style.setProperty('--plan-accent', '#27ae60');
        root.style.setProperty('--plan-accent2', '#2ecc71');
    }
}

// ============================================
// Update Functions
// ============================================

function updAll() {
    requestThermalCalculation(curTemp);
}

function updTempGrid(d) {
    const g = document.getElementById('tempGrid');
    const mk = (v, l, c) => `<div class="temp-item"><div class="val" style="color:${c}">${v < 0 ? '—' : v}</div><div class="lbl">${l}</div></div>`;
    g.innerHTML = mk(d.egg, 'البيضة (يوم)', '#f0e4c8') + mk(d.larva, 'اليرقة (يوم)', '#e8a838') + mk(d.pupa, 'العذراء (يوم)', '#a67c28') + mk(d.adult, 'الكاملة (يوم)', '#e74c3c') + `<div class="temp-item temp-total"><div class="val">${d.dev < 0 ? 'لا تطور' : d.dev}</div><div class="lbl">فترة التطور (بيضة ← حشرة)</div></div>` + `<div class="temp-item temp-total" style="background:rgba(243,156,18,.05);border-color:rgba(243,156,18,.2)"><div class="val" style="color:#f39c12">${d.gen < 0 ? 'لا تطور' : d.gen}</div><div class="lbl">الجيل الكامل (مع البالغ)</div></div>`;
}

function updDaysBars(d) {
    const b = document.getElementById('daysBox');
    const mk = (l, v, c) => { const p = d.dev > 0 && v > 0 ? (v / d.dev * 100) : 0; return `<div class="days-bar-row"><div class="days-bar-lbl" style="color:${c}">${l}</div><div class="days-bar-wrap"><div class="days-bar-fill" style="width:${Math.max(p, 2)}%;background:${c}">${v > 0 && p > 10 ? v + ' يوم' : ''}</div></div><div class="days-bar-val">${v < 0 ? '—' : v + ' يوم'}</div></div>` };
    b.innerHTML = mk('البيضة', d.egg, '#c8b888') + mk('اليرقة', d.larva, '#c89028') + mk('العذراء', d.pupa, '#8a6818') + mk('الكاملة', d.adult, '#e74c3c') + `<div class="days-bar-row days-total-row"><div class="days-bar-lbl" style="color:#e74c3c">التطور</div><div class="days-bar-wrap"><div class="days-bar-fill" style="width:100%;background:linear-gradient(90deg,#c8b888,#c89028,#8a6818,#e74c3c)">${d.dev > 0 ? d.dev + ' يوم (بيضة←حشرة)' : 'لا تطور'}</div></div><div class="days-bar-val" style="color:#e74c3c">${d.dev > 0 ? d.dev + ' يوم' : '—'}</div></div>`;
}

// ============================================
// Chart Functions
// ============================================

function drawRoundedRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawChart() {
    const canvas = document.getElementById('seasonChart');
    if (!canvas) return;
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = 340 * dpr;
    canvas.style.height = '340px';
    
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    
    const W = rect.width, H = 340;
    const pad = { t: 30, r: 35, b: 55, l: 45 };
    const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;
    
    ctx.clearRect(0, 0, W, H);
    
    const data = egyptMonthsData.map(em => { 
        const d = calcDaysSync(em.temp); 
        return { m: em.month, t: em.temp, days: d.dev, gen: d.dev > 0 ? Math.floor(30 / d.dev) : 0 }; 
    });
    
    const maxDays = Math.max(...data.map(d => d.days > 0 ? d.days : 0), 80);
    const maxTemp = Math.max(...data.map(d => d.t)) + 5;
    
    ctx.strokeStyle = 'rgba(255,255,255,.04)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(154,169,182,.4)';
    ctx.font = '9px Tajawal';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 5; i++) {
        const y = pad.t + (cH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(pad.l + cW, y);
        ctx.stroke();
        ctx.fillText(Math.round(maxDays - (maxDays / 5) * i), pad.l - 6, y + 3);
    }
    
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
        const x = pad.l + (i + .5) * (cW / 12);
        ctx.fillStyle = 'rgba(154,169,182,.4)';
        ctx.fillText(d.m, x, H - pad.b + 16);
        ctx.fillStyle = tClr(d.t);
        ctx.font = '8px Tajawal';
        ctx.fillText(d.t + '°', x, H - pad.b + 30);
    });
    
    data.forEach((d, i) => {
        const x = pad.l + (i + .5) * (cW / 12);
        const bw = cW / 12 * .65;
        const bh = d.days > 0 ? (d.days / maxDays) * cH : 0;
        const by = pad.t + cH - bh;
        
        let clr = d.t <= T0 ? 'rgba(100,130,180,.35)' : d.t < 18 ? 'rgba(100,180,200,.55)' : d.t < 22 ? 'rgba(200,180,70,.65)' : d.t <= 30 ? 'rgba(46,204,113,.7)' : 'rgba(230,120,50,.65)';
        
        if (d.days > 0) { 
            ctx.fillStyle = clr; 
            drawRoundedRect(ctx, x - bw / 2, by, bw, bh, 4); 
            ctx.fill(); 
            ctx.fillStyle = '#fff'; 
            ctx.font = 'bold 9px Cairo'; 
            ctx.fillText(d.days, x, by - 4); 
        }
    });
    
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(231,76,60,.8)';
    ctx.lineWidth = 2.5;
    data.forEach((d, i) => { 
        const x = pad.l + (i + .5) * (cW / 12);
        const y = pad.t + cH - (d.t / maxTemp) * cH; 
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); 
    });
    ctx.stroke();
    
    data.forEach((d, i) => {
        const x = pad.l + (i + .5) * (cW / 12);
        const y = pad.t + cH - (d.t / maxTemp) * cH;
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = tClr(d.t);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    });
    
    [[8, 'rgba(100,180,200,.5)', 'العتبة 8°م'], [30, 'rgba(46,204,113,.5)', 'المثلى 30°م']].forEach(([t, cl, lb]) => {
        const y = pad.t + cH - (t / maxTemp) * cH;
        ctx.beginPath();
        ctx.strokeStyle = cl;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(pad.l, y);
        ctx.lineTo(pad.l + cW, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = cl;
        ctx.font = '8px Tajawal';
        ctx.textAlign = 'left';
        ctx.fillText(lb, pad.l + 4, y - 5);
    });
    
    data.forEach((d, i) => {
        const x = pad.l + (i + .5) * (cW / 12);
        ctx.fillStyle = d.gen >= 2 ? 'rgba(231,76,60,.6)' : d.gen >= 1 ? 'rgba(243,156,18,.5)' : 'rgba(154,169,182,.3)';
        ctx.font = 'bold 8px Cairo';
        ctx.textAlign = 'center';
        ctx.fillText(d.gen + ' جيل', x, H - pad.b + 44);
    });
    
    const legend = document.getElementById('chartLegend');
    if (legend) legend.innerHTML = '<span><span class="legend-dot" style="background:rgba(46,204,113,.7)"></span> نشاط عالي</span><span><span class="legend-dot" style="background:rgba(200,180,70,.65)"></span> نشاط متوسط</span><span><span class="legend-dot" style="background:rgba(100,180,200,.55)"></span> نشاط منخفض</span><span style="border-top:3px solid #e74c3c;padding-top:3px"> خط الحرارة</span>';
}

const debouncedDrawChart = debounce(drawChart, 250);

function buildHeatmap() {
    const grid = document.getElementById('heatmapGrid');
    const labels = document.getElementById('heatmapLabels');
    if (!grid) return;
    
    const fragment = document.createDocumentFragment();
    const labelFragment = document.createDocumentFragment();
    
    egyptMonthsData.forEach(em => {
        const d = calcDaysSync(em.temp);
        let act = d.dev <= 0 ? 0 : d.dev <= 25 ? 90 + (25 - d.dev) * 2 : d.dev <= 35 ? 70 + (35 - d.dev) * 2 : d.dev <= 50 ? 45 + (50 - d.dev) * 1.5 : 20 + (75 - d.dev) * .5;
        act = Math.max(0, Math.min(100, act));
        
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.style.background = hmClr(act);
        cell.style.color = act > 70 ? '#fff' : 'var(--text2)';
        cell.innerHTML = `${Math.round(act)}%<div class="heatmap-tip">${em.month} | نشاط ${Math.round(act)}% | حرارة ${em.temp}°م</div>`;
        fragment.appendChild(cell);
        
        const lbl = document.createElement('div');
        lbl.textContent = em.month;
        labelFragment.appendChild(lbl);
    });
    
    grid.innerHTML = '';
    grid.appendChild(fragment);
    labels.innerHTML = '';
    labels.appendChild(labelFragment);
}

// ============================================
// Stages Functions
// ============================================

function buildStages() {
    const g = document.getElementById('sGrid');
    const d = calcDaysSync(curTemp);
    g.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    
    stagesData.forEach((s, i) => {
        const c = document.createElement('div');
        c.className = 'sc2';
        c.style.setProperty('--sc2', s.color);
        c.dataset.i = i;
        c.tabIndex = 0;
        c.setAttribute('role', 'listitem');
        c.setAttribute('aria-label', `${s.name} - ${d[s.id] > 0 ? d[s.id] + ' يوم' : 'لا تطور'}`);
        c.innerHTML = `<div class="sico" style="background:${s.color}15;color:${s.color}"><span style="font-size:1.8rem">${s.icon}</span><span class="snm" style="background:${s.color}">${i + 1}</span></div><div class="snme">${s.name}</div><div class="sdys" data-s="${s.id}" style="color:${s.color}">${d[s.id] < 0 ? '—' : d[s.id]}</div><div class="sdyl">يوم عند ${curTemp}°م</div><div class="sbrf">${s.brief}</div>`;
        c.addEventListener('click', () => selS(i));
        c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selS(i); } });
        fragment.appendChild(c);
    });
    
    g.appendChild(fragment);
}

function updSD(d) {
    stagesData.forEach(s => {
        const el = document.querySelector(`.sdys[data-s="${s.id}"]`);
        if (el) el.textContent = d[s.id] < 0 ? '—' : d[s.id];
    });
    document.querySelectorAll('.sdyl').forEach(el => el.textContent = `يوم عند ${curTemp}°م`);
}

function selS(i) { curStage = i; updSU(); }

function updSU() {
    document.querySelectorAll('.sc2').forEach((c, i) => c.classList.toggle('on', i === curStage));
    const p = document.getElementById('detP');
    if (curStage >= 0) { 
        updDet(); 
        p.classList.add('open'); 
        requestAnimationFrame(() => {
            p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    } else {
        p.classList.remove('open');
    }
}

function updDet() {
    if (curStage < 0) return;
    const s = stagesData[curStage], d = calcDaysSync(curTemp), v = d[s.id];
    document.getElementById('detI').innerHTML = `<div class="dvis" style="background:linear-gradient(135deg,${s.color}05,${s.color}10)"><div class="dvico" style="background:${s.color}15;color:${s.color}"><span style="font-size:3.5rem">${s.icon}</span><div class="dvr" style="border-color:${s.color}"></div></div><div style="font-family:Cairo;font-weight:900;font-size:1.2rem;margin-top:.5rem">${s.name}</div><div style="font-size:2.2rem;font-weight:900;color:${s.color};font-family:Cairo">${v < 0 ? 'لا تطور' : v + ' يوم'}</div><div style="font-size:.78rem;color:#9a8e82">عند متوسط يومي ${curTemp}°م</div></div><div class="dinf"><h3 style="color:${s.color}">${s.title}</h3><div class="dbdg" style="background:${s.color}10;color:${s.color}"><i class="fas fa-hourglass-half" aria-hidden="true"></i>${v < 0 ? 'لا تطور' : v + ' يوم'} عند ${curTemp}°م</div><p>${s.description}</p><ul class="fl">${s.features.map(f => `<li><i class="fas fa-circle" style="color:${s.color}" aria-hidden="true"></i><span>${f}</span></li>`).join('')}</ul></div>`;
}

function toggleA() {
    const b = document.getElementById('autoBtn');
    if (isAuto) { 
        clearInterval(autoInt); 
        isAuto = false; 
        b.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i><span>تشغيل تلقائي</span>'; 
    } else { 
        isAuto = true; 
        b.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i><span>إيقاف</span>'; 
        let s = 0; 
        selS(s); 
        autoInt = setInterval(() => { 
            s = (s + 1) % stagesData.length; 
            selS(s); 
        }, 3500); 
    }
}

// ============================================
// Calendar Functions
// ============================================

function populateTable() {
    const tbody = document.querySelector('#calendarTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const cData = calendarDataObj;
    
    const rows = [
        { label: '🌡️ متوسط الحرارة العظمى (°م)', data: cData.temperatures || [], type: 'temp' },
        { label: '💧 الرطوبة النسبية (%)', data: cData.humidities || [], type: 'hum' },
        { label: '🦋 شدة نشاط الآفة', data: cData.activities || [], type: 'act' },
        { label: ' عدد الأجيال المتوقعة', data: cData.generations || [], type: 'gen' },
        { label: '🪤 مصائد فرمونية (للمراقبة)', data: cData.traps || [], type: 'trap' },
        { label: '🦠 المكافحة البيولوجية', data: cData.bioStatus || [], type: 'bio' },
        { label: '💊 المكافحة الكيميائية', data: cData.chemStatus || [], type: 'chem' },
        { label: '🌞 الحرث والتعقيم الشمسي', data: cData.soilStatus || [], type: 'soil' }
    ];
    
    const getTempColor = t => t < 20 ? '#3b82f6' : t <= 25 ? '#22c55e' : t <= 30 ? '#eab308' : t <= 34 ? '#f97316' : '#ef4444';
    const getHumidityColor = h => h < 55 ? '#f97316' : h <= 70 ? '#22c55e' : '#3b82f6';
    const getGenColor = g => g <= .5 ? '#22c55e' : g <= 1 ? '#eab308' : g <= 1.5 ? '#f97316' : '#ef4444';
    const getActivityLevel = a => a.includes('منخفض') ? 'low' : a.includes('متوسط') ? 'moderate' : a.includes('جداً') ? 'extreme' : 'high';
    const getActivityColor = l => ({ low: '#22c55e', moderate: '#eab308', high: '#f97316', extreme: '#ef4444' }[l] || '#aaa');

    const fragment = document.createDocumentFragment();

    rows.forEach(row => {
        const tr = document.createElement('tr');
        const tdLabel = document.createElement('td');
        tdLabel.textContent = row.label;
        tr.appendChild(tdLabel);

        row.data.forEach((val, i) => {
            const td = document.createElement('td');
            td.setAttribute('data-month', i);
            
            if (row.type === 'temp') {
                td.innerHTML = `<span class="circle-badge" style="background:${getTempColor(val)};">${val}</span>`;
            } else if (row.type === 'hum') {
                td.innerHTML = `<span class="circle-badge" style="background:${getHumidityColor(val)};">${val}</span>`;
            } else if (row.type === 'act') {
                const level = getActivityLevel(val);
                const color = getActivityColor(level);
                td.innerHTML = `<span class="level-badge" style="background:${color}22;border:1px solid ${color};color:${color};"><span class="level-icon" style="background:${color};"></span> ${val}</span>`;
            } else if (row.type === 'gen') {
                td.innerHTML = `<span class="circle-badge" style="background:${getGenColor(val)};">${val}</span>`;
            } else if (row.type === 'trap') {
                td.textContent = val;
            } else if (row.type === 'bio' || row.type === 'chem') {
                let emoji = '🛑', bg = '#2d3748', color = '#a0aec0';
                if (val.includes('مثالية') || val.includes('ضرورية')) { emoji = '🌟'; bg = '#166534'; color = '#bbf7d0'; } 
                else if (val.includes('نشطة')) { emoji = '✅'; bg = '#14532d'; color = '#86efac'; } 
                else if (val.includes('موصى بها')) { emoji = '✅'; bg = '#064e3b'; color = '#6ee7b7'; } 
                else if (val.includes('عند الدفء')) { emoji = '⚠️'; bg = '#78350f'; color = '#fcd34d'; }
                td.innerHTML = `<span class="control-badge" style="background:${bg};color:${color};">${emoji} ${val}</span>`;
            } else if (row.type === 'soil') {
                let emoji = '⛔', bg = '#2d3748', color = '#a0aec0';
                if (val.includes('تعقيم شمسي')) { emoji = '🌟'; bg = '#166534'; color = '#bbf7d0'; } 
                else if (val.includes('حرث')) { emoji = '🚜'; bg = '#14532d'; color = '#86efac'; }
                td.innerHTML = `<span class="control-badge" style="background:${bg};color:${color};">${emoji} ${val}</span>`;
            }
            tr.appendChild(td);
        });
        fragment.appendChild(tr);
    });

    tbody.appendChild(fragment);
}

function buildPlanCards() {
    const wrapper = document.getElementById('planCardWrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    
    planCardsData.forEach(p => {
        const card = document.createElement('div');
        card.className = 'plan-card';
        card.id = 'card-' + p.id;
        card.style.borderRight = `4px solid ${p.color}`;
        card.style.padding = '1rem';
        
        const contextHtml = p.context.map(c => `<p><strong>${c.label}:</strong> ${c.text}</p>`).join('');
        card.innerHTML = `<div class="plan-card-header"><span>${p.months}</span><span class="plan-card-badge" style="background:rgba(${hexToRgb(p.color)},.2);color:${p.color};">${p.level}</span></div><h3 style="color:#fff;margin-bottom:1rem;font-size:1.1rem;">${p.title}</h3><div class="plan-card-context">${contextHtml}</div><ul class="plan-card-list">${p.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
        
        if (p.id !== 'jan-feb') card.classList.add('hidden-card');
        fragment.appendChild(card);
    });
    
    wrapper.appendChild(fragment);
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
}

function showPlanCard(period, btn) {
    document.querySelectorAll('#planFilterCol .filter-btn').forEach(b => { 
        b.classList.remove('active'); 
        b.setAttribute('aria-pressed', 'false'); 
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    
    const cards = document.querySelectorAll('.plan-card');
    cards.forEach(c => { 
        c.classList.add('hidden-card'); 
        c.style.opacity = '0'; 
        c.style.transform = 'translateX(-20px)'; 
    });
    
    const target = document.getElementById('card-' + period);
    if (target) {
        target.classList.remove('hidden-card');
        requestAnimationFrame(() => { 
            target.style.opacity = '1'; 
            target.style.transform = 'translateX(0)'; 
        });
    }
}

function filterSeason(season, btn) {
    document.querySelectorAll('.filter-bar .filter-btn').forEach(b => { 
        b.classList.remove('active'); 
        b.setAttribute('aria-pressed', 'false'); 
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    
    const allMonths = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    let visible;
    if (season === 'all') visible = allMonths;
    else if (season === 'spring') visible = [2, 3, 4];
    else if (season === 'summer') visible = [5, 6, 7];
    else if (season === 'autumn') visible = [8, 9, 10];
    else if (season === 'winter') visible = [11, 0, 1];
    
    document.querySelectorAll('th[data-month]').forEach(th => { 
        const month = parseInt(th.getAttribute('data-month')); 
        th.classList.toggle('hidden-col', !visible.includes(month)); 
    });
    document.querySelectorAll('td[data-month]').forEach(td => { 
        const month = parseInt(td.getAttribute('data-month')); 
        td.classList.toggle('hidden-col', !visible.includes(month)); 
    });
}

// ============================================
// Build Sources (with Skeleton)
// ============================================

function buildSources() {
    const box = document.getElementById('sourcesBox');
    if (!box) return;
    
    showSkeleton('sourcesBox', 4);
    
    setTimeout(() => {
        if (sourcesData.length === 0) {
            showEmptyState('sourcesBox', 'لا توجد مصادر متاحة حالياً.');
            return;
        }
        
        const fragment = document.createDocumentFragment();
        sourcesData.forEach(s => {
            const card = document.createElement('div');
            card.className = 'source-card';
            card.setAttribute('role', 'listitem');
            card.innerHTML = `<span class="source-tag">${s.tag}</span><h4>${s.title}</h4><p>${s.description}</p>`;
            fragment.appendChild(card);
        });
        box.innerHTML = '';
        box.appendChild(fragment);
    }, 300);
}

// ============================================
// Build Dynamic Sections
// ============================================

function buildSpreadSection() {
    const container = document.getElementById('spreadAccordion');
    if (!container) return;
    const reasons = getSpreadReasons();
    
    const fragment = document.createDocumentFragment();
    reasons.forEach(r => {
        const card = document.createElement('div');
        card.className = 'bio-card';
        card.setAttribute('role', 'listitem');
        card.dataset.category = r.category;
        card.innerHTML = `
            <div class="bio-header" onclick="toggleAccordion(this.closest('.bio-card'), 'spreadAccordion')" tabindex="0" aria-label="${r.title}">
                <span style="font-size: 2rem;">${r.icon}</span>
                <div style="flex:1">
                    <h3 style="font-size:1.05rem; color:#fff;">${r.title}</h3>
                    <span style="font-size:0.75rem; color: var(--plan-accent);">${r.type}</span>
                </div>
                <i class="fas fa-chevron-down" aria-hidden="true"></i>
            </div>
            <div class="bio-body">
                <p>${r.description}</p>
                <h4>🔑 الأثر</h4>
                <p>${r.impact}</p>
            </div>
        `;
        fragment.appendChild(card);
    });
    container.appendChild(fragment);
}

function buildEconomicSection() {
    const statsContainer = document.getElementById('econStats');
    const cardsContainer = document.getElementById('econAccordion');
    
    if (statsContainer) {
        const stats = getEconomicStats();
        const fragment = document.createDocumentFragment();
        stats.forEach(s => {
            const stat = document.createElement('div');
            stat.className = 'econ-stat';
            stat.setAttribute('role', 'listitem');
            stat.innerHTML = `<div class="econ-stat-num">${s.value}</div><div class="econ-stat-lbl">${s.label}</div>`;
            fragment.appendChild(stat);
        });
        statsContainer.appendChild(fragment);
    }
    
    if (cardsContainer) {
        const cards = getEconomicCards();
        const fragment = document.createDocumentFragment();
        cards.forEach(c => {
            const card = document.createElement('div');
            card.className = 'bio-card';
            card.setAttribute('role', 'listitem');
            card.dataset.category = c.category;
            card.innerHTML = `
                <div class="bio-header" onclick="toggleAccordion(this.closest('.bio-card'), 'econAccordion')" tabindex="0">
                    <span style="font-size: 2rem;">${c.icon}</span>
                    <div style="flex:1">
                        <h3 style="font-size:1.05rem; color:#fff;">${c.title}</h3>
                        <span style="font-size:0.75rem; color: var(--plan-accent);">${c.type}</span>
                    </div>
                    <i class="fas fa-chevron-down" aria-hidden="true"></i>
                </div>
                <div class="bio-body">
                    <p>${c.description}</p>
                    <h4>💰 الأثر المالي</h4>
                    <p>${c.financialImpact}</p>
                </div>
            `;
            fragment.appendChild(card);
        });
        cardsContainer.appendChild(fragment);
    }
}

function buildIPMSection() {
    const container = document.getElementById('ipmContent');
    if (!container) return;
    
    const ipmData = getIPMData();
    const tabs = ipmData.ipmTabs || [];
    const panels = ipmData.panels || {};
    
    let html = '<div class="ipm-tabs" id="ipmTabs" role="tablist" aria-label="أقسام المكافحة المتكاملة">';
    tabs.forEach((tab, i) => {
        html += `<button class="ipm-tab ${i === 0 ? 'active' : ''}" data-tab="${tab.id}" role="tab" aria-selected="${i === 0 ? 'true' : 'false'}" tabindex="0">${tab.title}</button>`;
    });
    html += '</div><div class="ipm-panels">';
    
    tabs.forEach((tab, i) => {
        const panel = panels[tab.id];
        if (!panel) return;
        
        html += `<div class="ipm-panel ${i === 0 ? 'active' : ''}" id="panel-${tab.id}" role="tabpanel">`;
        if (panel.warning) {
            html += `<div style="padding:1rem;background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.3);border-radius:var(--radius-sm);margin-bottom:1.5rem;display:flex;gap:1rem;align-items:flex-start;">
                <span style="font-size:1.5rem;">⚠️</span>
                <p style="font-size:0.9rem;color:var(--text2);line-height:1.7;"><strong style="color:var(--accent);">تحذير:</strong> ${panel.warning}</p>
            </div>`;
        }
        if (panel.intro) {
            html += `<div style="margin-bottom:1.5rem;padding:1.2rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);">
                <h3 style="color:#fff;font-size:1.2rem;margin-bottom:0.8rem;">مبادئ إدارة مقاومة المبيدات (IRM)</h3>
                <p style="color:var(--text2);font-size:0.9rem;line-height:1.8;">${panel.intro}</p>
            </div>`;
        }
        if (panel.cards) {
            html += '<div class="ipm-grid">';
            panel.cards.forEach(card => {
                html += `<div class="ipm-card">
                    <div class="ipm-card-icon">${card.icon}</div>
                    <h4>${card.title}</h4>
                    <p>${card.description}</p>
                    <span class="ipm-tag ${card.tagClass}">${card.tag}</span>
                </div>`;
            });
            html += '</div>';
        }
        if (panel.instructions) {
            html += `<div style="background:rgba(243,156,18,0.08);border:1px solid rgba(243,156,18,0.3);border-radius:var(--radius-sm);padding:1.2rem;margin-top:1.5rem;">
                <h4 style="color:var(--amber);margin-bottom:0.5rem;">⚠️ إرشادات هامة لاستخدام المبيدات</h4>
                <ul style="list-style:none;padding:0;font-size:0.85rem;color:var(--text2);line-height:2;">
                    ${panel.instructions.map(inst => `<li>✓ ${inst}</li>`).join('')}
                </ul>
            </div>`;
        }
        if (panel.rotationSchedule) {
            html += `<div style="margin-top:1.5rem;padding:1.2rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);">
                <h4 style="color:var(--plan-accent);margin-bottom:0.8rem;">🗓️ جدول تناوب IRAC المقترح</h4>
                <p style="color:var(--text2);font-size:0.9rem;line-height:1.9;">${panel.rotationSchedule}</p>
            </div>`;
        }
        html += '</div>';
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    setTimeout(() => {
        const tabsContainer = document.getElementById('ipmTabs');
        if (tabsContainer) {
            tabsContainer.addEventListener('click', function(e) {
                const tab = e.target.closest('.ipm-tab');
                if (!tab) return;
                const target = tab.dataset.tab;
                document.querySelectorAll('.ipm-tab').forEach(t => { 
                    t.classList.remove('active'); 
                    t.setAttribute('aria-selected', 'false'); 
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                document.querySelectorAll('.ipm-panel').forEach(p => p.classList.remove('active'));
                document.getElementById('panel-' + target).classList.add('active');
            });
        }
    }, 100);
}

function buildFAQSection() {
    const container = document.getElementById('faqList');
    if (!container) return;
    const faqs = getFAQ();
    
    const fragment = document.createDocumentFragment();
    faqs.forEach(f => {
        const item = document.createElement('div');
        item.className = 'faq-item';
        item.setAttribute('role', 'listitem');
        item.innerHTML = `
            <div class="faq-question" onclick="toggleFAQ(this)" tabindex="0" aria-expanded="false" role="button">
                <span>${f.question}</span>
                <i class="fas fa-chevron-down faq-icon" aria-hidden="true"></i>
            </div>
            <div class="faq-answer" role="region">${f.answer}</div>
        `;
        fragment.appendChild(item);
    });
    container.appendChild(fragment);
}

function buildResistanceSection() {
    const container = document.getElementById('resistanceGrid');
    if (!container) return;
    const data = getResistanceData();
    
    const fragment = document.createDocumentFragment();
    data.forEach(r => {
        const levelClass = r.level === 'high' ? 'level-high' : r.level === 'medium' ? 'level-medium' : 'level-low';
        const card = document.createElement('div');
        card.className = 'resistance-card';
        card.setAttribute('role', 'listitem');
        card.innerHTML = `
            <h4>${r.pesticide}</h4>
            <p style="font-size:0.8rem;color:var(--text2)">${r.example}</p>
            <div class="resistance-level ${levelClass}">${r.levelText}</div>
        `;
        fragment.appendChild(card);
    });
    container.appendChild(fragment);
}

// ============================================
// Accordion & Filter Functions (with Empty States)
// ============================================

function toggleFAQ(el) {
    const item = el.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(x => { 
        x.classList.remove('open'); 
        const q = x.querySelector('.faq-question');
        if(q) q.setAttribute('aria-expanded', 'false'); 
    });
    if (!isOpen) {
        item.classList.add('open');
        el.setAttribute('aria-expanded', 'true');
    }
}

function toggleAccordion(el, containerId) {
    const card = el.closest('.bio-card');
    const o = card.classList.contains('open');
    const c = document.getElementById(containerId);
    c.querySelectorAll('.bio-card').forEach(x => x.classList.remove('open'));
    if (!o) {
        card.classList.add('open');
        setTimeout(() => { 
            const r = card.getBoundingClientRect(); 
            if (r.top < 0 || r.bottom > window.innerHeight) {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); 
            }
        }, 300);
    }
}

function filterBioCards(category, containerId, btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.filter-btn').forEach(b => { 
        b.classList.remove('active'); 
        b.setAttribute('aria-pressed', 'false'); 
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    
    const container = document.getElementById(containerId);
    const cards = Array.from(container.querySelectorAll('.bio-card'));
    
    const visibleCards = cards.filter(card => category === 'all' || card.dataset.category === category);
    
    if (visibleCards.length === 0) {
        cards.forEach(card => card.style.display = 'none');
        if (!container.querySelector('.empty-state')) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            emptyDiv.innerHTML = `<i class="fas fa-leaf"></i><h3>لا توجد نتائج</h3><p>لا توجد بيانات مطابقة لهذا الفلتر حالياً.</p>`;
            container.appendChild(emptyDiv);
        }
    } else {
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) emptyState.remove();
        
        cards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = '';
                requestAnimationFrame(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => { card.style.display = 'none'; }, 300);
            }
        });
    }
}

// ============================================
// Single Section Logic
// ============================================

function showSingleSection(groupId, clickedItem) {
    document.querySelectorAll('.section').forEach(s => { 
        s.classList.add('section-hidden'); 
        s.classList.remove('section-visible'); 
    });
    
    const ids = groupMap[groupId] || [];
    ids.forEach(id => { 
        const sec = document.getElementById(id); 
        if (sec) { 
            sec.classList.remove('section-hidden'); 
            sec.classList.add('section-visible'); 
        } 
    });
    
    const hero = document.getElementById('heroSection');
    if (hero) hero.classList.add('hero-hidden');
    
    // Note: Drawer items don't get 'active' class permanently to keep UI clean, 
    // but we update the top label.
    currentSingleGroup = groupId;
    const label = document.getElementById('currentGroupLabel');
    if (label) { 
        label.textContent = groupNames[groupId] || ''; 
        label.classList.add('visible'); 
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (groupId === 'seasonal-heatmap') { 
        setTimeout(() => { drawChart(); }, 400); 
    }
}

function goHome() {
    document.querySelectorAll('.section').forEach(s => { 
        s.classList.add('section-hidden'); 
        s.classList.remove('section-visible'); 
    });
    const hero = document.getElementById('heroSection');
    if (hero) hero.classList.add('hero-hidden');
    currentSingleGroup = null;
    const label = document.getElementById('currentGroupLabel');
    if (label) label.classList.remove('visible');
    document.getElementById('landingOverlay').classList.remove('hidden');
}

// ============================================
// Landing Functions
// ============================================

function createLandingParticles() {
    const c = document.getElementById('landingParticles');
    if (!c) return;
    const cols = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db'];
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 25; i++) {
        const p = document.createElement('div');
        p.className = 'landing-particle';
        const s = Math.random() * 4 + 2;
        p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;background:${cols[i % cols.length]};animation-duration:${Math.random() * 12 + 8}s;animation-delay:${Math.random() * 8}s;`;
        fragment.appendChild(p);
    }
    c.appendChild(fragment);
}

function closeLanding() {
    document.getElementById('landingOverlay').classList.add('hidden');
    // Default to biology section on first load
    showSingleSection('biology', null);
}

// ============================================
// Bio Agents Encyclopedia (with Skeleton & Empty States)
// ============================================

const targetLabels = { egg: '🥚 البيض', larvae: '🐛 اليرقات', pupae: '🫘 العذارى', adult: ' الكاملة' };
const targetStatusText = { effective: 'فعّال', partial: 'جزئي', none: 'لا يؤثر' };
const targetClass = { effective: 'active-target', partial: 'partial-target', none: 'inactive-target' };

const badgeMap = {
    'preventive': { text: '🛡️ وقائي فقط', class: 'badge-blue' },
    'curative': { text: '💊 علاجي فقط', class: 'badge-amber' },
    'preventive-curative': { text: '🛡️💊 وقائي وعلاجي', class: 'badge-green' },
    'heat-tolerant': { text: '🌡️ متحمل للحرارة', class: 'badge-green' },
    'egypt-native': { text: '🇪🇬 متوطن في مصر', class: 'badge-purple' },
    'pesticide-sensitive': { text: '⚠️ حساس للمبيدات', class: 'badge-red' },
    'bio-safe': { text: '✅ آمن مع المبيدات الحيوية', class: 'badge-green' },
    'needs-humidity': { text: '💧 يحتاج رطوبة', class: 'badge-amber' },
    'needs-high-humidity': { text: '💧 يحتاج رطوبة عالية', class: 'badge-red' },
    'medium-heat': { text: '🌡️ تحمل حراري متوسط', class: 'badge-amber' },
    'good-heat': { text: '🌡️ تحمل حراري جيد', class: 'badge-green' },
    'sun-sensitive': { text: '☀️ حساس للشمس', class: 'badge-red' },
    'uv-sensitive': { text: '⚠️ حساس للأشعة فوق البنفسجية', class: 'badge-red' }
};

const importanceText = { high: 'عالي', medium: 'متوسط', low: 'منخفض', none: 'لا يؤثر' };
const toleranceText = { excellent: 'ممتاز', good: 'جيد', medium: 'متوسط', poor: 'ضعيف' };
const compatText = { excellent: 'ممتاز', good: 'جيد', medium: 'متوسط', poor: 'ضعيف' };
const toxicityText = { high: 'شديد السمية', medium: 'متوسط', safe: 'آمن' };

const categoryMap = {
    'egg-parasitoid': { name: '🐝 طفيلات البيض' },
    'larval-parasitoid': { name: '🐝 طفيلات اليرقات' },
    'predator': { name: '🪲 المفترسات' },
    'fungi': { name: '🍄 الفطريات الممرضة' },
    'nematode': { name: '🪱 النيماتودا الممرضة' }
};

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { 
        modal.classList.add('active'); 
        document.body.style.overflow = 'hidden'; 
    }
}

function openBioModal(agentId) { 
    openModal(`modal-${agentId}`); 
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { 
        modal.classList.remove('active'); 
        document.body.style.overflow = ''; 
    }
}

function closeModalOnBg(event, modalId) { 
    if (event.target === event.currentTarget) closeModal(modalId); 
}

function renderBioCategoryFilter() {
    const fc = document.getElementById('bioCategoryFilter');
    if (!fc) return;
    const fragment = document.createDocumentFragment();
    const categories = Object.keys(categoryMap);
    categories.forEach((key, index) => {
        const btn = document.createElement('button');
        btn.className = `bio-filter-btn ${index === 0 ? 'active' : ''}`;
        btn.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
        btn.setAttribute('tabindex', '0');
        btn.textContent = categoryMap[key].name;
        btn.onclick = function() { filterBioByCategory(key, this); };
        fragment.appendChild(btn);
    });
    fc.appendChild(fragment);
    if (categories.length > 0) {
        renderBioCards(categories[0]);
    }
}

let renderedBioCards = new Set();

function renderBioCards(filter = 'egg-parasitoid') {
    const container = document.getElementById('bioCardsContainer');
    if (!container) return;
    
    showSkeleton('bioCardsContainer', 4);
    renderedBioCards.clear();
    
    setTimeout(() => {
        const filtered = bioAgentsData.filter(a => a.category === filter);
        
        if (filtered.length === 0) {
            showEmptyState('bioCardsContainer', 'لا يوجد أعداء حيويين في هذه الفئة حالياً.');
            return;
        }
        
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        filtered.forEach((agent, index) => {
            const card = document.createElement('div');
            card.className = 'bio-card-advanced';
            card.setAttribute('role', 'listitem');
            card.setAttribute('aria-label', agent.scientificName);
            card.setAttribute('data-agent-id', agent.id);
            card.setAttribute('tabindex', '0');
            card.onclick = () => openBioModal(agent.id);
            
            card.innerHTML = `<div class="bio-card-advanced-header"><span class="bio-icon-large">${agent.icon}</span><div class="bio-card-titles"><h3>${agent.scientificName}</h3><span class="subtitle">${agent.arabicDesc}</span></div></div><div class="bio-card-placeholder">جاري التحميل...</div>`;
            fragment.appendChild(card);
        });
        
        container.appendChild(fragment);
        setupBioCardsLazyLoad();
    }, 200);
}

function setupBioCardsLazyLoad() {
    const cards = document.querySelectorAll('.bio-card-advanced');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const agentId = card.getAttribute('data-agent-id');
                if (!renderedBioCards.has(agentId)) {
                    const agent = bioAgentsData.find(a => a.id === agentId);
                    if (agent) {
                        renderBioCardFullContent(card, agent);
                        renderedBioCards.add(agentId);
                    }
                }
                observer.unobserve(card);
            }
        });
    }, { rootMargin: '100px', threshold: 0.1 });
    
    cards.forEach(card => observer.observe(card));
}

function renderBioCardFullContent(card, agent) {
    let html = `<div class="bio-card-advanced-header"><span class="bio-icon-large">${agent.icon}</span><div class="bio-card-titles"><h3>${agent.scientificName}</h3><span class="subtitle">${agent.arabicDesc}</span></div></div>`;
    html += '<div class="bio-targets">';
    Object.keys(agent.targets).forEach(key => {
        const s = agent.targets[key];
        html += `<div class="target-row ${targetClass[s]}"><span class="target-label">${targetLabels[key]}</span><span class="target-status">${targetStatusText[s]}</span></div>`;
    });
    html += '</div>';
    html += '<div class="bio-badges">';
    agent.badges.forEach(b => { 
        const bd = badgeMap[b]; 
        if (bd) html += `<span class="bio-badge ${bd.class}">${bd.text}</span>`; 
    });
    html += '</div>';
    html += `<div class="bio-card-footer">اقرأ التفاصيل الكاملة <i class="fas fa-arrow-left" aria-hidden="true"></i></div>`;
    card.innerHTML = html;
}

function renderBioModals() {
    const container = document.getElementById('bioModalsContainer');
    if (!container) return;
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    bioAgentsData.forEach(agent => {
        const modal = document.createElement('div');
        modal.className = 'bio-modal';
        modal.id = `modal-${agent.id}`;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', agent.scientificName);
        modal.onclick = (e) => closeModalOnBg(e, `modal-${agent.id}`);
        
        const tabsHtml = `
            <div class="modal-tabs" role="tablist">
                <button class="tab-btn active" onclick="switchTab('${agent.id}', 'overview', event)" role="tab" aria-selected="true" tabindex="0"><i class="fas fa-info-circle" aria-hidden="true"></i> نظرة عامة</button>
                <button class="tab-btn" onclick="switchTab('${agent.id}', 'lifecycle', event)" role="tab" aria-selected="false" tabindex="0"><i class="fas fa-sync-alt" aria-hidden="true"></i> دورة الحياة</button>
                <button class="tab-btn" onclick="switchTab('${agent.id}', 'usage', event)" role="tab" aria-selected="false" tabindex="0"><i class="fas fa-leaf" aria-hidden="true"></i> الاستخدام</button>
                <button class="tab-btn" onclick="switchTab('${agent.id}', 'compatibility', event)" role="tab" aria-selected="false" tabindex="0"><i class="fas fa-handshake" aria-hidden="true"></i> التوافق</button>
                <button class="tab-btn" onclick="switchTab('${agent.id}', 'rating', event)" role="tab" aria-selected="false" tabindex="0"><i class="fas fa-star" aria-hidden="true"></i> التقييم</button>
            </div>`;
            
        const overview = `<div class="tab-content active" id="tab-${agent.id}-overview" role="tabpanel">
            <div class="modal-body-content">
                <h4>🔬 التصنيف العلمي</h4>
                <table class="info-table"><tr><td>الرتبة</td><td>${agent.classification.order}</td></tr><tr><td>الفصيلة</td><td>${agent.classification.family}</td></tr><tr><td>الجنس</td><td>${agent.classification.genus}</td></tr><tr><td>النوع</td><td><strong>${agent.classification.species}</strong></td></tr></table>
                <h4>🧬 النوع الحيوي وطريقة العمل</h4><p>${agent.bioType}</p>
                <h4>👁️ الوصف المورفولوجي</h4>
                <table class="info-table"><tr><td>الحشرة الكاملة</td><td>${agent.morphology.adult}</td></tr><tr><td>البيضة</td><td>${agent.morphology.egg}</td></tr><tr><td>اليرقة</td><td>${agent.morphology.larva}</td></tr><tr><td>العذراء</td><td>${agent.morphology.pupa}</td></tr></table>
                <h4>📊 الأهمية في المكافحة</h4>
                <div class="importance-grid">
                    <div class="importance-item ${agent.importance.egg}"><span>🥚 مكافحة البيض</span><span class="importance-level ${agent.importance.egg}">${importanceText[agent.importance.egg]}</span></div>
                    <div class="importance-item ${agent.importance.larvae}"><span>🐛 مكافحة اليرقات</span><span class="importance-level ${agent.importance.larvae}">${importanceText[agent.importance.larvae]}</span></div>
                    <div class="importance-item ${agent.importance.pupae}"><span>🫘 مكافحة العذارى</span><span class="importance-level ${agent.importance.pupae}">${importanceText[agent.importance.pupae]}</span></div>
                    <div class="importance-item ${agent.importance.adult}"><span>🦋 مكافحة الكاملة</span><span class="importance-level ${agent.importance.adult}">${importanceText[agent.importance.adult]}</span></div>
                </div>
            </div>
        </div>`;
        
        const lifecycle = `<div class="tab-content" id="tab-${agent.id}-lifecycle" role="tabpanel"><div class="modal-body-content"><h4>🔄 مراحل دورة الحياة</h4><div class="lifecycle-steps">${agent.lifecycleSteps.map((s, i) => `<div class="lifecycle-step"><div class="step-number">${i + 1}</div><div class="step-text">${s}</div></div>`).join('')}</div><h4>🌡️ مدة الدورة حسب الحرارة</h4><table class="info-table"><tr><td>عند 20°م</td><td>${agent.cycleDuration.c20}</td></tr><tr><td>عند 25°م</td><td>${agent.cycleDuration.c25}</td></tr><tr><td>عند 30°م</td><td>${agent.cycleDuration.c30}</td></tr></table><h4>🧠 السلوك الحيوي المميز</h4><p>${agent.behavior}</p></div></div>`;
        const usage = `<div class="tab-content" id="tab-${agent.id}-usage" role="tabpanel"><div class="modal-body-content"><h4>⚙️ الظروف المثالية</h4><div class="conditions-grid"><div class="condition-item"><div class="cond-label">🌡️ الحرارة</div><div class="cond-value">${agent.conditions.temp}</div></div><div class="condition-item"><div class="cond-label">💧 الرطوبة</div><div class="cond-value">${agent.conditions.humidity}</div></div><div class="condition-item"><div class="cond-label">💡 الإضاءة</div><div class="cond-value">${agent.conditions.light}</div></div><div class="condition-item"><div class="cond-label">🌬️ الرياح</div><div class="cond-value">${agent.conditions.wind}</div></div></div><h4>🗺️ التحمل في الظروف المصرية</h4><div class="conditions-grid"><div class="condition-item"><div class="cond-label">صيف الدلتا</div><div class="cond-value">${toleranceText[agent.egyptTolerance.delta]}</div></div><div class="condition-item"><div class="cond-label">صيف الصعيد</div><div class="cond-value">${toleranceText[agent.egyptTolerance.saeed]}</div></div><div class="condition-item"><div class="cond-label">العروة الصيفية</div><div class="cond-value">${toleranceText[agent.egyptTolerance.summer]}</div></div><div class="condition-item"><div class="cond-label">العروة النيلية</div><div class="cond-value">${toleranceText[agent.egyptTolerance.nile]}</div></div><div class="condition-item"><div class="cond-label">البيوت المحمية</div><div class="cond-value">${toleranceText[agent.egyptTolerance.greenhouse]}</div></div></div><h4>🇪🇬 التواجد الحالي في مصر</h4><table class="info-table"><tr><td>التواجد الطبيعي</td><td>${agent.egyptPresence.natural}</td></tr><tr><td>الاستخدام التجاري</td><td>${agent.egyptPresence.commercial}</td></tr><tr><td>الاستخدام البحثي</td><td>${agent.egyptPresence.research}</td></tr></table>${agent.plants.length > 0 ? `<h4>🌱 النباتات الداعمة</h4><div class="support-plants">${agent.plants.map(p => `<span class="plant-tag">${p}</span>`).join('')}</div>` : ''}</div></div>`;
        const compat = `<div class="tab-content" id="tab-${agent.id}-compatibility" role="tabpanel"><div class="modal-body-content"><h4>🤝 التوافق مع الأعداء الحيوية الأخرى</h4><table class="compatibility-table">${agent.compatibility.map(([n, l]) => `<tr><td>${n}</td><td><span class="compat-level compat-${l}">${compatText[l]}</span></td></tr>`).join('')}</table><h4>🧪 الحساسية للمبيدات</h4>${agent.pesticides.map(([n, l]) => `<div class="pesticide-item"><span class="pesticide-name">${n}</span><span class="compat-level toxicity-${l}">${toxicityText[l]}</span></div>`).join('')}</div></div>`;
        const rating = `<div class="tab-content" id="tab-${agent.id}-rating" role="tabpanel"><div class="modal-body-content"><h4>✅ المزايا</h4><ul class="pros-list">${agent.pros.map(p => `<li><i class="fas fa-check-circle" aria-hidden="true"></i> ${p}</li>`).join('')}</ul><h4>❌ العيوب</h4><ul class="cons-list">${agent.cons.map(c => `<li><i class="fas fa-times-circle" aria-hidden="true"></i> ${c}</li>`).join('')}</ul><h4>⭐ التقييم النهائي</h4><div class="final-rating-box"><div style="margin-bottom:0.8rem;color:var(--amber);font-size:1.5rem">${'⭐'.repeat(agent.ratingStars)}${'☆'.repeat(5 - agent.ratingStars)} <span style="font-size:0.8rem;color:var(--text2)">(${agent.ratingStars}/5)</span></div><p>${agent.finalRating}</p></div></div></div>`;
            
        modal.innerHTML = `<div class="bio-modal-content"><button class="bio-modal-close" onclick="closeModal('modal-${agent.id}')" aria-label="إغلاق">×</button><div class="bio-modal-header"><span style="font-size:3.5rem">${agent.icon}</span><h2>${agent.scientificName}</h2><span class="bio-modal-badge">${agent.arabicDesc}</span></div>${tabsHtml}${overview}${lifecycle}${usage}${compat}${rating}</div>`;
        fragment.appendChild(modal);
    });
    container.appendChild(fragment);
}

function switchTab(agentId, tabName, event) {
    const modal = document.getElementById(`modal-${agentId}`);
    if (!modal) return;
    modal.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    modal.querySelectorAll('.tab-btn').forEach(tb => { 
        tb.classList.remove('active'); 
        tb.setAttribute('aria-selected', 'false'); 
    });
    const target = document.getElementById(`tab-${agentId}-${tabName}`);
    if (target) target.classList.add('active');
    if (event) { 
        const btn = event.target.closest('.tab-btn'); 
        if (btn) { 
            btn.classList.add('active'); 
            btn.setAttribute('aria-selected', 'true'); 
        } 
    }
}

function filterBioByCategory(category, btn) {
    document.querySelectorAll('.bio-filter-btn').forEach(b => { 
        b.classList.remove('active'); 
        b.setAttribute('aria-pressed', 'false'); 
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    renderBioCards(category);
}

// ============================================
// Keyboard & Mobile Navigation (Enhanced Accessibility)
// ============================================

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSideDrawer(); // Close drawer on Escape
        document.querySelectorAll('.bio-modal.active').forEach(m => { 
            m.classList.remove('active'); 
            document.body.style.overflow = ''; 
        });
        document.querySelectorAll('.faq-item.open').forEach(item => { 
            item.classList.remove('open'); 
            const q = item.querySelector('.faq-question');
            if(q) q.setAttribute('aria-expanded', 'false'); 
        });
    }
    
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
    }
    
    // Enhanced keyboard support for custom interactive elements
    if (e.key === 'Enter' || e.key === ' ') {
        const target = e.target;
        if (target.classList.contains('bio-header') || 
            target.classList.contains('faq-question') || 
            target.classList.contains('filter-btn') || 
            target.classList.contains('ipm-tab') || 
            target.classList.contains('bio-filter-btn') ||
            target.classList.contains('drawer-nav-item') ||
            target.classList.contains('drawer-home-btn') ||
            target.getAttribute('tabindex') === '0') {
            e.preventDefault();
            target.click();
        }
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-user');
});

// ============================================
// New Features: Progress Bar, Double-Tap Zoom, Pull-to-Refresh
// ============================================

function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    if (!progressBar || !progressFill) return;
    
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    
    progressFill.style.width = progress + '%';
    if (scrollTop > 100) {
        progressBar.classList.add('visible');
    } else {
        progressBar.classList.remove('visible');
    }
}

let lastTap = 0;
function handleDoubleTap(element) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
        element.classList.toggle('zoomed');
    }
    lastTap = currentTime;
}

let pullStartY = 0;
let pullDistance = 0;
let isPulling = false;
const PULL_THRESHOLD = 80;

function initPullToRefresh() {
    const pullIndicator = document.getElementById('pullToRefresh');
    if (!pullIndicator) return;
    
    document.addEventListener('touchstart', (e) => {
        if (window.pageYOffset === 0) {
            pullStartY = e.touches[0].clientY;
            isPulling = true;
        }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        const currentY = e.touches[0].clientY;
        pullDistance = currentY - pullStartY;
        
        if (pullDistance > 0 && window.pageYOffset === 0) {
            e.preventDefault();
            
            const resistance = pullDistance * 0.5;
            pullIndicator.style.transform = `translateY(${resistance}px)`;
            pullIndicator.style.opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);
            
            if (pullDistance > PULL_THRESHOLD) {
                pullIndicator.querySelector('.pull-text').textContent = 'اترك للتحديث';
                pullIndicator.querySelector('.pull-icon').style.transform = 'rotate(180deg)';
            } else {
                pullIndicator.querySelector('.pull-text').textContent = 'اسحب للتحديث';
                pullIndicator.querySelector('.pull-icon').style.transform = 'rotate(0deg)';
            }
        }
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
        if (!isPulling) return;
        isPulling = false;
        if (pullDistance > PULL_THRESHOLD) {
            performRefresh(pullIndicator);
        } else {
            resetPullIndicator(pullIndicator);
        }
        pullDistance = 0;
    }, { passive: true });
}

function performRefresh(pullIndicator) {
    pullIndicator.querySelector('.pull-icon').style.animation = 'spin 1s linear infinite';
    pullIndicator.querySelector('.pull-text').textContent = 'جاري التحديث...';
    pullIndicator.style.transform = `translateY(${PULL_THRESHOLD * 0.5}px)`;
    setTimeout(() => { location.reload(); }, 1000);
}

function resetPullIndicator(pullIndicator) {
    pullIndicator.style.transform = 'translateY(-100%)';
    pullIndicator.style.opacity = '0';
    pullIndicator.querySelector('.pull-text').textContent = 'اسحب للتحديث';
    pullIndicator.querySelector('.pull-icon').style.animation = '';
    pullIndicator.querySelector('.pull-icon').style.transform = 'rotate(0deg)';
}

// ============================================
// Main Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Starting application...');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    try {
        await loadAllData();
        console.log('✅ Data loaded successfully');

        const thermal = getThermalConstants();
        T0 = thermal.T0; TH = thermal.TH; K = thermal.K;
        
        stagesData = getStages();
        egyptMonthsData = getEgyptMonths();
        calendarDataObj = getCalendarData();
        planCardsData = getPlanCards();
        sourcesData = getSources();
        bioAgentsData = getBioAgents();

        buildSpreadSection();
        buildEconomicSection();
        buildIPMSection();
        buildFAQSection();
        buildResistanceSection();
        buildSources();
        console.log('✅ Dynamic sections built');

        const slider = document.getElementById('tempSlider');
        if (slider) {
            slider.addEventListener('input', function () { 
                curTemp = parseInt(this.value); 
                this.setAttribute('aria-valuenow', curTemp); 
                updAll(); 
            }, { passive: true });
        }

        const revealObs = new IntersectionObserver((entries) => { 
            entries.forEach(e => { 
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    revealObs.unobserve(e.target);
                } 
            }); 
        }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
        
        document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

        buildStages();
        populateTable();
        buildPlanCards();
        updAll();
        console.log('✅ UI components built');

        renderBioCategoryFilter();
        renderBioModals();
        console.log('✅ Bio agents encyclopedia loaded');

        document.getElementById('prevS').addEventListener('click', () => { 
            let n = curStage - 1; if (n < 0) n = stagesData.length - 1; selS(n); 
        });
        document.getElementById('nextS').addEventListener('click', () => { 
            let n = curStage + 1; if (n >= stagesData.length) n = 0; selS(n); 
        });
        document.getElementById('autoBtn').addEventListener('click', toggleA);

        window.addEventListener('resize', debouncedDrawChart);
        window.addEventListener('scroll', throttle(updateProgressBar, 100), { passive: true });

        createLandingParticles();

        const seasonChart = document.getElementById('seasonChart');
        if (seasonChart) {
            seasonChart.addEventListener('click', () => handleDoubleTap(seasonChart));
            seasonChart.addEventListener('touchend', () => handleDoubleTap(seasonChart), { passive: true });
        }
        
        const heatmapGrid = document.getElementById('heatmapGrid');
        if (heatmapGrid) {
            heatmapGrid.addEventListener('click', () => handleDoubleTap(heatmapGrid));
            heatmapGrid.addEventListener('touchend', () => handleDoubleTap(heatmapGrid), { passive: true });
        }

        initPullToRefresh();

        // ============================================
        // Service Worker - SILENT UPDATE (No Confirm Dialog)
        // ============================================
        if ('serviceWorker' in navigator) { 
            window.addEventListener('load', () => { 
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => {
                        console.log('✅ SW registered:', reg.scope);
                        
                        // Check for updates every 2 minutes
                        setInterval(() => {
                            reg.update();
                        }, 2 * 60 * 1000);
                        
                        reg.addEventListener('updatefound', () => {
                            const newWorker = reg.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('🔄 New version ready - silent updating...');
                                    // SILENT RELOAD: No confirm() dialog
                                    window.location.reload();
                                }
                            });
                        });
                    })
                    .catch(err => console.log('❌ SW failed:', err)); 
            }); 
            
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                console.log('🔄 Silent update applied, reloading...');
                window.location.reload();
            });
        }
        
        console.log('🎉 Application ready!');
        setTimeout(() => { 
            if (loadingOverlay) { 
                loadingOverlay.classList.add('hidden'); 
                setTimeout(() => loadingOverlay.style.display = 'none', 500); 
            } 
        }, 800);
        
    } catch (error) {
        console.error('❌ Error initializing application:', error);
        if (loadingOverlay) { 
            loadingOverlay.classList.add('hidden'); 
            setTimeout(() => loadingOverlay.style.display = 'none', 500); 
        }
    }
});