// ============================================
// Tuta Absoluta App - Script.js
// النسخة Pro الكاملة - اكاديمية المهندس الزراعي
// جميع المشاكل مُصلحة ✅
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

// Multi-language
let currentLang = localStorage.getItem('tuta-lang') || 'ar';
const translations = {
    ar: {
        search: 'البحث الذكي', searchPlaceholder: 'ابحث عن كائن حيوي، مبيد، مرحلة...',
        all: 'الكل', bio: 'أعداء حيوية', stages: 'مراحل الحياة', faq: 'أسئلة شائعة',
        startTyping: 'ابدأ الكتابة للبحث...', noResults: 'لا توجد نتائج', resultsFound: 'نتائج',
        home: 'الرئيسية', biology: 'البيولوجيا', control: 'المكافحة', enemies: 'الأعداء', contact: 'تواصل',
        whatsapp: 'واتساب', email: 'البريد الإلكتروني', twitter: 'Twitter', top: 'أعلى',
        pullToRefresh: 'اسحب للتحديث', refreshing: 'جاري التحديث...',
        skip: 'تخطي', next: 'التالي', getStarted: 'ابدأ',
        langChanged: 'تم تغيير اللغة إلى العربية',
        onboarding1Title: 'أهلاً بك في اكاديمية المهندس الزراعي', onboarding1Desc: 'دليلك الشامل لمكافحة آفة توتا أبسولوتا في مصر',
        onboarding2Title: 'تصفح سهل وسريع', onboarding2Desc: 'استخدم الشريط السفلي للتنقل بين الأقسام أو اسحب يميناً ويساراً',
        onboarding3Title: 'بحث ذكي', onboarding3Desc: 'اضغط على أيقونة البحث للعثور على أي معلومة بسرعة',
        onboarding4Title: 'جاهز للبدء!', onboarding4Desc: 'استمتع بتجربة تفاعلية شاملة مع أحدث التقنيات الزراعية'
    },
    en: {
        search: 'Smart Search', searchPlaceholder: 'Search for bio-agent, pesticide, stage...',
        all: 'All', bio: 'Bio-agents', stages: 'Stages', faq: 'FAQ',
        startTyping: 'Start typing to search...', noResults: 'No results found', resultsFound: 'results',
        home: 'Home', biology: 'Biology', control: 'Control', enemies: 'Enemies', contact: 'Contact',
        whatsapp: 'WhatsApp', email: 'Email', twitter: 'Twitter', top: 'Top',
        pullToRefresh: 'Pull to refresh', refreshing: 'Refreshing...',
        skip: 'Skip', next: 'Next', getStarted: 'Get Started',
        langChanged: 'Language changed to English',
        onboarding1Title: 'Welcome to Agricultural Engineer Academy', onboarding1Desc: 'Your comprehensive guide to combat Tuta Absoluta in Egypt',
        onboarding2Title: 'Easy Navigation', onboarding2Desc: 'Use bottom navigation or swipe left/right',
        onboarding3Title: 'Smart Search', onboarding3Desc: 'Tap search icon to find any information',
        onboarding4Title: 'Ready to Start!', onboarding4Desc: 'Enjoy an interactive experience'
    }
};

// ============================================
// Performance Utilities
// ============================================
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// Translation Functions
// ============================================
function t(key) {
    return translations[currentLang][key] || translations['ar'][key] || key;
}

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('tuta-lang', currentLang);
    updateLanguage();
    haptic(20);
    showToast(t('langChanged'), 'info');
}

function updateLanguage() {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    
    const searchHeader = document.querySelector('.search-header h3');
    if (searchHeader) searchHeader.innerHTML = `<i class="fas fa-search"></i> ${t('search')}`;
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = t('searchPlaceholder');
    
    const bottomNavSpans = document.querySelectorAll('.bottom-nav-item span');
    const navTexts = [t('home'), t('biology'), t('control'), t('enemies'), t('contact')];
    bottomNavSpans.forEach((span, i) => { if (navTexts[i]) span.textContent = navTexts[i]; });
    
    const fabSpans = document.querySelectorAll('.fab-menu-item span');
    const fabTexts = [t('whatsapp'), t('email'), t('twitter'), t('top')];
    fabSpans.forEach((span, i) => { if (fabTexts[i]) span.textContent = fabTexts[i]; });
    
    const ptr = document.querySelector('.pull-to-refresh span');
    if (ptr && !document.querySelector('.pull-to-refresh.refreshing')) ptr.textContent = t('pullToRefresh');
    
    for (let i = 1; i <= 4; i++) {
        const slide = document.querySelector(`.onboarding-slide[data-slide="${i}"]`);
        if (slide) {
            const h2 = slide.querySelector('h2');
            const p = slide.querySelector('p');
            if (h2) h2.textContent = t(`onboarding${i}Title`);
            if (p) p.textContent = t(`onboarding${i}Desc`);
        }
    }
    
    const skipBtn = document.querySelector('.onboarding-skip');
    if (skipBtn) skipBtn.textContent = t('skip');
    updateOnboardingSlide();
}

// ============================================
// Haptic Feedback
// ============================================
function haptic(pattern = 10) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

function hapticButton(element) {
    haptic(10);
    if (element) {
        element.classList.add('haptic');
        setTimeout(() => element.classList.remove('haptic'), 150);
    }
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
    'faq': ['faq'],
    'resistance': ['resistance'],
    'sources': ['sources']
};

const groupNames = {
    'biology': 'البيولوجيا والنموذج الحراري',
    'spread-economic': 'الانتشار والتأثير الاقتصادي',
    'seasonal-heatmap': 'النشاط الموسمي والخريطة الحرارية',
    'calendar': 'تقويم المكافحة',
    'ipm': 'برنامج المكافحة المتكاملة',
    'bioagents': 'الأعداء الحيوية',
    'faq': 'أسئلة شائعة',
    'resistance': 'مقاومة المبيدات',
    'sources': 'المصادر'
};

const groupOrder = ['biology', 'spread-economic', 'seasonal-heatmap', 'calendar', 'ipm', 'bioagents', 'faq', 'resistance', 'sources'];

// ============================================
// Thermal Functions
// ============================================
function calcDays(T) {
    if (T <= T0 || T >= TH) return { egg: -1, larva: -1, pupa: -1, adult: -1, dev: -1, gen: -1 };
    const dE = K.egg / (T - T0), dL = K.larva / (T - T0), dP = K.pupa / (T - T0);
    let dA = T <= 30 ? 24 - .8 * (T - 10) : Math.max(4, 8 - (T - 30) * .5);
    const dev = Math.round((dE + dL + dP) * 10) / 10;
    const gen = Math.round((dE + dL + dP + dA) * 10) / 10;
    return { egg: Math.round(dE * 10) / 10, larva: Math.round(dL * 10) / 10, pupa: Math.round(dP * 10) / 10, adult: Math.round(dA * 10) / 10, dev, gen };
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
    if (T < 12) return '#6a9cc8'; if (T < 18) return '#68b8c8'; if (T < 22) return '#90c050';
    if (T < 26) return '#c8c040'; if (T < 30) return '#e8a838'; if (T < 34) return '#e87030';
    return '#e74c3c';
}

function hmClr(v) {
    if (v <= 30) return 'rgba(100,180,200,.35)'; if (v <= 50) return 'rgba(200,180,70,.5)';
    if (v <= 75) return 'rgba(46,204,113,.55)'; return 'rgba(231,76,60,.65)';
}

function updAll() {
    const d = calcDays(curTemp), z = getZone(curTemp), tc = tClr(curTemp);
    document.getElementById('tempVal').textContent = curTemp;
    document.getElementById('tempVal').style.color = tc;
    document.getElementById('tempDesc').textContent = z.l;
    const zb = document.getElementById('tempZone');
    zb.textContent = z.z; zb.style.background = z.c + '20'; zb.style.color = z.c;
    updTempGrid(d); updDaysBars(d); drawChart(); buildHeatmap();
    if (curStage >= 0) updDet(); updSD(d);
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
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawChart() {
    const canvas = document.getElementById('seasonChart'); if (!canvas) return;
    const dpr = window.devicePixelRatio || 1; const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = 340 * dpr; canvas.style.height = '340px';
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    const W = rect.width, H = 340; const pad = { t: 30, r: 35, b: 55, l: 45 };
    const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b;
    ctx.clearRect(0, 0, W, H);
    const data = egyptMonthsData.map(em => { const d = calcDays(em.temp); return { m: em.month, t: em.temp, days: d.dev, gen: d.dev > 0 ? Math.floor(30 / d.dev) : 0 }; });
    const maxDays = Math.max(...data.map(d => d.days > 0 ? d.days : 0), 80);
    const maxTemp = Math.max(...data.map(d => d.t)) + 5;
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1; ctx.fillStyle = 'rgba(154,169,182,.4)';
    ctx.font = '9px Tajawal'; ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) { const y = pad.t + (cH / 5) * i; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cW, y); ctx.stroke(); ctx.fillText(Math.round(maxDays - (maxDays / 5) * i), pad.l - 6, y + 3); }
    ctx.textAlign = 'center';
    data.forEach((d, i) => { const x = pad.l + (i + .5) * (cW / 12); ctx.fillStyle = 'rgba(154,169,182,.4)'; ctx.fillText(d.m, x, H - pad.b + 16); ctx.fillStyle = tClr(d.t); ctx.font = '8px Tajawal'; ctx.fillText(d.t + '°', x, H - pad.b + 30); });
    data.forEach((d, i) => { const x = pad.l + (i + .5) * (cW / 12); const bw = cW / 12 * .65; const bh = d.days > 0 ? (d.days / maxDays) * cH : 0; const by = pad.t + cH - bh; let clr = d.t <= T0 ? 'rgba(100,130,180,.35)' : d.t < 18 ? 'rgba(100,180,200,.55)' : d.t < 22 ? 'rgba(200,180,70,.65)' : d.t <= 30 ? 'rgba(46,204,113,.7)' : 'rgba(230,120,50,.65)'; if (d.days > 0) { ctx.fillStyle = clr; drawRoundedRect(ctx, x - bw / 2, by, bw, bh, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Cairo'; ctx.fillText(d.days, x, by - 4); } });
    ctx.beginPath(); ctx.strokeStyle = 'rgba(231,76,60,.8)'; ctx.lineWidth = 2.5;
    data.forEach((d, i) => { const x = pad.l + (i + .5) * (cW / 12); const y = pad.t + cH - (d.t / maxTemp) * cH; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }); ctx.stroke();
    data.forEach((d, i) => { const x = pad.l + (i + .5) * (cW / 12); const y = pad.t + cH - (d.t / maxTemp) * cH; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fillStyle = tClr(d.t); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); });
    [[8, 'rgba(100,180,200,.5)', 'العتبة 8°م'], [30, 'rgba(46,204,113,.5)', 'المثلى 30°م']].forEach(([t, cl, lb]) => { const y = pad.t + cH - (t / maxTemp) * cH; ctx.beginPath(); ctx.strokeStyle = cl; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cW, y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = cl; ctx.font = '8px Tajawal'; ctx.textAlign = 'left'; ctx.fillText(lb, pad.l + 4, y - 5); });
    data.forEach((d, i) => { const x = pad.l + (i + .5) * (cW / 12); ctx.fillStyle = d.gen >= 2 ? 'rgba(231,76,60,.6)' : d.gen >= 1 ? 'rgba(243,156,18,.5)' : 'rgba(154,169,182,.3)'; ctx.font = 'bold 8px Cairo'; ctx.textAlign = 'center'; ctx.fillText(d.gen + ' جيل', x, H - pad.b + 44); });
    const legend = document.getElementById('chartLegend'); if (legend) legend.innerHTML = '<span><span class="legend-dot" style="background:rgba(46,204,113,.7)"></span> نشاط عالي</span><span><span class="legend-dot" style="background:rgba(200,180,70,.65)"></span> نشاط متوسط</span><span><span class="legend-dot" style="background:rgba(100,180,200,.55)"></span> نشاط منخفض</span><span style="border-top:3px solid #e74c3c;padding-top:3px"> خط الحرارة</span>';
}
const debouncedDrawChart = debounce(drawChart, 250);

function buildHeatmap() {
    const grid = document.getElementById('heatmapGrid'), labels = document.getElementById('heatmapLabels');
    if (!grid) return;
    const fragment = document.createDocumentFragment(), labelFragment = document.createDocumentFragment();
    egyptMonthsData.forEach(em => { const d = calcDays(em.temp); let act = d.dev <= 0 ? 0 : d.dev <= 25 ? 90 + (25 - d.dev) * 2 : d.dev <= 35 ? 70 + (35 - d.dev) * 2 : d.dev <= 50 ? 45 + (50 - d.dev) * 1.5 : 20 + (75 - d.dev) * .5; act = Math.max(0, Math.min(100, act)); const cell = document.createElement('div'); cell.className = 'heatmap-cell'; cell.style.background = hmClr(act); cell.style.color = act > 70 ? '#fff' : 'var(--text2)'; cell.innerHTML = `${Math.round(act)}%<div class="heatmap-tip">${em.month} | نشاط ${Math.round(act)}% | حرارة ${em.temp}°م</div>`; fragment.appendChild(cell); const lbl = document.createElement('div'); lbl.textContent = em.month; labelFragment.appendChild(lbl); });
    grid.innerHTML = ''; grid.appendChild(fragment); labels.innerHTML = ''; labels.appendChild(labelFragment);
}

// ============================================
// Stages Functions
// ============================================
function buildStages() {
    const g = document.getElementById('sGrid'), d = calcDays(curTemp); g.innerHTML = '';
    const fragment = document.createDocumentFragment();
    stagesData.forEach((s, i) => { const c = document.createElement('div'); c.className = 'sc2'; c.dataset.i = i; c.tabIndex = 0; c.innerHTML = `<div class="sico" style="background:${s.color}15;color:${s.color}"><span style="font-size:1.8rem">${s.icon}</span><span class="snm" style="background:${s.color}">${i + 1}</span></div><div class="snme">${s.name}</div><div class="sdys" data-s="${s.id}" style="color:${s.color}">${d[s.id] < 0 ? '—' : d[s.id]}</div><div class="sdyl">يوم عند ${curTemp}°م</div><div class="sbrf">${s.brief}</div>`; c.addEventListener('click', () => selS(i)); fragment.appendChild(c); });
    g.appendChild(fragment);
}

function updSD(d) { stagesData.forEach(s => { const el = document.querySelector(`.sdys[data-s="${s.id}"]`); if (el) el.textContent = d[s.id] < 0 ? '—' : d[s.id]; }); }
function selS(i) { curStage = i; updSU(); }
function updSU() {
    document.querySelectorAll('.sc2').forEach((c, i) => c.classList.toggle('on', i === curStage));
    const p = document.getElementById('detP');
    if (curStage >= 0) { updDet(); p.classList.add('open'); requestAnimationFrame(() => p.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); }
    else p.classList.remove('open');
}
function updDet() {
    if (curStage < 0) return;
    const s = stagesData[curStage], d = calcDays(curTemp), v = d[s.id];
    document.getElementById('detI').innerHTML = `<div class="dvis" style="background:linear-gradient(135deg,${s.color}05,${s.color}10)"><div class="dvico" style="background:${s.color}15;color:${s.color}"><span style="font-size:3.5rem">${s.icon}</span><div class="dvr" style="border-color:${s.color}"></div></div><div style="font-family:Cairo;font-weight:900;font-size:1.2rem;margin-top:.5rem">${s.name}</div><div style="font-size:2.2rem;font-weight:900;color:${s.color};font-family:Cairo">${v < 0 ? 'لا تطور' : v + ' يوم'}</div><div style="font-size:.78rem;color:#9a8e82">عند متوسط يومي ${curTemp}°م</div></div><div class="dinf"><h3 style="color:${s.color}">${s.title}</h3><div class="dbdg" style="background:${s.color}10;color:${s.color}"><i class="fas fa-hourglass-half"></i>${v < 0 ? 'لا تطور' : v + ' يوم'} عند ${curTemp}°م</div><p>${s.description}</p><ul class="fl">${s.features.map(f => `<li><i class="fas fa-circle" style="color:${s.color}"></i><span>${f}</span></li>`).join('')}</ul></div>`;
}
function toggleA() {
    const b = document.getElementById('autoBtn');
    if (isAuto) { clearInterval(autoInt); isAuto = false; b.innerHTML = '<i class="fas fa-play"></i><span>تشغيل تلقائي</span>'; }
    else { isAuto = true; b.innerHTML = '<i class="fas fa-pause"></i><span>إيقاف</span>'; let s = 0; selS(s); autoInt = setInterval(() => { s = (s + 1) % stagesData.length; selS(s); }, 3500); }
}

// ============================================
// Calendar Functions
// ============================================
function populateTable() {
    const tbody = document.querySelector('#calendarTable tbody'); if (!tbody) return; tbody.innerHTML = '';
    const cData = calendarDataObj;
    const rows = [
        { label: '🌡️ متوسط الحرارة (°م)', data: cData.temperatures || [], type: 'temp' },
        { label: '💧 الرطوبة (%)', data: cData.humidities || [], type: 'hum' },
        { label: '🦋 نشاط الآفة', data: cData.activities || [], type: 'act' },
        { label: '🔄 الأجيال', data: cData.generations || [], type: 'gen' },
        { label: ' المصائد', data: cData.traps || [], type: 'trap' },
        { label: '🦠 بيولوجية', data: cData.bioStatus || [], type: 'bio' },
        { label: '💊 كيميائية', data: cData.chemStatus || [], type: 'chem' },
        { label: ' تعقيم', data: cData.soilStatus || [], type: 'soil' }
    ];
    const getTempColor = t => t < 20 ? '#3b82f6' : t <= 25 ? '#22c55e' : t <= 30 ? '#eab308' : t <= 34 ? '#f97316' : '#ef4444';
    const getGenColor = g => g <= .5 ? '#22c55e' : g <= 1 ? '#eab308' : g <= 1.5 ? '#f97316' : '#ef4444';
    const fragment = document.createDocumentFragment();
    rows.forEach(row => {
        const tr = document.createElement('tr'); const tdLabel = document.createElement('td'); tdLabel.textContent = row.label; tr.appendChild(tdLabel);
        row.data.forEach((val, i) => {
            const td = document.createElement('td'); td.setAttribute('data-month', i);
            if (row.type === 'temp') td.innerHTML = `<span class="circle-badge" style="background:${getTempColor(val)}">${val}</span>`;
            else if (row.type === 'hum') td.innerHTML = `<span class="circle-badge" style="background:#3498db">${val}</span>`;
            else if (row.type === 'gen') td.innerHTML = `<span class="circle-badge" style="background:${getGenColor(val)}">${val}</span>`;
            else td.textContent = val;
            tr.appendChild(td);
        });
        fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);
}

function buildPlanCards() {
    const wrapper = document.getElementById('planCardWrapper'); if (!wrapper) return; wrapper.innerHTML = '';
    const fragment = document.createDocumentFragment();
    planCardsData.forEach((p, idx) => {
        const card = document.createElement('div'); card.className = 'plan-card'; card.id = 'card-' + p.id; card.style.borderRight = `4px solid ${p.color}`;
        const contextHtml = p.context.map(c => `<p><strong>${c.label}:</strong> ${c.text}</p>`).join('');
        card.innerHTML = `<div class="plan-card-header"><span>${p.months}</span><span class="plan-card-badge" style="background:rgba(255,255,255,.1);color:${p.color}">${p.level}</span></div><h3 style="color:#fff;margin-bottom:1rem;font-size:1.1rem">${p.title}</h3><div class="plan-card-context">${contextHtml}</div><ul class="plan-card-list">${p.items.map(item => `<li>${item}</li>`).join('')}</ul>`;
        if (idx !== 0) card.classList.add('hidden-card');
        fragment.appendChild(card);
    });
    wrapper.appendChild(fragment);
}

function hexToRgb(hex) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); return `${r},${g},${b}`; }

function showPlanCard(period, btn) {
    document.querySelectorAll('#planFilterCol .filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) { btn.classList.add('active'); hapticButton(btn); }
    document.querySelectorAll('.plan-card').forEach(c => c.classList.add('hidden-card'));
    const target = document.getElementById('card-' + period);
    if (target) { target.classList.remove('hidden-card'); requestAnimationFrame(() => target.style.opacity = '1'); }
}

function filterSeason(season, btn) {
    document.querySelectorAll('#calendar .filter-bar .filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) { btn.classList.add('active'); hapticButton(btn); }
    const visible = season === 'all' ? [0,1,2,3,4,5,6,7,8,9,10,11] : season === 'spring' ? [2,3,4] : season === 'summer' ? [5,6,7] : season === 'autumn' ? [8,9,10] : [11,0,1];
    document.querySelectorAll('#calendarTable th[data-month], #calendarTable td[data-month]').forEach(el => {
        el.classList.toggle('hidden-col', !visible.includes(parseInt(el.getAttribute('data-month'))));
    });
}

// ============================================
// Build Dynamic Sections
// ============================================
function buildSources() {
    const box = document.getElementById('sourcesBox'); if (!box || sourcesData.length === 0) return;
    const fragment = document.createDocumentFragment();
    sourcesData.forEach(s => { const card = document.createElement('div'); card.className = 'source-card'; card.innerHTML = `<span class="source-tag">${s.tag}</span><h4>${s.title}</h4><p>${s.description}</p>`; fragment.appendChild(card); });
    box.appendChild(fragment);
}

function buildSpreadSection() {
    const container = document.getElementById('spreadAccordion'); if (!container) return;
    const fragment = document.createDocumentFragment();
    getSpreadReasons().forEach(r => {
        const card = document.createElement('div'); card.className = 'bio-card'; card.dataset.category = r.category;
        card.innerHTML = `<div class="bio-header" onclick="toggleAccordion(this.closest('.bio-card'), 'spreadAccordion')" tabindex="0"><span style="font-size: 2rem">${r.icon}</span><div style="flex:1"><h3 style="font-size:1.05rem;color:#fff">${r.title}</h3><span style="font-size:0.75rem;color:var(--plan-accent)">${r.type}</span></div><i class="fas fa-chevron-down"></i></div><div class="bio-body"><p>${r.description}</p><h4>🔑 الأثر</h4><p>${r.impact}</p></div>`;
        fragment.appendChild(card);
    });
    container.appendChild(fragment);
}

function buildEconomicSection() {
    const statsContainer = document.getElementById('econStats');
    if (statsContainer && getEconomicStats().length > 0) {
        const fragment = document.createDocumentFragment();
        getEconomicStats().forEach(s => { const stat = document.createElement('div'); stat.className = 'econ-stat'; stat.innerHTML = `<div class="econ-stat-num">${s.value}</div><div class="econ-stat-lbl">${s.label}</div>`; fragment.appendChild(stat); });
        statsContainer.appendChild(fragment);
    }
    const cardsContainer = document.getElementById('econAccordion');
    if (cardsContainer && getEconomicCards().length > 0) {
        const fragment = document.createDocumentFragment();
        getEconomicCards().forEach(c => {
            const card = document.createElement('div'); card.className = 'bio-card'; card.dataset.category = c.category;
            card.innerHTML = `<div class="bio-header" onclick="toggleAccordion(this.closest('.bio-card'), 'econAccordion')" tabindex="0"><span style="font-size: 2rem">${c.icon}</span><div style="flex:1"><h3 style="font-size:1.05rem;color:#fff">${c.title}</h3><span style="font-size:0.75rem;color:var(--plan-accent)">${c.type}</span></div><i class="fas fa-chevron-down"></i></div><div class="bio-body"><p>${c.description}</p><h4>💰 الأثر المالي</h4><p>${c.financialImpact}</p></div>`;
            fragment.appendChild(card);
        });
        cardsContainer.appendChild(fragment);
    }
}

function buildIPMSection() {
    const container = document.getElementById('ipmContent'); if (!container) return;
    const ipmData = getIPMData(), tabs = ipmData.ipmTabs || [], panels = ipmData.panels || {};
    let html = '<div class="ipm-tabs" id="ipmTabs">';
    tabs.forEach((tab, i) => { html += `<button class="ipm-tab ${i === 0 ? 'active' : ''}" data-tab="${tab.id}">${tab.title}</button>`; });
    html += '</div><div class="ipm-panels">';
    tabs.forEach((tab, i) => {
        const panel = panels[tab.id]; if (!panel) return;
        html += `<div class="ipm-panel ${i === 0 ? 'active' : ''}" id="panel-${tab.id}">`;
        if (panel.warning) html += `<div style="padding:1rem;background:rgba(231,76,60,0.08);border:1px solid rgba(231,76,60,0.3);border-radius:var(--radius-sm);margin-bottom:1.5rem"><p style="font-size:0.9rem;color:var(--text2)"><strong style="color:var(--accent)">️ تحذير:</strong> ${panel.warning}</p></div>`;
        if (panel.cards) { html += '<div class="ipm-grid">'; panel.cards.forEach(card => { html += `<div class="ipm-card"><div class="ipm-card-icon">${card.icon}</div><h4>${card.title}</h4><p>${card.description}</p><span class="ipm-tag ${card.tagClass}">${card.tag}</span></div>`; }); html += '</div>'; }
        if (panel.instructions) html += `<div style="background:rgba(243,156,18,0.08);border:1px solid rgba(243,156,18,0.3);border-radius:var(--radius-sm);padding:1.2rem;margin-top:1.5rem"><h4 style="color:var(--amber);margin-bottom:0.5rem">️ إرشادات</h4><ul style="list-style:none;padding:0;font-size:0.85rem;color:var(--text2);line-height:2">${panel.instructions.map(inst => `<li>✓ ${inst}</li>`).join('')}</ul></div>`;
        if (panel.rotationSchedule) html += `<div style="margin-top:1.5rem;padding:1.2rem;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm)"><h4 style="color:var(--plan-accent);margin-bottom:0.8rem">🗓️ جدول التناوب</h4><p style="color:var(--text2);font-size:0.9rem;line-height:1.9">${panel.rotationSchedule}</p></div>`;
        html += '</div>';
    });
    html += '</div>'; container.innerHTML = html;
    setTimeout(() => {
        const tabsContainer = document.getElementById('ipmTabs');
        if (tabsContainer) {
            tabsContainer.addEventListener('click', (e) => {
                const tab = e.target.closest('.ipm-tab'); if (!tab) return; hapticButton(tab);
                document.querySelectorAll('.ipm-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.ipm-panel').forEach(p => p.classList.remove('active'));
                document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
            });
        }
    }, 100);
}

function buildFAQSection() {
    const container = document.getElementById('faqList'); if (!container) return;
    const fragment = document.createDocumentFragment();
    getFAQ().forEach(f => { const item = document.createElement('div'); item.className = 'faq-item'; item.innerHTML = `<div class="faq-question" onclick="toggleFAQ(this)" tabindex="0"><span>${f.question}</span><i class="fas fa-chevron-down faq-icon"></i></div><div class="faq-answer">${f.answer}</div>`; fragment.appendChild(item); });
    container.appendChild(fragment);
}

function buildResistanceSection() {
    const container = document.getElementById('resistanceGrid'); if (!container) return;
    const fragment = document.createDocumentFragment();
    getResistanceData().forEach(r => { const levelClass = r.level === 'high' ? 'level-high' : r.level === 'medium' ? 'level-medium' : 'level-low'; const card = document.createElement('div'); card.className = 'resistance-card'; card.innerHTML = `<h4>${r.pesticide}</h4><p style="font-size:0.8rem;color:var(--text2)">${r.example}</p><div class="resistance-level ${levelClass}">${r.levelText}</div>`; fragment.appendChild(card); });
    container.appendChild(fragment);
}

// ============================================
// Accordion & Filter Functions
// ============================================
function toggleFAQ(el) { const item = el.parentElement; const isOpen = item.classList.contains('open'); haptic(10); document.querySelectorAll('.faq-item').forEach(x => x.classList.remove('open')); if (!isOpen) item.classList.add('open'); }
function toggleAccordion(el, containerId) { const card = el.closest('.bio-card'); const o = card.classList.contains('open'); const c = document.getElementById(containerId); haptic(10); c.querySelectorAll('.bio-card').forEach(x => x.classList.remove('open')); if (!o) card.classList.add('open'); }
function filterBioCards(category, containerId, btn) {
    btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); hapticButton(btn);
    document.getElementById(containerId).querySelectorAll('.bio-card').forEach(card => {
        if (category === 'all' || card.dataset.category === category) { card.style.display = ''; requestAnimationFrame(() => card.style.opacity = '1'); }
        else { card.style.opacity = '0'; setTimeout(() => card.style.display = 'none', 300); }
    });
}

// ============================================
// Navigation
// ============================================
function showSingleSection(groupId, clickedItem) {
    document.querySelectorAll('.section').forEach(s => { s.classList.add('section-hidden'); s.classList.remove('section-visible'); });
    (groupMap[groupId] || []).forEach(id => { const sec = document.getElementById(id); if (sec) { sec.classList.remove('section-hidden'); sec.classList.add('section-visible'); } });
    document.getElementById('heroSection').classList.add('hero-hidden');
    document.querySelectorAll('.dropdown-item').forEach(l => l.classList.remove('active'));
    if (clickedItem) clickedItem.classList.add('active');
    currentSingleGroup = groupId;
    const label = document.getElementById('currentGroupLabel'); if (label) { label.textContent = groupNames[groupId] || ''; label.classList.add('visible'); }
    closeDropdown(); updateNavButtons(); window.scrollTo({ top: 0, behavior: 'smooth' });
    updateBottomNavActive(groupId);
}

function updateBottomNavActive(groupId) {
    document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
    let activeItem = null;
    if (groupId === 'biology' || groupId === 'spread-economic' || groupId === 'seasonal-heatmap') activeItem = document.querySelector('[data-section="biology"]');
    else if (groupId === 'calendar' || groupId === 'ipm' || groupId === 'resistance') activeItem = document.querySelector('[data-section="ipm"]');
    else if (groupId === 'bioagents' || groupId === 'faq' || groupId === 'sources') activeItem = document.querySelector('[data-section="bioagents"]');
    if (activeItem) activeItem.classList.add('active');
}

function goHome() {
    document.querySelectorAll('.section').forEach(s => { s.classList.add('section-hidden'); s.classList.remove('section-visible'); });
    document.getElementById('heroSection').classList.add('hero-hidden');
    currentSingleGroup = null;
    document.querySelectorAll('.dropdown-item').forEach(l => l.classList.remove('active'));
    document.getElementById('currentGroupLabel').classList.remove('visible');
    updateNavButtons(); closeDropdown();
    document.getElementById('landingOverlay').classList.remove('hidden');
    document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
    document.querySelector('[data-section="home"]').classList.add('active');
}

function toggleDropdown() {
    const panel = document.getElementById('dropdownPanel'), overlay = document.getElementById('menuOverlay'), btn = document.getElementById('navMenuBtn');
    haptic(15);
    if (panel.classList.contains('open')) closeDropdown();
    else { panel.classList.add('open'); overlay.classList.add('active'); btn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
}
function closeDropdown() { document.getElementById('dropdownPanel').classList.remove('open'); document.getElementById('menuOverlay').classList.remove('active'); document.getElementById('navMenuBtn').setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }

function navigateGroup(direction) {
    haptic(10);
    if (!currentSingleGroup) { showSingleSection(direction === 1 ? groupOrder[0] : groupOrder[groupOrder.length - 1], document.querySelector(`.dropdown-item[data-group="${direction === 1 ? groupOrder[0] : groupOrder[groupOrder.length - 1]}"]`)); return; }
    const idx = groupOrder.indexOf(currentSingleGroup); let newIdx = idx + direction;
    if (newIdx < 0) newIdx = 0; if (newIdx >= groupOrder.length) newIdx = groupOrder.length - 1;
    showSingleSection(groupOrder[newIdx], document.querySelector(`.dropdown-item[data-group="${groupOrder[newIdx]}"]`));
}

function updateNavButtons() {
    const prevBtn = document.getElementById('navPrevBtn'), nextBtn = document.getElementById('navNextBtn');
    if (!currentSingleGroup) { prevBtn.classList.remove('disabled'); nextBtn.classList.remove('disabled'); return; }
    const idx = groupOrder.indexOf(currentSingleGroup);
    prevBtn.classList.toggle('disabled', idx === 0); nextBtn.classList.toggle('disabled', idx === groupOrder.length - 1);
}

// ============================================
// Landing
// ============================================
function createLandingParticles() {
    const c = document.getElementById('landingParticles'); if (!c) return;
    const cols = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db'], fragment = document.createDocumentFragment();
    for (let i = 0; i < 25; i++) { const p = document.createElement('div'); p.className = 'landing-particle'; const s = Math.random() * 4 + 2; p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;background:${cols[i % cols.length]};animation-duration:${Math.random() * 12 + 8}s;animation-delay:${Math.random() * 8}s`; fragment.appendChild(p); }
    c.appendChild(fragment);
}

function closeLanding() {
    haptic(20);
    document.getElementById('landingOverlay').classList.add('hidden');
    showSingleSection('biology', document.querySelector('[data-group="biology"]'));
    // ✅ إصلاح: تشغيل Onboarding
    if (!localStorage.getItem('tuta-onboarding-shown')) {
        setTimeout(() => {
            showOnboarding();
        }, 800);
    }
}

// ============================================
// Bio Agents
// ============================================
const targetLabels = { egg: '🥚 البيض', larvae: '🐛 اليرقات', pupae: '🫘 العذارى', adult: '🦋 الكاملة' };
const targetStatusText = { effective: 'فعّال', partial: 'جزئي', none: 'لا يؤثر' };
const targetClass = { effective: 'active-target', partial: 'partial-target', none: 'inactive-target' };
const badgeMap = { 'preventive': { text: '🛡️ وقائي', class: 'badge-blue' }, 'curative': { text: ' علاجي', class: 'badge-amber' }, 'preventive-curative': { text: '️💊 وقائي وعلاجي', class: 'badge-green' }, 'heat-tolerant': { text: '🌡️ متحمل', class: 'badge-green' }, 'egypt-native': { text: '🇪🇬 متوطن', class: 'badge-purple' }, 'pesticide-sensitive': { text: '⚠️ حساس', class: 'badge-red' }, 'bio-safe': { text: '✅ آمن', class: 'badge-green' }, 'needs-humidity': { text: '💧 رطوبة', class: 'badge-amber' }, 'needs-high-humidity': { text: '💧 رطوبة عالية', class: 'badge-red' }, 'good-heat': { text: '🌡️ تحمل جيد', class: 'badge-green' }, 'sun-sensitive': { text: '☀️ حساس للشمس', class: 'badge-red' } };
const importanceText = { high: 'عالي', medium: 'متوسط', low: 'منخفض', none: 'لا يؤثر' };
const toleranceText = { excellent: 'ممتاز', good: 'جيد', medium: 'متوسط', poor: 'ضعيف' };
const compatText = { excellent: 'ممتاز', good: 'جيد', medium: 'متوسط', poor: 'ضعيف' };
const toxicityText = { high: 'شديد', medium: 'متوسط', safe: 'آمن' };
const categoryMap = { 'all': { name: ' الكل' }, 'egg-parasitoid': { name: '🐝 طفيل بيض' }, 'larval-parasitoid': { name: '🐝 طفيل يرقات' }, 'predator': { name: '🪲 مفترس' }, 'fungi': { name: '🍄 فطريات' }, 'nematode': { name: '🪱 نيماتودا' } };

function openModal(modalId) { const m = document.getElementById(modalId); if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; } }
function openBioModal(id) { haptic(15); openModal(`modal-${id}`); }
function closeModal(modalId) { const m = document.getElementById(modalId); if (m) { m.classList.remove('active'); document.body.style.overflow = ''; } }
function closeModalOnBg(e, id) { if (e.target === e.currentTarget) closeModal(id); }

function renderBioCategoryFilter() {
    const fc = document.getElementById('bioCategoryFilter'); if (!fc) return;
    const fragment = document.createDocumentFragment();
    Object.keys(categoryMap).forEach(key => { const btn = document.createElement('button'); btn.className = `bio-filter-btn ${key === 'all' ? 'active' : ''}`; btn.textContent = categoryMap[key].name; btn.onclick = function() { filterBioByCategory(key, this); }; fragment.appendChild(btn); });
    fc.appendChild(fragment);
}

function renderBioCards(filter = 'all') {
    const container = document.getElementById('bioCardsContainer'); if (!container) return; container.innerHTML = '';
    const filtered = filter === 'all' ? bioAgentsData : bioAgentsData.filter(a => a.category === filter);
    const fragment = document.createDocumentFragment();
    filtered.forEach(agent => {
        const card = document.createElement('div'); card.className = 'bio-card-advanced'; card.onclick = () => openBioModal(agent.id);
        let html = `<div class="bio-card-advanced-header"><span class="bio-icon-large">${agent.icon}</span><div class="bio-card-titles"><h3>${agent.scientificName}</h3><span class="subtitle">${agent.arabicDesc}</span></div></div><div class="bio-targets">`;
        Object.keys(agent.targets).forEach(key => { const s = agent.targets[key]; html += `<div class="target-row ${targetClass[s]}"><span class="target-label">${targetLabels[key]}</span><span class="target-status">${targetStatusText[s]}</span></div>`; });
        html += '</div><div class="bio-badges">'; agent.badges.forEach(b => { const bd = badgeMap[b]; if (bd) html += `<span class="bio-badge ${bd.class}">${bd.text}</span>`; });
        html += '</div><div class="bio-card-footer">اقرأ التفاصيل <i class="fas fa-arrow-left"></i></div>';
        card.innerHTML = html; fragment.appendChild(card);
    });
    container.appendChild(fragment);
}

function renderBioModals() {
    const container = document.getElementById('bioModalsContainer'); if (!container) return; container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    bioAgentsData.forEach(agent => {
        const modal = document.createElement('div'); modal.className = 'bio-modal'; modal.id = `modal-${agent.id}`; modal.onclick = (e) => closeModalOnBg(e, `modal-${agent.id}`);
        modal.innerHTML = `<div class="bio-modal-content"><button class="bio-modal-close" onclick="closeModal('modal-${agent.id}')">×</button><div class="bio-modal-header"><span style="font-size:3.5rem">${agent.icon}</span><h2>${agent.scientificName}</h2><span class="bio-modal-badge">${agent.arabicDesc}</span></div><div class="modal-tabs"><button class="tab-btn active" onclick="switchTab('${agent.id}', 'overview', event)">نظرة عامة</button><button class="tab-btn" onclick="switchTab('${agent.id}', 'lifecycle', event)">دورة الحياة</button><button class="tab-btn" onclick="switchTab('${agent.id}', 'usage', event)">الاستخدام</button><button class="tab-btn" onclick="switchTab('${agent.id}', 'rating', event)">التقييم</button></div><div class="tab-content active" id="tab-${agent.id}-overview"><div class="modal-body-content"><h4>التصنيف</h4><table class="info-table"><tr><td>الرتبة</td><td>${agent.classification.order}</td></tr><tr><td>الفصيلة</td><td>${agent.classification.family}</td></tr></table><h4>طريقة العمل</h4><p>${agent.bioType}</p><h4>الأهمية</h4><div class="importance-grid"><div class="importance-item ${agent.importance.egg}"><span>البيض</span><span class="importance-level ${agent.importance.egg}">${importanceText[agent.importance.egg]}</span></div><div class="importance-item ${agent.importance.larvae}"><span>اليرقات</span><span class="importance-level ${agent.importance.larvae}">${importanceText[agent.importance.larvae]}</span></div></div></div></div><div class="tab-content" id="tab-${agent.id}-lifecycle"><div class="modal-body-content"><h4>المراحل</h4><div class="lifecycle-steps">${agent.lifecycleSteps.map((s, i) => `<div class="lifecycle-step"><div class="step-number">${i + 1}</div><div class="step-text">${s}</div></div>`).join('')}</div><h4>السلوك</h4><p>${agent.behavior}</p></div></div><div class="tab-content" id="tab-${agent.id}-usage"><div class="modal-body-content"><h4>التحمل في مصر</h4><div class="conditions-grid"><div class="condition-item"><div class="cond-label">صيف الدلتا</div><div class="cond-value">${toleranceText[agent.egyptTolerance.delta]}</div></div><div class="condition-item"><div class="cond-label">البيوت المحمية</div><div class="cond-value">${toleranceText[agent.egyptTolerance.greenhouse]}</div></div></div></div></div><div class="tab-content" id="tab-${agent.id}-rating"><div class="modal-body-content"><h4>المزايا</h4><ul class="pros-list">${agent.pros.map(p => `<li>✅ ${p}</li>`).join('')}</ul><h4>العيوب</h4><ul class="cons-list">${agent.cons.map(c => `<li>❌ ${c}</li>`).join('')}</ul><div class="final-rating-box"><div style="font-size:1.5rem;color:var(--amber)">${'⭐'.repeat(agent.ratingStars)}${'☆'.repeat(5 - agent.ratingStars)}</div><p>${agent.finalRating}</p></div></div></div></div>`;
        fragment.appendChild(modal);
    });
    container.appendChild(fragment);
}

function switchTab(agentId, tabName, event) {
    if (event) event.preventDefault();
    const modal = document.getElementById(`modal-${agentId}`); if (!modal) return; haptic(10);
    modal.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    modal.querySelectorAll('.tab-btn').forEach(tb => tb.classList.remove('active'));
    document.getElementById(`tab-${agentId}-${tabName}`).classList.add('active');
    if (event && event.target.closest) event.target.closest('.tab-btn').classList.add('active');
}

function filterBioByCategory(category, btn) { document.querySelectorAll('.bio-filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); hapticButton(btn); renderBioCards(category); }

// ============================================
// Progress Bar
// ============================================
function updateProgressBar() {
    const fill = document.getElementById('progressFill'); if (!fill) return;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) { fill.style.width = '0%'; return; }
    const progress = Math.min((scrollTop / docHeight) * 100, 100);
    fill.style.width = progress + '%';
}

// ============================================
// Pull-to-Refresh & Swipe
// ============================================
let pullStartY = 0, pullStartX = 0, pullDistance = 0, isPulling = false;
let touchStartX = 0, touchEndX = 0, touchStartY = 0;

function initGestures() {
    document.addEventListener('touchstart', (e) => {
        pullStartY = e.touches[0].clientY;
        pullStartX = e.touches[0].clientX;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isPulling = window.scrollY === 0;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;
        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const deltaY = currentY - pullStartY;
        const deltaX = Math.abs(currentX - pullStartX);
        
        if (deltaX > deltaY && deltaX > 30) { isPulling = false; return; }
        
        if (deltaY > 0 && window.scrollY === 0) {
            pullDistance = deltaY;
            const ptr = document.getElementById('pullToRefresh');
            if (ptr) {
                ptr.style.opacity = Math.min(pullDistance / 100, 1);
                ptr.style.transform = `translateY(${Math.min(pullDistance - 60, 0)}px)`;
                if (pullDistance > 80) ptr.classList.add('visible');
            }
        }
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].clientX;
        const ptr = document.getElementById('pullToRefresh');
        
        if (pullDistance > 80) triggerRefresh();
        if (ptr) { ptr.classList.remove('visible'); ptr.style.transform = 'translateY(-100%)'; ptr.style.opacity = 0; }
        
        const swipeDiff = touchStartX - touchEndX;
        const swipeDiffY = Math.abs(touchStartY - e.changedTouches[0].clientY);
        if (Math.abs(swipeDiff) > 100 && swipeDiffY < 100) {
            if (!document.querySelector('.bio-modal.active') && !document.querySelector('.search-modal.active') && !document.querySelector('.contact-modal.active')) {
                haptic(10);
                if (swipeDiff > 0) navigateGroup(1); else navigateGroup(-1);
            }
        }
        
        isPulling = false; pullDistance = 0;
    });
}

function triggerRefresh() {
    const ptr = document.getElementById('pullToRefresh'); haptic(30);
    ptr.classList.add('refreshing'); ptr.querySelector('span').textContent = t('refreshing');
    setTimeout(() => location.reload(), 1000);
}

// ============================================
// Sticky Headers
// ============================================
function initStickyHeaders() {
    const handleScroll = () => {
        const navHeight = (document.getElementById('topNav')?.offsetHeight || 60) + 10;
        document.querySelectorAll('.sticky-header').forEach(header => {
            const rect = header.getBoundingClientRect();
            if (rect.top <= navHeight) header.classList.add('scrolled');
            else header.classList.remove('scrolled');
        });
    };
    window.addEventListener('scroll', () => requestAnimationFrame(handleScroll), { passive: true });
    handleScroll();
}

// ============================================
// ✅ Onboarding (تم الإصلاح)
// ============================================
let currentOnboardingSlide = 1;
const totalOnboardingSlides = 4;

function showOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        updateOnboardingSlide();
    }
}

function updateOnboardingSlide() {
    document.querySelectorAll('.onboarding-slide').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.onboarding-dot').forEach(d => d.classList.remove('active'));
    const slide = document.querySelector(`.onboarding-slide[data-slide="${currentOnboardingSlide}"]`);
    if (slide) slide.classList.add('active');
    const dots = document.querySelectorAll('.onboarding-dot');
    if (dots[currentOnboardingSlide - 1]) dots[currentOnboardingSlide - 1].classList.add('active');
    const nextBtn = document.querySelector('.onboarding-next');
    if (nextBtn) nextBtn.innerHTML = currentOnboardingSlide === totalOnboardingSlides ? `${t('getStarted')} <i class="fas fa-check"></i>` : `${t('next')} <i class="fas fa-arrow-left"></i>`;
}

function nextOnboarding() {
    haptic(15);
    if (currentOnboardingSlide < totalOnboardingSlides) { currentOnboardingSlide++; updateOnboardingSlide(); }
    else skipOnboarding();
}

function skipOnboarding() {
    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    currentOnboardingSlide = 1;
    localStorage.setItem('tuta-onboarding-shown', 'true');
}

// ============================================
// Smart Search
// ============================================
let currentSearchFilter = 'all';
let searchTimeout = null;
let currentSearchResults = [];

function openSearch() {
    haptic(15);
    document.getElementById('searchModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('searchInput').focus(), 100);
}

function closeSearch() {
    document.getElementById('searchModal').classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = `<div class="search-empty"><i class="fas fa-search"></i><p>${t('startTyping')}</p></div>`;
    currentSearchResults = [];
}

function setSearchFilter(filter, btn) {
    currentSearchFilter = filter;
    document.querySelectorAll('.search-filter').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    hapticButton(btn);
    const query = document.getElementById('searchInput').value.trim();
    if (query) performSearch(query);
}

function performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    const lowerQuery = query.toLowerCase();
    currentSearchResults = [];
    
    if (currentSearchFilter === 'all' || currentSearchFilter === 'bio') {
        bioAgentsData.forEach(agent => {
            if (agent.scientificName.toLowerCase().includes(lowerQuery) || agent.arabicDesc.includes(query)) {
                currentSearchResults.push({ type: 'bio', id: agent.id, category: ' عدو حيوي', title: agent.scientificName, desc: agent.arabicDesc });
            }
        });
    }
    if (currentSearchFilter === 'all' || currentSearchFilter === 'stages') {
        stagesData.forEach((stage, idx) => {
            if (stage.name.includes(query) || stage.brief.includes(query)) {
                currentSearchResults.push({ type: 'stage', idx: idx, category: '🔄 مرحلة حياة', title: stage.name, desc: stage.brief });
            }
        });
    }
    if (currentSearchFilter === 'all' || currentSearchFilter === 'faq') {
        getFAQ().forEach((f, idx) => {
            if (f.question.includes(query) || f.answer.includes(query)) {
                currentSearchResults.push({ type: 'faq', idx: idx, category: '❓ سؤال شائع', title: f.question, desc: f.answer.substring(0, 80) });
            }
        });
    }
    
    if (currentSearchResults.length === 0) {
        resultsContainer.innerHTML = `<div class="search-empty"><i class="fas fa-search"></i><p>${t('noResults')}</p></div>`;
        return;
    }
    
    let html = `<div class="search-stats">${currentSearchResults.length} ${t('resultsFound')}</div>`;
    currentSearchResults.slice(0, 20).forEach((result, idx) => {
        html += `<div class="search-result-item" data-index="${idx}" tabindex="0">
            <div class="search-result-category">${result.category}</div>
            <div class="search-result-title">${highlightText(result.title, query)}</div>
            <div class="search-result-desc">${highlightText(result.desc, query)}</div>
        </div>`;
    });
    resultsContainer.innerHTML = html;
    
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const result = currentSearchResults[index];
            if (!result) return;
            
            closeSearch();
            if (result.type === 'bio') openBioModal(result.id);
            else if (result.type === 'stage') {
                showSingleSection('biology', document.querySelector('[data-group="biology"]'));
                setTimeout(() => selS(result.idx), 500);
            }
            else if (result.type === 'faq') showSingleSection('faq', document.querySelector('[data-group="faq"]'));
        });
    });
}

function highlightText(text, query) {
    if (!query) return text;
    return text.replace(new RegExp(`(${query})`, 'gi'), '<span class="search-result-highlight">$1</span>');
}

// ============================================
// FAB
// ============================================
function toggleFab() { haptic(15); document.getElementById('fabMain').classList.toggle('open'); document.getElementById('fabMenu').classList.toggle('open'); }
function closeFab() { document.getElementById('fabMain').classList.remove('open'); document.getElementById('fabMenu').classList.remove('open'); }
function fabAction(action) {
    haptic(20); closeFab();
    if (action === 'contact') openContact();
    else if (action === 'email') window.location.href = 'mailto:aliazmy30@gmail.com';
    else if (action === 'twitter') window.open('https://x.com/abu_retage0', '_blank');
    else if (action === 'top') window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Contact Modal
// ============================================
function openContact() { haptic(15); document.getElementById('contactModal').classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeContact() { document.getElementById('contactModal').classList.remove('active'); document.body.style.overflow = ''; }

// ============================================
// Bottom Navigation
// ============================================
function bottomNavAction(section, element) {
    haptic(15);
    document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');
    
    if (section === 'home') goHome();
    else if (section === 'biology') showSingleSection('biology', document.querySelector('[data-group="biology"]'));
    else if (section === 'ipm') showSingleSection('ipm', document.querySelector('[data-group="ipm"]'));
    else if (section === 'bioagents') showSingleSection('bioagents', document.querySelector('[data-group="bioagents"]'));
    else if (section === 'contact') openContact();
}

// ============================================
// Toast
// ============================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer'); if (!container) return;
    const toast = document.createElement('div'); toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-100%)'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ============================================
// Main Initialization
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Starting application...');
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    try {
        await loadAllData();
        console.log('✅ Data loaded');
        
        const thermal = getThermalConstants(); T0 = thermal.T0; TH = thermal.TH; K = thermal.K;
        stagesData = getStages(); egyptMonthsData = getEgyptMonths(); calendarDataObj = getCalendarData();
        planCardsData = getPlanCards(); sourcesData = getSources(); bioAgentsData = getBioAgents();
        
        console.log(`📊 Bio Agents: ${bioAgentsData.length}`);
        console.log(`🔄 Stages: ${stagesData.length}`);
        
        buildSpreadSection(); buildEconomicSection(); buildIPMSection(); buildFAQSection();
        buildResistanceSection(); buildSources();
        
        const slider = document.getElementById('tempSlider');
        if (slider) slider.addEventListener('input', function() { curTemp = parseInt(this.value); updAll(); });
        
        const revealObs = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } }); }, { threshold: 0.08 });
        document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
        
        buildStages(); populateTable(); buildPlanCards(); updAll();
        
        // ✅ إصلاح: تشغيل مكتبة الأعداء الحيوية
        renderBioCategoryFilter();
        renderBioCards('all');
        renderBioModals();
        console.log(`✅ Bio Agents rendered: ${bioAgentsData.length} agents`);
        
        document.getElementById('prevS').addEventListener('click', () => { let n = curStage - 1; if (n < 0) n = stagesData.length - 1; selS(n); });
        document.getElementById('nextS').addEventListener('click', () => { let n = curStage + 1; if (n >= stagesData.length) n = 0; selS(n); });
        document.getElementById('autoBtn').addEventListener('click', toggleA);
        
        window.addEventListener('resize', debouncedDrawChart);
        createLandingParticles();
        
        initGestures();
        initStickyHeaders();
        updateLanguage();
        
        window.addEventListener('scroll', throttle(updateProgressBar, 50), { passive: true });
        updateProgressBar();
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                if (query.length < 2) {
                    document.getElementById('searchResults').innerHTML = `<div class="search-empty"><i class="fas fa-search"></i><p>${t('startTyping')}</p></div>`;
                    return;
                }
                searchTimeout = setTimeout(() => performSearch(query), 300);
            });
        }
        
        document.addEventListener('click', (e) => { if (!e.target.closest('.fab-container')) closeFab(); });
        
        document.querySelectorAll('.contact-modal, .search-modal').forEach(modal => {
            modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } });
        });
        
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
            });
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return; refreshing = true; window.location.reload();
            });
        }
        
        setTimeout(() => { if (loadingOverlay) { loadingOverlay.classList.add('hidden'); setTimeout(() => loadingOverlay.style.display = 'none', 500); } }, 800);
    } catch (error) {
        console.error('❌ Error:', error);
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }
});

// ============================================
// Keyboard Shortcuts
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDropdown(); closeSearch(); closeContact();
        document.querySelectorAll('.bio-modal.active').forEach(m => closeModal(m.id));
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'l') { e.preventDefault(); toggleLanguage(); }
});