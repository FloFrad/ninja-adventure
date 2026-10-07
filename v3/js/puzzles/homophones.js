'use strict';

// a/à, et/est, son/sont, on/ont, ou/où
const Homophones = {
    last: {},
    pairs: { 'a/à': ['a', 'à'], 'et/est': ['et', 'est'], 'son/sont': ['son', 'sont'], 'on/ont': ['on', 'ont'], 'ou/où': ['ou', 'où'] },
    // paires disponibles par niveau
    byLevel: { 1: ['a/à', 'et/est'], 2: ['a/à', 'et/est', 'son/sont'], 3: ['a/à', 'et/est', 'son/sont', 'on/ont'], 4: ['a/à', 'et/est', 'son/sont', 'on/ont', 'ou/où'], 5: ['a/à', 'et/est', 'son/sont', 'on/ont', 'ou/où'] },
    // [phrase, bonne réponse] — « ___ » marque le trou
    sentences: {
        'a/à': [
            ['Le ninja ___ un sabre.', 'a'], ['Le ninja va ___ l’école.', 'à'], ['Il ___ peur du dragon.', 'a'], ['Elle donne un shuriken ___ son ami.', 'à'],
            ['Le dragon ___ de grandes ailes.', 'a'], ['Nous allons ___ la montagne.', 'à'], ['Mon ami ___ très faim.', 'a'], ['Le samouraï parle ___ son maître.', 'à'],
            ['Le chat ___ sauté sur le toit.', 'a'], ['Je joue ___ cache-cache.', 'à'], ['Il pense ___ son village.', 'à'], ['Elle ___ gagné le combat.', 'a']
        ],
        'et/est': [
            ['Le ninja ___ rapide.', 'est'], ['Le ninja ___ le dragon se battent.', 'et'], ['Le temple ___ très grand.', 'est'], ['Il prend un arc ___ des flèches.', 'et'],
            ['Mon sabre ___ dans le coffre.', 'est'], ['J’aime les sushis ___ le riz.', 'et'], ['Le dragon ___ en colère.', 'est'], ['La nuit ___ noire.', 'est'],
            ['Le roi ___ la reine arrivent.', 'et'], ['Il ___ temps de partir.', 'est']
        ],
        'son/sont': [
            ['Le ninja prend ___ sabre.', 'son'], ['Les dragons ___ très forts.', 'sont'], ['Elle perd ___ masque.', 'son'], ['Mes amis ___ courageux.', 'sont'],
            ['Il aime ___ village.', 'son'], ['Les étoiles ___ brillantes.', 'sont'], ['Le héros range ___ costume.', 'son'], ['Les shurikens ___ dans la boîte.', 'sont'],
            ['Le chat suit ___ maître.', 'son'], ['Ils ___ partis à l’aube.', 'sont']
        ],
        'on/ont': [
            ['Les ninjas ___ des capes noires.', 'ont'], ['___ joue dans le jardin.', 'on'], ['Ils ___ gagné la partie.', 'ont'], ['___ mange des sushis.', 'on'],
            ['Les dragons ___ des écailles.', 'ont'], ['Demain, ___ ira au temple.', 'on'], ['Mes amis ___ faim.', 'ont']
        ],
        'ou/où': [
            ['Veux-tu du riz ___ des sushis ?', 'ou'], ['___ est le dragon ?', 'où'], ['Le ninja choisit l’arc ___ le sabre.', 'ou'], ['Voici le village ___ je vis.', 'où'],
            ['Tu pars à gauche ___ à droite ?', 'ou'], ['Je ne sais pas ___ est mon masque.', 'où']
        ]
    },

    make(level) {
        const pairName = pick(this.byLevel[clamp(level, 1, 5)]);
        const [sentence, answer] = pick(this.sentences[pairName]);
        return { pairName, sentence, answer, key: sentence };
    },

    start(body, level, finish) {
        const q = noRepeat(this.last, () => this.make(level));
        const cap = q.sentence.startsWith('___');
        const label = w => cap ? capitalize(w) : w;
        const full = q.sentence.replace('___', `<b>${label(q.answer)}</b>`);
        buildChoices(body, {
            question: q.sentence.replace('___', '<span class="blank">___</span>'),
            choices: this.pairs[q.pairName].map(w => ({ html: label(w), correct: w === q.answer })),
            cols: 2, cls: 'wordchoice', small: true,
            win: full, reveal: full
        }, finish);
    }
};
