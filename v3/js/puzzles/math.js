'use strict';

const MathPuzzle = {
    last: '',
    limits: { 1: 20, 2: 50, 3: 100, 4: 100, 5: 100 },
    // Programme CE1 : tables de 2, 3, 4, 5 et 10 ; doubles jusqu'à 50
    doubles: { 1: 10, 2: 20, 3: 30, 4: 40, 5: 50 },
    tables: { 1: [], 2: [2, 5, 10], 3: [2, 3, 4, 5, 10], 4: [2, 3, 4, 5, 10], 5: [2, 3, 4, 5, 10] },

    // Retourne { html, answer } ; jamais deux fois la même question de suite
    generate(level) {
        const L = clamp(level, 1, 5);
        const kinds = ['add', 'sub', 'double'];
        if (this.tables[L].length) kinds.push('mul', 'mul');
        let q;
        do { q = this.make(pick(kinds), L); } while (q.html === this.last);
        this.last = q.html;
        return q;
    },

    make(kind, L) {
        const max = this.limits[L];
        if (kind === 'add') {
            const a = rand(2, max - 2), b = rand(1, max - a);
            return { html: `${a} + ${b}`, answer: a + b };
        }
        if (kind === 'sub') {
            const a = rand(3, max), b = rand(1, a - 1);
            return { html: `${a} − ${b}`, answer: a - b };
        }
        if (kind === 'mul') {
            const t = pick(this.tables[L]), k = rand(2, 10);
            return Math.random() < 0.5 ? { html: `${t} × ${k}`, answer: t * k } : { html: `${k} × ${t}`, answer: t * k };
        }
        const n = rand(2, this.doubles[L]);
        return { html: `Le double de ${n}`, answer: n * 2 };
    },

    start(body, level, finish) { buildNumeric(body, this.generate(level), finish); }
};
