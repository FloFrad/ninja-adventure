'use strict';

// Comparer et ranger les nombres
const Compare = {
    last: {},

    // Deux nombres proches (mêmes chiffres parfois) pour les grands niveaux
    twoNumbers(max, close) {
        const a = rand(max > 20 ? 10 : 1, max);
        let b;
        if (close && a >= 100) { b = a + (Math.random() < 0.5 ? 1 : -1) * rand(1, 9) * (Math.random() < 0.5 ? 1 : 10); if (b < 100 || b > max) b = rand(100, max); }
        else b = rand(max > 20 ? 10 : 1, max);
        return [a, b];
    },

    startBiggest(body, L, finish) {
        let a, b;
        do { [a, b] = this.twoNumbers(20, false); } while (a === b);
        const big = Math.random() < 0.5;
        const answer = big ? Math.max(a, b) : Math.min(a, b);
        buildChoices(body, {
            question: `Quel est le nombre le plus <b>${big ? 'grand' : 'petit'}</b> ?`,
            choices: mixChoices(String(answer), [String(a === answer ? b : a)]),
            cols: 2, cls: 'bignum',
            reveal: `${answer} est le plus ${big ? 'grand' : 'petit'}`
        }, finish);
    },

    startSymbol(body, L, finish) {
        const max = L >= 5 ? 999 : 99;
        let a, b;
        if (Math.random() < 0.2) { a = rand(10, max); b = a; } else { [a, b] = this.twoNumbers(max, L >= 5); }
        const sym = a < b ? '<' : a > b ? '>' : '=';
        const all = ['<', '=', '>'];
        buildChoices(body, {
            question: `<span class="cmp">${a}</span> <span class="blank">?</span> <span class="cmp">${b}</span>`,
            choices: all.map(s => ({ html: s === '<' ? '&lt;' : s === '>' ? '&gt;' : '=', correct: s === sym })),
            cols: 3, cls: 'sym',
            reveal: `${a} ${sym === '<' ? '&lt;' : sym === '>' ? '&gt;' : '='} ${b}`
        }, finish);
    },

    startOrder(body, L, finish) {
        const n = L === 3 ? 3 : 4;
        const max = L >= 5 ? 999 : 99;
        const asc = Math.random() < 0.6;
        const nums = pickDistinct(Array.from({ length: 60 }, () => rand(L >= 5 ? 100 : 5, max)), n);
        const target = nums.slice().sort((x, y) => asc ? x - y : y - x);
        body.innerHTML = `
            <div class="question small">Range du <b>${asc ? 'plus petit au plus grand' : 'plus grand au plus petit'}</b></div>
            <div class="slots">${target.map(() => '<span class="slot"></span>').join('')}</div>
            <div class="feedback"></div>
            <div class="tiles">${nums.map((v, i) => `<button class="otile" data-i="${i}">${v}</button>`).join('')}</div>`;
        const slots = [...body.querySelectorAll('.slot')];
        const tiles = [...body.querySelectorAll('.otile')];
        const feedback = body.querySelector('.feedback');
        let next = 0, errors = 0, locked = false;

        const tap = i => {
            if (locked || tiles[i].disabled) return;
            if (nums[i] === target[next]) {
                tiles[i].disabled = true; tiles[i].classList.add('used');
                slots[next].textContent = nums[i]; slots[next].classList.add('filled');
                sounds.tap(); next++;
                if (next === target.length) {
                    locked = true; UI.cardFeedback(true); sounds.puzzleWin(); feedback.textContent = 'Bravo !';
                    setTimeout(() => finish('win'), 900);
                }
            } else {
                errors++; sounds.puzzleFail(); tiles[i].classList.add('wrong');
                setTimeout(() => tiles[i].classList.remove('wrong'), 450);
                feedback.textContent = errors >= 3 ? '' : `Essaie encore (${3 - errors} essai${3 - errors > 1 ? 's' : ''})`;
                if (errors >= 3) {
                    locked = true; UI.cardFeedback(false);
                    feedback.textContent = `Il fallait : ${target.join(' – ')}`;
                    setTimeout(() => finish('lose'), 2600);
                }
            }
        };
        tiles.forEach((t, i) => { t.onclick = () => tap(i); });
        UI.modalKeys = e => { const k = parseInt(e.key, 10); if (k >= 1 && k <= n) tap(k - 1); };
    },

    start(body, level, finish) {
        const L = clamp(level, 1, 5);
        if (L === 1) this.startBiggest(body, L, finish);
        else if (L === 2) this.startSymbol(body, L, finish);
        else if (L === 3 || L === 4) this.startOrder(body, L, finish);
        else (Math.random() < 0.5 ? this.startOrder : this.startSymbol).call(this, body, L, finish);
    }
};
