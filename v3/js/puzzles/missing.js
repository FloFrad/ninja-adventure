'use strict';

// Lettre manquante : « DRA_ON »
const Missing = {
    last: {},
    lengths: { 1: [3, 5], 2: [4, 6], 3: [5, 7], 4: [5, 8], 5: [6, 9] },
    vowels: [...'AEIOU'],
    consonants: [...'BCDFGLMNPRST'],

    make(level) {
        const L = clamp(level, 1, 5);
        const [lo, hi] = this.lengths[L];
        const fit = Hangman.entries.filter(e => e.w.length >= lo && e.w.length <= hi);
        const entry = pick(fit);
        const idxs = [...entry.w].map((c, i) => i).filter(i => L <= 2 ? this.vowels.includes(entry.w[i]) : true);
        const idx = pick(idxs.length ? idxs : [...entry.w].map((c, i) => i));
        const letter = entry.w[idx];
        const isVowel = this.vowels.includes(letter);
        const pool = isVowel ? this.vowels : this.consonants;
        const count = L === 1 ? 3 : L <= 3 ? 4 : 5;
        const wrongs = pickDistinct(pool.concat(L >= 4 ? [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] : []), count - 1, [letter]);
        return { entry, idx, letter, wrongs, count, key: entry.w + idx };
    },

    start(body, level, finish) {
        const q = noRepeat(this.last, () => this.make(level));
        const word = q.entry.w;
        const tiles = [...word].map((c, i) => `<span class="tile ${i === q.idx ? 'blank' : ''}">${i === q.idx ? '?' : c}</span>`).join('');
        buildChoices(body, {
            question: `Quelle lettre manque ?<div class="word">${tiles}</div><div class="hint-line">Indice : <b>${q.entry.hint}</b></div>`,
            choices: mixChoices(q.letter, q.wrongs), cols: q.count, cls: 'letter',
            reveal: `Le mot est ${word}`
        }, finish);
    }
};
