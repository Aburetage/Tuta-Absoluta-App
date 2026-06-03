// ============================================
// Data Loader - تحميل البيانات من ملفات JSON
// ============================================

const DataPaths = {
  thermal: 'data/thermal-model.json',
  seasonal: 'data/seasonal-data.json',
  planCards: 'data/plan-cards.json',
  sources: 'data/sources.json',
  faq: 'data/faq.json',
  spread: 'data/spread-reasons.json',
  economic: 'data/economic-impact.json',
  ipm: 'data/ipm-program.json',
  resistance: 'data/resistance.json',
  bioAgents: 'data/bio-agents.json'
};

let APP_DATA = {
  thermal: null,
  seasonal: null,
  planCards: null,
  sources: null,
  faq: null,
  spread: null,
  economic: null,
  ipm: null,
  resistance: null,
  bioAgents: null
};

async function loadData(filename) {
  try {
    const response = await fetch(filename);
    if (!response.ok) {
      console.warn(`تعذر تحميل: ${filename} - سيُستخدم البيانات الاحتياطية`);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`خطأ في تحميل ${filename}:`, error);
    return null;
  }
}

async function loadAllData() {
  const [thermal, seasonal, planCards, sources, faq, spread, economic, ipm, resistance, bioAgents] = await Promise.all([
    loadData(DataPaths.thermal),
    loadData(DataPaths.seasonal),
    loadData(DataPaths.planCards),
    loadData(DataPaths.sources),
    loadData(DataPaths.faq),
    loadData(DataPaths.spread),
    loadData(DataPaths.economic),
    loadData(DataPaths.ipm),
    loadData(DataPaths.resistance),
    loadData(DataPaths.bioAgents)
  ]);

  APP_DATA.thermal = thermal;
  APP_DATA.seasonal = seasonal;
  APP_DATA.planCards = planCards;
  APP_DATA.sources = sources;
  APP_DATA.faq = faq;
  APP_DATA.spread = spread;
  APP_DATA.economic = economic;
  APP_DATA.ipm = ipm;
  APP_DATA.resistance = resistance;
  APP_DATA.bioAgents = bioAgents;

  console.log('✅ تم تحميل جميع البيانات:', APP_DATA);
}

// ============================================
// دوال مساعدة للوصول للبيانات
// ============================================

function getThermalConstants() {
  return APP_DATA.thermal?.thermalConstants || {
    T0: 8,
    TH: 37,
    K: { egg: 75.5, larva: 160.8, pupa: 182.3 }
  };
}

function getStages() {
  return APP_DATA.thermal?.stages || [];
}

function getEgyptMonths() {
  return APP_DATA.seasonal?.egyptMonths || [];
}

function getCalendarData() {
  return APP_DATA.seasonal?.calendarData || {};
}

function getPlanCards() {
  return APP_DATA.planCards?.planCards || [];
}

function getSources() {
  return APP_DATA.sources?.sources || [];
}

function getFAQ() {
  return APP_DATA.faq?.faq || [];
}

function getSpreadReasons() {
  return APP_DATA.spread?.spreadReasons || [];
}

function getEconomicStats() {
  return APP_DATA.economic?.economicStats || [];
}

function getEconomicCards() {
  return APP_DATA.economic?.economicCards || [];
}

function getIPMData() {
  return APP_DATA.ipm || {};
}

function getResistanceData() {
  return APP_DATA.resistance?.resistanceData || [];
}

function getBioAgents() {
  return APP_DATA.bioAgents?.bioAgents || [];
}

// تصدير الدوال عالمياً
window.APP_DATA = APP_DATA;
window.loadAllData = loadAllData;
window.getThermalConstants = getThermalConstants;
window.getStages = getStages;
window.getEgyptMonths = getEgyptMonths;
window.getCalendarData = getCalendarData;
window.getPlanCards = getPlanCards;
window.getSources = getSources;
window.getFAQ = getFAQ;
window.getSpreadReasons = getSpreadReasons;
window.getEconomicStats = getEconomicStats;
window.getEconomicCards = getEconomicCards;
window.getIPMData = getIPMData;
window.getResistanceData = getResistanceData;
window.getBioAgents = getBioAgents;