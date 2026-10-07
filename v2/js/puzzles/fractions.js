'use strict';

const FractionPuzzle = {
    sets: {
        1: [[1, 2]],
        2: [[1, 2], [1, 4]],
        3: [[1, 2], [1, 4], [3, 4], [1, 3]],
        4: [[1, 2], [1, 4], [3, 4], [1, 3], [2, 3]],
        5: [[1, 2], [1, 4], [3, 4], [1, 3], [2, 3]]
    },
    pool: [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5]],
    last: '',

    start(body, level, finish) {
        const L = clamp(level, 1, 5);
        const numericChance = L < 3 ? 0 : (L === 3 ? 0.4 : 0.5);
        if (Math.random() < numericChance) buildNumeric(body, this.numericQuestion(L), finish);
        else this.visual(body, L, finish);
    },

    // « Le quart de 20 = ? »
    numericQuestion(L) {
        const kinds = L === 3 ? ['half'] : ['half', 'quarter', 'third'];
        let q;
        do {
            const kind = pick(kinds);
            if (kind === 'half') { const a = rand(2, L === 3 ? 20 : 50) * 2; q = { label: 'La moitié', n: a, answer: a / 2, f: [1, 2] }; }
            else if (kind === 'quarter') { const a = rand(2, L === 4 ? 10 : 25) * 4; q = { label: 'Le quart', n: a, answer: a / 4, f: [1, 4] }; }
            else { const a = rand(2, L === 4 ? 12 : 20) * 3; q = { label: 'Le tiers', n: a, answer: a / 3, f: [1, 3] }; }
            q.html = `${q.label} de ${q.n}`;
        } while (q.html === this.last);
        this.last = q.html;
        return { html: `${q.html} <small class="hintfrac">(${fracHTML(q.f[0], q.f[1])} de ${q.n})</small>`, answer: q.answer };
    },

    figure(num, den) {
        const start = rand(0, den - 1), colored = i => ((i - start + den) % den) < num;
        const fill = i => colored(i) ? '#f08a24' : '#fff7e6';
        if (Math.random() < 0.5) {
            // camembert
            let paths = '';
            for (let i = 0; i < den; i++) {
                const a0 = -Math.PI / 2 + i * 2 * Math.PI / den, a1 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / den;
                const p = (a) => `${60 + 52 * Math.cos(a)} ${60 + 52 * Math.sin(a)}`;
                paths += den === 1 ? '' : `<path d="M60 60 L${p(a0)} A52 52 0 0 1 ${p(a1)} Z" fill="${fill(i)}" stroke="#7a4a26" stroke-width="3" stroke-linejoin="round"/>`;
            }
            return `<svg viewBox="0 0 120 120" class="fig fig-pie">${paths}<circle cx="60" cy="60" r="52" fill="none" stroke="#7a4a26" stroke-width="4"/></svg>`;
        }
        // barre
        const w = 200 / den;
        let rects = '';
        for (let i = 0; i < den; i++) rects += `<rect x="${10 + i * w}" y="10" width="${w}" height="50" fill="${fill(i)}" stroke="#7a4a26" stroke-width="3" stroke-linejoin="round"/>`;
        return `<svg viewBox="0 0 220 70" class="fig fig-bar">${rects}</svg>`;
    },

    visual(body, L, finish) {
        const set = this.sets[L];
        let f;
        do { f = pick(set); } while (set.length > 1 && f.join('/') === this.last);
        this.last = f.join('/');
        const distractors = shuffle(this.pool.filter(p => p[0] / p[1] !== f[0] / f[1])).slice(0, 3);
        const choices = shuffle([f, ...distractors]);
        body.innerHTML = `
            <div class="question">Quelle fraction est coloriée ?</div>
            <div class="fig-wrap">${this.figure(f[0], f[1])}</div>
            <div class="feedback" id="fr-feedback"></div>
            <div class="choices">${choices.map((c, i) => `<button class="choice" data-i="${i}">${fracHTML(c[0], c[1])}</button>`).join('')}</div>`;
        let locked = false;
        const buttons = body.querySelectorAll('.choice');
        buttons.forEach((b, i) => b.onclick = () => {
            if (locked) return; locked = true;
            const ok = choices[i] === f;
            b.classList.add(ok ? 'right' : 'wrong');
            if (!ok) buttons[choices.indexOf(f)].classList.add('right');
            UI.cardFeedback(ok);
            body.querySelector('#fr-feedback').textContent = ok ? 'Bravo !' : `C’était ${f[0]}/${f[1]}`;
            if (ok) { sounds.puzzleWin(); setTimeout(() => finish('win'), 800); }
            else { sounds.puzzleFail(); setTimeout(() => finish('lose'), 1800); }
        });
        UI.modalKeys = e => { const n = parseInt(e.key, 10); if (n >= 1 && n <= 4) buttons[n - 1].click(); };
    }
};
