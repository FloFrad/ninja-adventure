'use strict';

// Lire l'heure : horloge -> heure écrite, ou heure écrite -> bonne horloge
const Clock = {
    last: {},

    svg(h, m, full = true) {
        const hourAng = ((h % 12) + m / 60) * 30 * Math.PI / 180;
        const minAng = m * 6 * Math.PI / 180;
        const pt = (ang, len) => `${(50 + len * Math.sin(ang)).toFixed(2)} ${(50 - len * Math.cos(ang)).toFixed(2)}`;
        let marks = '';
        for (let i = 1; i <= 12; i++) {
            const a = i * 30 * Math.PI / 180;
            marks += `<line x1="${(50 + 41 * Math.sin(a)).toFixed(1)}" y1="${(50 - 41 * Math.cos(a)).toFixed(1)}" x2="${(50 + 46 * Math.sin(a)).toFixed(1)}" y2="${(50 - 46 * Math.cos(a)).toFixed(1)}" stroke="#7a4a26" stroke-width="${i % 3 === 0 ? 3 : 1.6}" stroke-linecap="round"/>`;
            if (full || i % 3 === 0) {
                marks += `<text x="${(50 + 32 * Math.sin(a)).toFixed(1)}" y="${(50 - 32 * Math.cos(a)).toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-family="Nunito, sans-serif" font-weight="900" font-size="${full ? 11 : 12}" fill="#2b2a33">${i}</text>`;
            }
        }
        return `<svg viewBox="0 0 100 100" class="fig fig-clock">
            <circle cx="50" cy="50" r="48" fill="#fff7e6" stroke="#7a4a26" stroke-width="4"/>
            ${marks}
            <line x1="50" y1="50" x2="${pt(hourAng, 21).split(' ')[0]}" y2="${pt(hourAng, 21).split(' ')[1]}" stroke="#d63a3a" stroke-width="5.5" stroke-linecap="round"/>
            <line x1="50" y1="50" x2="${pt(minAng, 33).split(' ')[0]}" y2="${pt(minAng, 33).split(' ')[1]}" stroke="#2b2a33" stroke-width="3.2" stroke-linecap="round"/>
            <circle cx="50" cy="50" r="3.6" fill="#2b2a33"/></svg>`;
    },

    text(h, m) { return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`; },

    // Tirage d'une heure et de 3 autres heures différentes
    make(level) {
        const L = clamp(level, 1, 5);
        const minutes = L === 1 ? [0] : L === 2 ? [0, 30] : [0, 15, 30, 45];
        const rev = Math.random() < (L < 3 ? 0 : L === 3 ? 0.3 : 0.5);
        const times = new Map();
        while (times.size < 4) { const t = [rand(1, 12), pick(minutes)]; times.set(t.join(':'), t); }
        const list = [...times.values()];
        return { rev, answer: list[0], others: list.slice(1), key: list[0].join(':') + rev };
    },

    start(body, level, finish) {
        const q = noRepeat(this.last, () => this.make(level));
        const [h, m] = q.answer;
        if (!q.rev) {
            buildChoices(body, {
                question: 'Quelle heure est-il ?',
                figure: this.svg(h, m),
                choices: mixChoices(this.text(h, m), q.others.map(t => this.text(t[0], t[1]))),
                cols: 2, cls: 'timechoice',
                reveal: `Il est ${this.text(h, m)}`
            }, finish);
        } else {
            buildChoices(body, {
                question: `Quelle horloge indique <b>${this.text(h, m)}</b> ?`,
                choices: mixChoices(this.svg(h, m, false), q.others.map(t => this.svg(t[0], t[1], false))),
                cols: 2, cls: 'clockchoice',
                reveal: `Il fallait l’horloge qui indique ${this.text(h, m)}`
            }, finish);
        }
    }
};
