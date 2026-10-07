'use strict';

// Clavier numérique partagé par les calculs et les fractions « moitié de… »
// q = { html, answer }
function buildNumeric(body, q, finish) {
    body.innerHTML = `
        <div class="question">${q.html} <span class="eq">= ?</span></div>
        <div class="answer-box" id="num-display"></div>
        <div class="feedback" id="num-feedback"></div>
        <div class="numpad">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-val="${n}">${n}</button>`).join('')}
            <button class="key key-del" id="num-del" aria-label="Effacer">⌫</button>
            <button class="key" data-val="0">0</button>
            <button class="key key-ok" id="num-ok">OK</button>
        </div>`;
    const display = body.querySelector('#num-display');
    const feedback = body.querySelector('#num-feedback');
    let input = '', locked = false;

    const refresh = () => { display.textContent = input; };
    const add = d => { if (locked || input.length >= 4) return; input += d; refresh(); sounds.tap(); };
    const del = () => { if (locked) return; input = input.slice(0, -1); refresh(); };
    const validate = () => {
        if (locked || input === '') return;
        locked = true;
        const ok = parseInt(input, 10) === q.answer;
        UI.cardFeedback(ok);
        if (ok) { sounds.puzzleWin(); feedback.textContent = 'Bravo !'; setTimeout(() => finish('win'), 800); }
        else { sounds.puzzleFail(); feedback.textContent = `La réponse était ${q.answer}`; setTimeout(() => finish('lose'), 1800); }
    };

    body.querySelectorAll('.key[data-val]').forEach(b => b.onclick = () => add(b.dataset.val));
    body.querySelector('#num-del').onclick = del;
    body.querySelector('#num-ok').onclick = validate;
    UI.modalKeys = e => {
        if (/^[0-9]$/.test(e.key)) add(e.key);
        else if (e.key === 'Backspace') del();
        else if (e.key === 'Enter') validate();
    };
}

const MathPuzzle = {
    last: '',
    limits: { 1: 20, 2: 50, 3: 100, 4: 100, 5: 100 },
    doubles: { 1: 10, 2: 20, 3: 50, 4: 100, 5: 100 },
    tables: { 1: [], 2: [2, 5, 10], 3: [2, 3, 4, 5], 4: [2, 3, 4, 5, 6, 7, 8, 9], 5: [2, 3, 4, 5, 6, 7, 8, 9, 10] },

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
