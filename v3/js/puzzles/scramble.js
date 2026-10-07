'use strict';

// Mot mélangé : remettre les lettres dans l'ordre
const Scramble = {
    used: [],
    lengths: { 1: [3, 4], 2: [4, 5], 3: [5, 6], 4: [5, 7], 5: [6, 8] },
    maxTries: 3,

    pickEntry(level) {
        let free = Hangman.entries.filter(e => !this.used.includes(e.w));
        if (!free.length) { this.used = []; free = Hangman.entries; }
        const [lo, hi] = this.lengths[clamp(level, 1, 5)];
        const fit = free.filter(e => e.w.length >= lo && e.w.length <= hi);
        const e = pick(fit.length ? fit : free);
        this.used.push(e.w);
        return e;
    },

    start(body, level, finish) {
        const entry = this.pickEntry(level), word = entry.w;
        let letters, guard = 0;
        do { letters = shuffle([...word]); guard++; } while (letters.join('') === word && guard < 30);
        let typed = [], tries = this.maxTries, locked = false;

        body.innerHTML = `
            <div class="hint-line">Indice : <b>${entry.hint}</b></div>
            <div class="slots big" id="sc-slots">${[...word].map(() => '<span class="slot"></span>').join('')}</div>
            <div class="feedback" id="sc-feedback"></div>
            <div class="tiles" id="sc-tiles">${letters.map((l, i) => `<button class="otile letter" data-i="${i}">${l}</button>`).join('')}</div>
            <div class="row-actions"><button class="btn-mini dark" id="sc-undo">↶ Effacer</button></div>`;
        const slots = [...body.querySelectorAll('.slot')];
        const tiles = [...body.querySelectorAll('.otile')];
        const feedback = body.querySelector('#sc-feedback');
        const used = Array(letters.length).fill(false);   // tuile utilisée ?
        const order = [];                                // indices de tuiles dans l'ordre choisi

        const render = () => {
            slots.forEach((s, i) => { s.textContent = order[i] !== undefined ? letters[order[i]] : ''; s.classList.toggle('filled', order[i] !== undefined); });
            tiles.forEach((t, i) => { t.disabled = used[i]; t.classList.toggle('used', used[i]); });
        };
        const place = i => {
            if (locked || used[i]) return;
            used[i] = true; order.push(i); sounds.tap(); render();
            if (order.length === word.length) check();
        };
        const undo = () => {
            if (locked || !order.length) return;
            used[order.pop()] = false; render();
        };
        const check = () => {
            const attempt = order.map(i => letters[i]).join('');
            if (attempt === word) {
                locked = true; UI.cardFeedback(true); sounds.puzzleWin(); feedback.textContent = 'Bravo !';
                setTimeout(() => finish('win'), 900);
                return;
            }
            tries--; sounds.puzzleFail();
            if (tries <= 0) {
                locked = true; UI.cardFeedback(false); feedback.textContent = `Le mot était : ${word}`;
                setTimeout(() => finish('lose'), 2500);
                return;
            }
            feedback.textContent = `Ce n’est pas ça, essaie encore (${tries} essai${tries > 1 ? 's' : ''})`;
            slots.forEach(s => s.classList.add('bad'));
            locked = true;
            setTimeout(() => { order.length = 0; used.fill(false); slots.forEach(s => s.classList.remove('bad')); locked = false; render(); }, 700);
        };

        tiles.forEach((t, i) => { t.onclick = () => place(i); });
        body.querySelector('#sc-undo').onclick = undo;
        UI.modalKeys = e => {
            if (e.key === 'Backspace') return undo();
            const l = e.key.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
            if (/^[A-Z]$/.test(l)) { const i = letters.findIndex((x, k) => x === l && !used[k]); if (i >= 0) place(i); }
        };
        render();
    }
};
