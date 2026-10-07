'use strict';

// Combien de syllabes ? (uniquement des mots sans « e » muet ambigu)
const Syllables = {
    last: {},
    words: [
        'CHAT', 'LOUP', 'OURS', 'PAIN', 'FEU', 'VENT', 'CIEL', 'ROI', 'ARC', 'SAC', 'MER', 'RIZ', 'LIT',
        'NIN-JA', 'DRA-GON', 'PAN-DA', 'SU-SHI', 'TAM-BOUR', 'SER-PENT', 'CHE-VAL', 'LA-PIN', 'SO-LEIL', 'FO-RÊT', 'JAR-DIN', 'DO-JO', 'SEN-SEI',
        'GÂ-TEAU', 'BA-TEAU', 'MAI-SON', 'CAS-TOR', 'MAR-TEAU', 'DAU-PHIN', 'BON-BON', 'BAL-LON', 'CHA-PEAU',
        'SA-MOU-RAÏ', 'KI-MO-NO', 'PA-PIL-LON', 'É-LÉ-PHANT', 'CHO-CO-LAT', 'ES-CAR-GOT', 'CHAM-PI-GNON', 'KAN-GOU-ROU', 'A-BRI-COT', 'A-NA-NAS', 'CI-NÉ-MA', 'A-NI-MAL', 'PO-LI-CIER',
        'O-RI-GA-MI', 'OR-DI-NA-TEUR', 'TÉ-LÉ-VI-SION', 'AL-LI-GA-TOR'
    ].map(s => ({ word: s.replace(/-/g, ''), split: s, n: s.split('-').length })),
    range: { 1: [1, 2], 2: [1, 3], 3: [2, 3], 4: [2, 4], 5: [3, 4] },

    make(level) {
        const [lo, hi] = this.range[clamp(level, 1, 5)];
        const w = pick(this.words.filter(x => x.n >= lo && x.n <= hi));
        return Object.assign({ key: w.word }, w);
    },

    start(body, level, finish) {
        const q = noRepeat(this.last, () => this.make(level));
        buildChoices(body, {
            question: `Combien de syllabes dans <span class="bigword">${q.word}</span> ?`,
            choices: [1, 2, 3, 4].map(n => ({ html: String(n), correct: n === q.n })),
            cols: 4, cls: 'sym',
            win: `${q.split.replace(/-/g, ' · ')} : ${q.n} syllabe${q.n > 1 ? 's' : ''}`,
            reveal: `${q.split.replace(/-/g, ' · ')} : ${q.n} syllabe${q.n > 1 ? 's' : ''}`
        }, finish);
    }
};
