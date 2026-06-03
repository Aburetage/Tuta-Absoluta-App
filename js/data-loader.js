// ============================================
// Tuta Absoluta App - Data Loader
// اكاديمية المهندس الزراعي
// ============================================

// متغيرات تخزين البيانات
let thermalModel = {};
let stages = [];
let seasonalData = [];
let calendarData = {};
let planCards = [];
let sources = [];
let bioAgents = [];
let spreadReasons = [];
let economicStats = [];
let economicCards = [];
let ipmData = {};
let faq = [];
let resistanceData = [];

// ============================================
// دالة تحميل جميع البيانات
// ============================================

async function loadAllData() {
    try {
        const files = [
            { name: 'thermal-model.json', target: 'thermalModel' },
            { name: 'stages.json', target: 'stages' },
            { name: 'seasonal-data.json', target: 'seasonalData' },
            { name: 'calendar-data.json', target: 'calendarData' },
            { name: 'plan-cards.json', target: 'planCards' },
            { name: 'sources.json', target: 'sources' },
            { name: 'bio-agents.json', target: 'bioAgents' },
            { name: 'spread-reasons.json', target: 'spreadReasons' },
            { name: 'economic-impact.json', target: 'economicData' },
            { name: 'ipm-program.json', target: 'ipmData' },
            { name: 'faq.json', target: 'faq' },
            { name: 'resistance.json', target: 'resistanceData' }
        ];

        const promises = files.map(file => 
            fetch(`data/${file.name}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status} for ${file.name}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // معالجة خاصة للبيانات الاقتصادية
                    if (file.target === 'economicData') {
                        economicStats = data.stats || data.economicStats || [];
                        economicCards = data.cards || data.economicCards || [];
                    } else {
                        // استخدام eval لتعيين المتغير الديناميكي
                        window[file.target] = data;
                    }
                    console.log(`✅ Loaded ${file.name}`);
                })
                .catch(err => {
                    console.error(`❌ Error loading ${file.name}:`, err);
                    // تعيين قيم افتراضية لتجنب الأخطاء
                    if (file.target === 'economicData') {
                        economicStats = [];
                        economicCards = [];
                    } else {
                        window[file.target] = Array.isArray(window[file.target]) ? window[file.target] : {};
                    }
                })
        );

        await Promise.all(promises);
        
        // تعيين المتغيرات المحلية
        thermalModel = window.thermalModel || {};
        stages = window.stages || [];
        seasonalData = window.seasonalData || [];
        calendarData = window.calendarData || {};
        planCards = window.planCards || [];
        sources = window.sources || [];
        bioAgents = window.bioAgents || [];
        spreadReasons = window.spreadReasons || [];
        ipmData = window.ipmData || {};
        faq = window.faq || [];
        resistanceData = window.resistanceData || [];
        
        console.log('✅ All data loaded successfully');
    } catch (error) {
        console.error(' Error loading data:', error);
        throw error;
    }
}

// ============================================
// دوال Getter للبيانات
// ============================================

function getThermalConstants() {
    return {
        T0: thermalModel.T0 || 8,
        TH: thermalModel.TH || 37,
        K: {
            egg: thermalModel.K?.egg || 80,
            larva: thermalModel.K?.larva || 150,
            pupa: thermalModel.K?.pupa || 100
        }
    };
}

function getStages() {
    return stages;
}

function getEgyptMonths() {
    return seasonalData;
}

function getCalendarData() {
    return calendarData;
}

function getPlanCards() {
    return planCards;
}

function getSources() {
    return sources;
}

function getBioAgents() {
    return bioAgents;
}

function getSpreadReasons() {
    return spreadReasons;
}

function getEconomicStats() {
    return economicStats;
}

function getEconomicCards() {
    return economicCards;
}

function getIPMData() {
    return ipmData;
}

function getFAQ() {
    return faq;
}

function getResistanceData() {
    return resistanceData;
}

// ============================================
// Export للدوال (للاستخدام في script.js)
// ============================================

console.log('📦 Data Loader initialized');