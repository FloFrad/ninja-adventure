'use strict';

const PUZZLE_META = {
    math: { icon: '📜', title: 'Énigme du Scribe', sub: 'Calcule vite !', mod: () => MathPuzzle },
    fraction: { icon: '🍕', title: 'Les Parts du Sensei', sub: 'Les fractions n’ont plus de secret pour toi ?', mod: () => FractionPuzzle },
    word: { icon: '🗡️', title: 'Défi du Silence', sub: 'Trouve le mot caché', mod: () => Hangman },
    morpion: { icon: '⭕', title: 'Duel du Shinobi', sub: 'Bats le Shinobi au morpion', mod: () => TicTacToe }
};

const Puzzles = {
    // Types des parchemins d'un niveau : les 4 types + 1 supplémentaire, sans doublon voisin
    plan(level) {
        const forced = PARAMS.get('puzzle');
        if (forced && PUZZLE_META[forced]) return Array(CFG.puzzlesPerLevel).fill(forced);
        const base = ['math', 'fraction', 'word', 'morpion'];
        const extra = pick(['math', 'math', 'fraction', 'word', 'morpion']);
        let arr, tries = 0;
        do { arr = shuffle(base.concat(extra)); tries++; }
        while (tries < 60 && arr.some((t, i) => i > 0 && t === arr[i - 1]));
        return arr;
    },

    open(type, level, done) {
        const meta = PUZZLE_META[type];
        const body = UI.openModal(meta);
        meta.mod().start(body, level, result => { UI.closeModal(); done(result); });
    }
};
