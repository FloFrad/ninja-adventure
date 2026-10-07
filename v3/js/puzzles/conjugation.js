'use strict';

// Conjugaison au présent : verbes en -er, être, avoir, aller, faire
const Conjugation = {
    last: {},
    // 0 je, 1 tu, 2 il/elle, 3 nous, 4 vous, 5 ils/elles
    subjects: [
        ['Je'], ['Tu'], ['Il', 'Elle', 'Le ninja', 'Le dragon', 'Mon ami', 'Le sensei'],
        ['Nous'], ['Vous'], ['Ils', 'Elles', 'Les ninjas', 'Les dragons', 'Mes amis', 'Les villageois']
    ],
    erVerbs: [
        { inf: 'sauter', stem: 'saut', comp: ['très haut', 'sur le toit'] }, { inf: 'chanter', stem: 'chant', comp: ['une chanson'] },
        { inf: 'regarder', stem: 'regard', comp: ['le ciel', 'la lune'] }, { inf: 'marcher', stem: 'march', comp: ['dans la forêt', 'vers le temple'] },
        { inf: 'danser', stem: 'dans', comp: ['sous la lune'] }, { inf: 'jouer', stem: 'jou', comp: ['au morpion', 'dans le jardin'] },
        { inf: 'parler', stem: 'parl', comp: ['doucement'] }, { inf: 'porter', stem: 'port', comp: ['un masque'] },
        { inf: 'trouver', stem: 'trouv', comp: ['un trésor'] }, { inf: 'garder', stem: 'gard', comp: ['le village'] }
    ],
    irregular: {
        être: { forms: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], comp: ['en colère', 'au village', 'dans le temple', 'en retard', 'ici'] },
        avoir: { forms: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], comp: ['un sabre', 'faim', 'peur', 'un masque', 'un trésor'] },
        aller: { forms: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], comp: ['au temple', 'à l’école', 'au village', 'à la montagne'] },
        faire: { forms: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], comp: ['du bruit', 'un gâteau', 'un dessin', 'un feu'] }
    },
    erEndings: ['e', 'es', 'e', 'ons', 'ez', 'ent'],

    verbPool(L) {
        const er = this.erVerbs.map(v => ({ inf: v.inf, forms: this.erEndings.map(e => v.stem + e), comp: v.comp }));
        const irr = n => ({ inf: n, forms: this.irregular[n].forms, comp: this.irregular[n].comp });
        if (L <= 2) return er;
        if (L === 3) return er.concat([irr('être'), irr('avoir')]);
        if (L === 4) return er.concat([irr('être'), irr('avoir'), irr('aller')]);
        return er.concat([irr('être'), irr('avoir'), irr('aller'), irr('faire')]);
    },

    make(level) {
        const L = clamp(level, 1, 5);
        const verb = pick(this.verbPool(L));
        const person = L === 1 ? pick([2, 5]) : rand(0, 5);
        const form = verb.forms[person];
        let subj = pick(this.subjects[person]);
        if (person === 0 && /^[aeiouh]/i.test(form)) subj = 'J’';
        const comp = pick(verb.comp);
        return { verb, person, form, subj, comp, key: verb.inf + person + comp };
    },

    start(body, level, finish) {
        const q = noRepeat(this.last, () => this.make(level));
        const wrongs = pickDistinct(q.verb.forms, 3, [q.form]);
        const sep = q.subj.endsWith('’') ? '' : ' ';
        const full = `${q.subj}${sep}<b>${q.form}</b> ${q.comp}.`;
        buildChoices(body, {
            question: `${q.subj}${sep}<span class="blank">___</span> <small class="inf">(${q.verb.inf})</small> ${q.comp}.`,
            choices: mixChoices(q.form, wrongs), cols: 2, cls: 'wordchoice', small: true,
            win: full, reveal: full
        }, finish);
    }
};
