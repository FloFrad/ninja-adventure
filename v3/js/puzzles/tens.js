'use strict';

// Dizaines et unités : blocs de numération
const Tens = {
    last: {},

    // Dessine h centaines (plaques), d dizaines (barres) et u unités (cubes)
    blocks(h, d, u) {
        let x = 4, out = '';
        for (let i = 0; i < h; i++) {
            out += `<rect x="${x}" y="8" width="46" height="46" fill="#f4c26b" stroke="#8a5a1e" stroke-width="1.6"/>`;
            for (let k = 1; k < 10; k++) out += `<path d="M${x + k * 4.6} 8V54M${x} ${8 + k * 4.6}H${x + 46}" stroke="#8a5a1e" stroke-width=".6"/>`;
            x += 54;
        }
        for (let i = 0; i < d; i++) {
            out += `<rect x="${x}" y="8" width="10" height="46" fill="#7bc4e8" stroke="#2d6d8f" stroke-width="1.4"/>`;
            for (let k = 1; k < 10; k++) out += `<path d="M${x} ${8 + k * 4.6}H${x + 10}" stroke="#2d6d8f" stroke-width=".6"/>`;
            x += 15;
        }
        if (u) x += 8;
        for (let i = 0; i < u; i++) {
            const cx = x + Math.floor(i / 5) * 15, cy = 8 + (i % 5) * 10;
            out += `<rect x="${cx}" y="${cy}" width="10" height="10" fill="#ef8a8a" stroke="#a03a3a" stroke-width="1.2"/>`;
        }
        const width = x + Math.ceil(u / 5) * 15 + 4;
        return `<svg viewBox="0 0 ${Math.max(width, 80)} 62" class="fig fig-tens">${out}</svg>`;
    },

    makeCount(L) {
        const max = L === 1 ? 39 : L === 2 ? 69 : 99;
        const n = rand(11, max);
        return { html: 'Quel nombre représentent ces blocs ?', figure: this.blocks(0, Math.floor(n / 10), n % 10), answer: n, noEq: true, small: true, key: 'c' + n };
    },

    makeHundreds() {
        const n = rand(101, 399);
        return { html: 'Quel nombre représentent ces blocs ?', figure: this.blocks(Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10), answer: n, noEq: true, small: true, key: 'h' + n };
    },

    // « Dans 47, combien de dizaines et d'unités ? » (choix)
    startDecompose(body, L, finish) {
        let d, u;
        do { d = rand(1, 9); u = rand(0, 9); } while (d === u);
        const n = d * 10 + u;
        const fmt = (a, b) => `${a} dizaine${a > 1 ? 's' : ''} et ${b} unité${b > 1 ? 's' : ''}`;
        const wrongs = pickDistinct([fmt(u, d), fmt(d, d), fmt(u, u), fmt(Math.min(9, d + 1), u), fmt(d, Math.min(9, u + 1))], 3, [fmt(d, u)]);
        buildChoices(body, {
            question: `Dans <b>${n}</b>, combien y a-t-il de dizaines et d’unités ?`,
            choices: mixChoices(fmt(d, u), wrongs), cols: 1, cls: 'wordchoice',
            reveal: `${n} = ${fmt(d, u)}`
        }, finish);
    },

    // « Quel est le chiffre des dizaines dans 74 ? » (numérique)
    makeDigit(L) {
        const three = L >= 5;
        const n = three ? rand(101, 999) : rand(11, 99);
        const places = three ? [['centaines', 100], ['dizaines', 10], ['unités', 1]] : [['dizaines', 10], ['unités', 1]];
        const [name, div] = pick(places);
        return { html: `Quel est le chiffre des <b>${name}</b> dans <b>${n}</b> ?`, answer: Math.floor(n / div) % 10, noEq: true, small: true, key: n + name };
    },

    start(body, level, finish) {
        const L = clamp(level, 1, 5), r = Math.random();
        if (L === 1) return buildNumeric(body, noRepeat(this.last, () => this.makeCount(1)), finish);
        if (L === 2) return r < 0.3 ? this.startDecompose(body, L, finish) : buildNumeric(body, noRepeat(this.last, () => this.makeCount(2)), finish);
        if (L === 3) return r < 0.6 ? this.startDecompose(body, L, finish) : buildNumeric(body, noRepeat(this.last, () => this.makeCount(3)), finish);
        if (L === 4) return r < 0.4 ? this.startDecompose(body, L, finish) : buildNumeric(body, noRepeat(this.last, () => this.makeDigit(4)), finish);
        return buildNumeric(body, noRepeat(this.last, () => r < 0.4 ? this.makeHundreds() : this.makeDigit(5)), finish);
    }
};
