'use strict';

// Formes : reconnaître, compter les côtés, compléter une figure symétrique
const Shapes = {
    last: {},
    colors: ['#f08a24', '#3b82c4', '#2e9e5b', '#d6568a', '#8a5ad6', '#e0b02e'],
    defs: {
        cercle: { name: 'un cercle', sides: 0 },
        carré: { name: 'un carré', sides: 4 },
        rectangle: { name: 'un rectangle', sides: 4 },
        triangle: { name: 'un triangle', sides: 3 },
        losange: { name: 'un losange', sides: 4 },
        pentagone: { name: 'un pentagone', sides: 5 },
        hexagone: { name: 'un hexagone', sides: 6 }
    },

    shape(kind, color) {
        const s = `fill="${color}" stroke="#2b2a33" stroke-width="3" stroke-linejoin="round"`;
        const poly = (n, r, rot) => Array.from({ length: n }, (_, i) => {
            const a = (rot + i * 360 / n) * Math.PI / 180;
            return `${(60 + r * Math.cos(a)).toFixed(1)},${(60 + r * Math.sin(a)).toFixed(1)}`;
        }).join(' ');
        let el;
        if (kind === 'cercle') el = `<circle cx="60" cy="60" r="42" ${s}/>`;
        else if (kind === 'carré') el = `<rect x="22" y="22" width="76" height="76" ${s}/>`;
        else if (kind === 'rectangle') el = `<rect x="10" y="32" width="100" height="56" ${s}/>`;
        else if (kind === 'triangle') el = `<polygon points="60,16 106,98 14,98" ${s}/>`;
        else if (kind === 'losange') el = `<polygon points="60,10 106,60 60,110 14,60" ${s}/>`;
        else if (kind === 'pentagone') el = `<polygon points="${poly(5, 46, -90)}" ${s}/>`;
        else el = `<polygon points="${poly(6, 46, 0)}" ${s}/>`;
        return `<svg viewBox="0 0 120 120" class="fig fig-shape">${el}</svg>`;
    },

    startName(body, L, finish) {
        const pool = L <= 2 ? ['cercle', 'carré', 'triangle', 'rectangle'] : ['cercle', 'carré', 'triangle', 'rectangle', 'losange'];
        const kind = pick(pool);
        const others = pickDistinct(pool, 3, [kind]);
        buildChoices(body, {
            question: 'Comment s’appelle cette forme ?',
            figure: this.shape(kind, pick(this.colors)),
            choices: mixChoices(capitalize(this.defs[kind].name.replace(/^un /, '')), others.map(k => capitalize(k))),
            cols: 2, cls: 'wordchoice', reveal: `C’était ${this.defs[kind].name}`
        }, finish);
    },

    startSides(body, L, finish) {
        const pool = L >= 4 ? ['triangle', 'carré', 'rectangle', 'losange', 'pentagone', 'hexagone'] : ['triangle', 'carré', 'rectangle', 'losange'];
        const kind = pick(pool), n = this.defs[kind].sides;
        const wrongs = pickDistinct([3, 4, 5, 6, 7, 8], 3, [n]);
        buildChoices(body, {
            question: 'Combien de côtés a cette forme ?',
            figure: this.shape(kind, pick(this.colors)),
            choices: mixChoices(String(n), wrongs.map(String)), cols: 4, cls: 'sym',
            reveal: `${capitalize(this.defs[kind].name)} a ${n} côtés`
        }, finish);
    },

    // ----- Symétrie : grille dont on connaît la moitié gauche
    grid(cells, hc, rows, cell, axis = true, color = '#3b82c4') {
        const cols = hc * 2, w = cols * cell, h = rows * cell;
        let out = `<rect x="0" y="0" width="${w}" height="${h}" fill="#fff7e6" stroke="#7a4a26" stroke-width="2"/>`;
        for (let c = 1; c < cols; c++) out += `<line x1="${c * cell}" y1="0" x2="${c * cell}" y2="${h}" stroke="rgba(122,74,38,.2)"/>`;
        for (let r = 1; r < rows; r++) out += `<line x1="0" y1="${r * cell}" x2="${w}" y2="${r * cell}" stroke="rgba(122,74,38,.2)"/>`;
        cells.forEach(([c, r]) => { out += `<rect x="${c * cell + 1}" y="${r * cell + 1}" width="${cell - 2}" height="${cell - 2}" rx="2" fill="${color}"/>`; });
        if (axis) out += `<line x1="${hc * cell}" y1="-4" x2="${hc * cell}" y2="${h + 4}" stroke="#d63a3a" stroke-width="2.4" stroke-dasharray="5 4"/>`;
        return `<svg viewBox="-3 -6 ${w + 6} ${h + 12}" class="fig fig-sym">${out}</svg>`;
    },

    startSymmetry(body, L, finish) {
        const hc = 3, rows = L >= 5 ? 4 : 3;
        for (let attempt = 0; attempt < 40; attempt++) {
            const left = [];
            for (let c = 0; c < hc; c++) for (let r = 0; r < rows; r++) if (Math.random() < 0.45) left.push([c, r]);
            if (left.length < 3 || left.length > hc * rows - 3) continue;
            const mirror = ([c, r]) => [2 * hc - 1 - c, r];
            const variants = {
                correct: left.map(mirror),
                copy: left.map(([c, r]) => [c + hc, r]),
                flip: left.map(([c, r]) => mirror([c, rows - 1 - r])),
                odd: (() => { const m = left.map(mirror); const k = rand(0, m.length - 1); m.splice(k, 1); return m; })()
            };
            const sig = v => v.map(p => p.join('.')).sort().join('|');
            if (new Set(Object.values(variants).map(sig)).size < 4) continue;
            const options = shuffle(Object.entries(variants)).map(([k, right]) => ({
                html: this.grid(left.concat(right), hc, rows, 12, false), correct: k === 'correct'
            }));
            return buildChoices(body, {
                question: 'Complète le dessin pour qu’il soit <b>symétrique</b>',
                figure: this.grid(left, hc, rows, 24, true),
                choices: options, cols: 2, cls: 'symchoice',
                reveal: 'L’axe rouge est un miroir : la partie droite est le reflet de la gauche'
            }, finish);
        }
        this.startName(body, 3, finish);
    },

    start(body, level, finish) {
        const L = clamp(level, 1, 5), r = Math.random();
        if (L === 1) return this.startName(body, L, finish);
        if (L === 2) return r < 0.7 ? this.startName(body, L, finish) : this.startSides(body, L, finish);
        if (L === 3) return r < 0.5 ? this.startName(body, L, finish) : this.startSides(body, L, finish);
        if (L === 4) return r < 0.4 ? this.startSides(body, L, finish) : this.startSymmetry(body, L, finish);
        return r < 0.35 ? this.startSides(body, L, finish) : this.startSymmetry(body, L, finish);
    }
};
