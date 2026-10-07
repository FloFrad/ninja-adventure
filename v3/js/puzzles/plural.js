'use strict';

// Singulier et pluriel
const Plural = {
    last: {},
    // [singulier, pluriel, genre, famille]
    words: [
        ['ninja', 'ninjas', 'm', 's'], ['sabre', 'sabres', 'm', 's'], ['dragon', 'dragons', 'm', 's'], ['étoile', 'étoiles', 'f', 's'], ['flèche', 'flèches', 'f', 's'],
        ['masque', 'masques', 'm', 's'], ['village', 'villages', 'm', 's'], ['ami', 'amis', 'm', 's'], ['arbre', 'arbres', 'm', 's'], ['fleur', 'fleurs', 'f', 's'],
        ['temple', 'temples', 'm', 's'], ['tambour', 'tambours', 'm', 's'], ['lanterne', 'lanternes', 'f', 's'], ['montagne', 'montagnes', 'f', 's'],
        ['bateau', 'bateaux', 'm', 'x'], ['gâteau', 'gâteaux', 'm', 'x'], ['château', 'châteaux', 'm', 'x'], ['couteau', 'couteaux', 'm', 'x'], ['chapeau', 'chapeaux', 'm', 'x'], ['tableau', 'tableaux', 'm', 'x'],
        ['cheval', 'chevaux', 'm', 'aux'], ['animal', 'animaux', 'm', 'aux'], ['journal', 'journaux', 'm', 'aux'], ['hôpital', 'hôpitaux', 'm', 'aux'],
        ['souris', 'souris', 'f', 'inv'], ['bras', 'bras', 'm', 'inv'], ['nez', 'nez', 'm', 'inv'], ['voix', 'voix', 'f', 'inv']
    ],
    families: { 1: ['s'], 2: ['s'], 3: ['s', 'x'], 4: ['s', 'x', 'aux'], 5: ['s', 'x', 'aux', 'inv'] },

    // Mauvaises formes plausibles pour un mot
    wrongsFor(w, correct) {
        const cands = [w, w + 's', w + 'x', w + 'es', w.replace(/al$/, 'als'), w.replace(/eau$/, 'eaus'), w.replace(/al$/, 'aus'), w + 'z'];
        return pickDistinct(cands, 3, [correct]);
    },

    make(level) {
        const L = clamp(level, 1, 5);
        const fam = this.families[L];
        const [sing, plur, gender, family] = pick(this.words.filter(w => fam.includes(w[3])));
        const reverse = L >= 4 && Math.random() < (L === 4 ? 0.3 : 0.4);
        return { sing, plur, gender, family, reverse, key: sing + reverse };
    },

    start(body, level, finish) {
        const q = noRepeat(this.last, () => this.make(level));
        const art = q.gender === 'f' ? 'Une' : 'Un';
        if (!q.reverse) {
            buildChoices(body, {
                question: `${art} ${q.sing}, des <span class="blank">…</span>`,
                choices: mixChoices(q.plur, this.wrongsFor(q.sing, q.plur)), cols: 2, cls: 'wordchoice',
                reveal: `${art} ${q.sing}, des <b>${q.plur}</b>`
            }, finish);
        } else {
            const wrongs = pickDistinct([q.plur + 's', q.sing + 'e', q.sing.slice(0, -1), q.sing + 's', q.plur.replace(/x$/, '')], 3, [q.sing, q.plur]);
            buildChoices(body, {
                question: `Des ${q.plur}, ${art.toLowerCase()} <span class="blank">…</span>`,
                choices: mixChoices(q.sing, wrongs), cols: 2, cls: 'wordchoice',
                reveal: `Des ${q.plur}, ${art.toLowerCase()} <b>${q.sing}</b>`
            }, finish);
        }
    }
};
