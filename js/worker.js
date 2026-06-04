// ============================================
// Web Worker - Tuta Absoluta Thermal Calculations
// يقوم بحسابات النموذج الحراري في الخلفية لمنع تجميد واجهة المستخدم
// ============================================

self.onmessage = function(e) {
    const { type, payload } = e.data;

    if (type === 'CALCULATE_DAYS') {
        const { T, T0, TH, K } = payload;
        const result = calculateDays(T, T0, TH, K);
        self.postMessage({ type: 'CALCULATION_RESULT', payload: result });
    }
};

function calculateDays(T, T0, TH, K) {
    if (T <= T0 || T >= TH) {
        return { egg: -1, larva: -1, pupa: -1, adult: -1, dev: -1, gen: -1 };
    }
    
    const dE = K.egg / (T - T0);
    const dL = K.larva / (T - T0);
    const dP = K.pupa / (T - T0);
    
    let dA = T <= 30 ? 24 - 0.8 * (T - 10) : Math.max(4, 8 - (T - 30) * 0.5);
    
    const dev = Math.round((dE + dL + dP) * 10) / 10;
    const gen = Math.round((dE + dL + dP + dA) * 10) / 10;
    
    return { 
        egg: Math.round(dE * 10) / 10, 
        larva: Math.round(dL * 10) / 10, 
        pupa: Math.round(dP * 10) / 10, 
        adult: Math.round(dA * 10) / 10, 
        dev, 
        gen 
    };
}

console.log('[Worker] Thermal Calculation Worker is ready.');