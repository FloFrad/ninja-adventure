'use strict';

// Memory : retrouver toutes les paires
const Memory = {
    symbols: ['🥷', '🐉', '🍣', '⛩️', '🌸', '🎋', '🗡️', '🏯', '🐼', '🦊', '🐸', '🍙', '🎏', '🍡', '🌕', '🔔'],
    pairs: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 8 },
    cols: { 1: 3, 2: 4, 3: 5, 4: 4, 5: 4 },

    start(body, level, finish) {
        const L = clamp(level, 1, 5);
        const n = this.pairs[L], limit = n * 2 + 3;
        const cards = shuffle(shuffle(this.symbols).slice(0, n).flatMap(s => [s, s]));
        body.innerHTML = `
            <div class="question small">Retrouve toutes les paires</div>
            <div class="feedback" id="mem-status"></div>
            <div class="mem cols-${this.cols[L]}">${cards.map((s, i) => `<button class="mcard" data-i="${i}"><span class="mface front">?</span><span class="mface back">${s}</span></button>`).join('')}</div>`;
        const status = body.querySelector('#mem-status');
        const els = [...body.querySelectorAll('.mcard')];
        let open = [], found = 0, misses = 0, locked = false;
        const refresh = () => { status.textContent = `Erreurs : ${misses} / ${limit}`; };

        const flip = i => {
            if (locked || open.includes(i) || els[i].classList.contains('done')) return;
            els[i].classList.add('flipped'); open.push(i); sounds.tap();
            if (open.length < 2) return;
            const [a, b] = open; locked = true;
            if (cards[a] === cards[b]) {
                setTimeout(() => {
                    els[a].classList.add('done'); els[b].classList.add('done');
                    open = []; locked = false; found++; playSound(880, 'sine', 0.12, 0.15);
                    if (found === n) { UI.cardFeedback(true); sounds.puzzleWin(); status.textContent = 'Bravo !'; setTimeout(() => finish('win'), 900); }
                }, 350);
            } else {
                misses++; refresh();
                setTimeout(() => {
                    els[a].classList.remove('flipped'); els[b].classList.remove('flipped'); open = [];
                    if (misses >= limit) {
                        UI.cardFeedback(false); sounds.puzzleFail(); status.textContent = 'Trop d’erreurs… retente !';
                        els.forEach(e => e.classList.add('flipped')); setTimeout(() => finish('lose'), 1800);
                    } else locked = false;
                }, 800);
            }
        };
        els.forEach((e, i) => { e.onclick = () => flip(i); });
        UI.modalKeys = null;
        refresh();
    }
};
