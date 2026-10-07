'use strict';

// Suites de nombres : trouver le nombre manquant
const Sequence = {
    last: {},
    cfg: {
        1: { steps: [1, 2, 5, 10], desc: false, cap: 50, hide: [2, 3, 4] },
        2: { steps: [2, 5, 10], desc: false, cap: 100, hide: [2, 3, 4] },
        3: { steps: [2, 3, 4, 5, 10], desc: true, cap: 100, hide: [1, 2, 3, 4] },
        4: { steps: [2, 3, 4, 5, 10, 20], desc: true, cap: 150, hide: [0, 1, 2, 3, 4] },
        5: { steps: [2, 3, 4, 5, 6, 10, 20, 25, 50], desc: true, cap: 300, hide: [0, 1, 2, 3, 4] }
    },

    // Renvoie { terms:[5 nombres], hidden:index }
    make(level) {
        const c = this.cfg[clamp(level, 1, 5)];
        const step = pick(c.steps);
        const down = c.desc && Math.random() < 0.4;
        let start;
        if (down) start = rand(step * 4, Math.max(step * 4, c.cap));
        else start = rand(0, Math.max(0, c.cap - step * 4));
        const terms = Array.from({ length: 5 }, (_, i) => down ? start - i * step : start + i * step);
        const hidden = pick(c.hide);
        return { terms, hidden, step, down, key: terms.join(',') + hidden };
    },

    start(body, level, finish) {
        const q = noRepeat(this.last, () => this.make(level));
        const html = q.terms.map((t, i) => i === q.hidden ? '<span class="blank">?</span>' : `<span class="num">${t}</span>`).join('<span class="sep">·</span>');
        buildNumeric(body, { html: `<small class="qlabel">Quel nombre manque ?</small><div class="seq">${html}</div>`, answer: q.terms[q.hidden], noEq: true }, finish);
    }
};
