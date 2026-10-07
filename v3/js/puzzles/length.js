'use strict';

// Mesures : lire une règle, choisir l'unité, convertir
const Length = {
    last: {},
    items: [
        ['Un crayon mesure environ 15', 'cm'], ['Une gomme mesure environ 4', 'cm'], ['Un cahier mesure environ 30', 'cm'], ['Une clé mesure environ 6', 'cm'], ['Un doigt mesure environ 7', 'cm'],
        ['Une porte mesure environ 2', 'm'], ['Un lit mesure environ 2', 'm'], ['Une salle de classe mesure environ 8', 'm'], ['Un grand arbre mesure environ 10', 'm'], ['Une piscine mesure environ 25', 'm'],
        ['La route jusqu’à la mer fait environ 100', 'km'], ['Un marathon mesure environ 42', 'km'], ['La distance entre deux villes est d’environ 50', 'km']
    ],

    ruler(n) {
        const U = 18, x0 = 8;
        let ticks = '';
        for (let i = 0; i <= 15; i++) {
            ticks += `<line x1="${x0 + i * U}" y1="40" x2="${x0 + i * U}" y2="${i % 5 === 0 ? 56 : 50}" stroke="#5a4410" stroke-width="1.4"/>
                <text x="${x0 + i * U}" y="66" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="800" font-size="9" fill="#5a4410">${i}</text>`;
        }
        const len = n * U, tip = Math.min(10, len / 2);
        return `<svg viewBox="0 0 ${x0 * 2 + 15 * U} 74" class="fig fig-ruler">
            <rect x="2" y="36" width="${x0 * 2 + 15 * U - 4}" height="34" rx="4" fill="#f2d98c" stroke="#8a6a1e" stroke-width="1.4"/>
            ${ticks}
            <path d="M${x0} 14 H${x0 + len - tip} L${x0 + len} 25 L${x0 + len - tip} 36 H${x0} Z" fill="#f2b84b" stroke="#8a5a1e" stroke-width="1.6" stroke-linejoin="round"/>
            <rect x="${x0}" y="14" width="10" height="22" fill="#e8737c" stroke="#8a3a3a" stroke-width="1.2"/>
            <path d="M${x0 + len - tip} 14 L${x0 + len} 25 L${x0 + len - tip} 36 Z" fill="#f4dcaa" stroke="#8a5a1e" stroke-width="1.2"/>
            <circle cx="${x0 + len}" cy="25" r="1.8" fill="#2b2a33"/></svg>`;
    },

    makeRuler(L) {
        const n = L === 1 ? rand(3, 10) : rand(2, 15);
        return { html: 'Combien mesure ce crayon ?', figure: this.ruler(n), answer: n, suffix: 'cm', noEq: true, small: true, key: 'r' + n };
    },

    makeConversion(L) {
        const options = [() => { const k = rand(1, 5); return { html: `${k} m = ?`, answer: k * 100, suffix: 'cm', key: 'm' + k }; }];
        if (L >= 5) {
            options.push(() => { const k = rand(1, 3); return { html: `${k} km = ?`, answer: k * 1000, suffix: 'm', key: 'k' + k }; });
            options.push(() => { const k = rand(1, 5); return { html: `${k * 100} cm = ?`, answer: k, suffix: 'm', key: 'c' + k }; });
        }
        const q = pick(options)();
        return Object.assign(q, { noEq: true });
    },

    startUnit(body, finish) {
        let [text, unit] = pick(this.items);
        if (text === this.last.u) [text, unit] = pick(this.items);
        this.last.u = text;
        buildChoices(body, {
            question: `${text} <span class="blank">…</span>`,
            choices: ['cm', 'm', 'km'].map(u => ({ html: u, correct: u === unit })),
            cols: 3, cls: 'sym', reveal: `${text} ${unit}`
        }, finish);
    },

    start(body, level, finish) {
        const L = clamp(level, 1, 5), r = Math.random();
        if (L <= 2) return buildNumeric(body, noRepeat(this.last, () => this.makeRuler(L)), finish);
        if (L === 3) return r < 0.3 ? buildNumeric(body, noRepeat(this.last, () => this.makeRuler(L)), finish) : this.startUnit(body, finish);
        if (L === 4) return r < 0.5 ? this.startUnit(body, finish) : buildNumeric(body, noRepeat(this.last, () => this.makeConversion(L)), finish);
        return r < 0.4 ? this.startUnit(body, finish) : buildNumeric(body, noRepeat(this.last, () => this.makeConversion(L)), finish);
    }
};
