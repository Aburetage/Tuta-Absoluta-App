// ============================================
// Tuta Absoluta App - Data Loader
// اكاديمية المهندس الزراعي
// النسخة النهائية المُصلحة ✅
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
            { name: 'seasonal-data.json', target: 'seasonalData' },
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
                    // ✅ معالجة خاصة لكل نوع من البيانات
                    
                    // 1. البيانات الاقتصادية (Object فيه Arrays)
                    if (file.target === 'economicData') {
                        economicStats = data.economicStats || data.stats || [];
                        economicCards = data.economicCards || data.cards || [];
                        console.log(`   💰 Stats: ${economicStats.length}, Cards: ${economicCards.length}`);
                    }
                    
                    // 2. بيانات IPM (Object معقد)
                    else if (file.target === 'ipmData') {
                        window.ipmData = data;
                    }
                    
                    // 3. ✅ النموذج الحراري + مراحل الحياة (الأهم!)
                    else if (file.target === 'thermalModel') {
                        // استخراج thermalConstants (Object)
                        window.thermalModel = data.thermalConstants || data;
                        
                        // استخراج stages (Array)
                        window.stages = data.stages || [];
                        
                        console.log(`️ Loaded thermal-model.json`);
                        console.log(`   T0: ${window.thermalModel.T0}°م`);
                        console.log(`   TH: ${window.thermalModel.TH}°م`);
                        console.log(`   Stages: ${window.stages.length} stages`);
                    }
                    
                    // 4. البيانات الموسمية (مهم!)
                    else if (file.target === 'seasonalData') {
                        window.seasonalData = data.egyptMonths || data.seasonalData || [];
                        window.calendarData = data.calendarData || {};
                        
                        console.log(`📅 Loaded seasonal-data.json`);
                        console.log(`   Months: ${window.seasonalData.length}`);
                        console.log(`   Calendar fields: ${Object.keys(window.calendarData).length}`);
                    }
                    
                    // 5. الملفات اللي Array داخل Object
                    else if (['bioAgents', 'faq', 'planCards', 'sources', 'spreadReasons', 'resistanceData'].includes(file.target)) {
                        window[file.target] = data[file.target] || data;
                    }
                    
                    // 6. باقي الملفات
                    else {
                        window[file.target] = data;
                    }
                    
                    console.log(`✅ Loaded ${file.name}`);
                })
                .catch(err => {
                    console.error(`❌ Error loading ${file.name}:`, err);
                    // تعيين قيم افتراضية
                    if (file.target === 'economicData') {
                        economicStats = [];
                        economicCards = [];
                    } else if (file.target === 'seasonalData') {
                        window.seasonalData = [];
                        window.calendarData = {};
                    } else if (file.target === 'thermalModel') {
                        window.thermalModel = { T0: 8, TH: 37, K: { egg: 80, larva: 150, pupa: 100 } };
                        window.stages = [];
                    } else {
                        window[file.target] = [];
                    }
                })
        );

        await Promise.all(promises);
        
        // تعيين المتغيرات المحلية
        thermalModel = window.thermalModel || { T0: 8, TH: 37, K: { egg: 80, larva: 150, pupa: 100 } };
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
        
        console.log('='.repeat(60));
        console.log('✅ All data loaded successfully!');
        console.log('='.repeat(60));
        console.log(`🌡️  Thermal Model: T0=${thermalModel.T0}°م, TH=${thermalModel.TH}°م`);
        console.log(`🔄 Stages: ${stages.length} stages`);
        console.log(` Seasonal Data: ${seasonalData.length} months`);
        console.log(` Calendar Data: ${Object.keys(calendarData).length} fields`);
        console.log(`📊 Bio Agents: ${bioAgents.length} agents`);
        console.log(`❓ FAQ: ${faq.length} questions`);
        console.log(`📉 Economic Stats: ${economicStats.length} stats`);
        console.log(`💰 Economic Cards: ${economicCards.length} cards`);
        console.log(` Plan Cards: ${planCards.length} cards`);
        console.log(`🛡️  IPM Sections: ${Object.keys(ipmData).length}`);
        console.log(`️  Resistance: ${resistanceData.length} pesticides`);
        console.log(`📚 Sources: ${sources.length} references`);
        console.log(`🌍 Spread Reasons: ${spreadReasons.length} reasons`);
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
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
            egg: thermalModel.K?.egg || 75.5,
            larva: thermalModel.K?.larva || 160.8,
            pupa: thermalModel.K?.pupa || 182.3
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
// Export
// ============================================

console.log('📦 Data Loader initialized - Agricultural Engineer Academy');