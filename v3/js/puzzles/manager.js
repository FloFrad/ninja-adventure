'use strict';

const Puzzles = {
    // Types d'énigmes activés dans le menu de départ
    enabled: PUZZLES.map(p => p.id),

    setEnabled(ids) {
        const valid = ids.filter(id => PUZZLE_BY_ID[id]);
        this.enabled = valid.length ? valid : PUZZLES.map(p => p.id);
    },

    // Types des parchemins d'un niveau : on pioche dans les types activés, sans doublon voisin
    plan(level) {
        const forced = PARAMS.get('puzzle');
        if (forced && PUZZLE_BY_ID[forced]) return Array(CFG.puzzlesPerLevel).fill(forced);
        const ids = this.enabled;
        let arr, tries = 0;
        do {
            arr = []; let bag = [];
            while (arr.length < CFG.puzzlesPerLevel) {
                if (!bag.length) bag = shuffle(ids);
                arr.push(bag.pop());
            }
            tries++;
        } while (ids.length > 1 && tries < 80 && arr.some((t, i) => i > 0 && t === arr[i - 1]));
        return arr;
    },

    open(type, level, done) {
        const meta = PUZZLE_BY_ID[type];
        const body = UI.openModal(meta);
        meta.mod().start(body, level, result => { UI.closeModal(); done(result); });
    }
};
