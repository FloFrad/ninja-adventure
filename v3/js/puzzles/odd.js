'use strict';

// L'intrus : trouve ce qui n'appartient pas au groupe
const OddOne = {
    last: {},
    cats: [
        { id: 'ferme', group: 'animaux', name: 'des animaux de la ferme', items: ['🐄', '🐖', '🐑', '🐐', '🐴'] },
        { id: 'mer', group: 'animaux', name: 'des animaux de la mer', items: ['🐟', '🐙', '🦀', '🐬', '🐳'] },
        { id: 'oiseaux', group: 'animaux', name: 'des oiseaux', items: ['🦅', '🦉', '🐧', '🦜', '🐦'] },
        { id: 'fruits', group: 'nourriture', name: 'des fruits', items: ['🍎', '🍌', '🍇', '🍓', '🍒', '🍑'] },
        { id: 'legumes', group: 'nourriture', name: 'des légumes', items: ['🥕', '🥔', '🥦', '🧅', '🥬'] },
        { id: 'sucre', group: 'nourriture', name: 'des gâteries sucrées', items: ['🍰', '🍩', '🍪', '🍫', '🍬'] },
        { id: 'route', group: 'transport', name: 'des véhicules qui roulent', items: ['🚗', '🚌', '🚲', '🛵', '🚚'] },
        { id: 'aeromer', group: 'transport', name: 'des véhicules qui volent ou naviguent', items: ['✈️', '🚁', '⛵', '🚤', '🚢'] },
        { id: 'ecole', group: 'autre', name: 'des objets d’école', items: ['✏️', '📏', '📚', '✂️', '🖍️'] },
        { id: 'musique', group: 'autre', name: 'des instruments de musique', items: ['🥁', '🎸', '🎹', '🎻', '🎺'] },
        { id: 'meteo', group: 'autre', name: 'des météos', items: ['☀️', '🌧️', '❄️', '⛈️', '🌈'] },
        { id: 'habits', group: 'autre', name: 'des vêtements', items: ['👕', '👖', '🧦', '🧢', '👗', '🧤'] },
        { id: 'japon', group: 'autre', name: 'des choses du Japon', items: ['🗻', '⛩️', '🍣', '🎎', '🏯', '🥷'] }
    ],

    make(level) {
        const L = clamp(level, 1, 5);
        const main = pick(this.cats);
        const near = this.cats.filter(c => c.id !== main.id && c.group === main.group && main.group !== 'autre');
        const far = this.cats.filter(c => c.group !== main.group);
        const other = L >= 3 && near.length ? pick(near) : pick(far);
        const three = pickDistinct(main.items, 3);
        const intruder = pick(other.items);
        return { main, three, intruder, key: main.id + intruder };
    },

    start(body, level, finish) {
        const q = noRepeat(this.last, () => this.make(level));
        const choices = shuffle([...q.three.map(e => ({ html: e })), { html: q.intruder, correct: true }]);
        buildChoices(body, {
            question: 'Trouve l’intrus !',
            choices, cols: 2, cls: 'emoji',
            win: `Les autres sont ${q.main.name}`, reveal: `Les autres sont ${q.main.name}`
        }, finish);
    }
};
