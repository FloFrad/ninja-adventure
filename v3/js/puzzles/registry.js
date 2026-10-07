'use strict';

// Catalogue des énigmes de la V3 : une seule source de vérité pour le menu,
// les parchemins sur la carte et la fenêtre d'énigme.
const CATEGORIES = [
    { id: 'maths', name: 'Mathématiques', icon: '🔢' },
    { id: 'francais', name: 'Français', icon: '📖' },
    { id: 'logique', name: 'Mémoire et logique', icon: '🧩' }
];

const PUZZLES = [
    // --- Mathématiques
    { id: 'math', cat: 'maths', icon: '➕', label: 'Calcul', desc: 'Additions, soustractions, tables, doubles', title: 'Énigme du Scribe', sub: 'Calcule vite !', glyph: '2+3', color: '#d63a3a', mod: () => MathPuzzle },
    { id: 'fraction', cat: 'maths', icon: '🍕', label: 'Fractions', desc: 'La moitié, le tiers, le quart', title: 'Les Parts du Sensei', sub: 'Les fractions n’ont plus de secret pour toi ?', glyph: '½', color: '#f08a24', mod: () => FractionPuzzle },
    { id: 'heure', cat: 'maths', icon: '🕐', label: 'Lire l’heure', desc: 'Heures, demies et quarts', title: 'L’Horloge du Temple', sub: 'Quelle heure est-il ?', glyph: '🕐', color: '#3b82c4', mod: () => Clock },
    { id: 'monnaie', cat: 'maths', icon: '💶', label: 'Les euros', desc: 'Compter les pièces, rendre la monnaie', title: 'Le Marchand', sub: 'Compte bien tes euros !', glyph: '€', color: '#2e9e5b', mod: () => Money },
    { id: 'suite', cat: 'maths', icon: '🔢', label: 'Suites de nombres', desc: 'Trouver le nombre manquant', title: 'La Suite Secrète', sub: 'Quel nombre manque ?', glyph: '2,4,?', color: '#8a5ad6', mod: () => Sequence },
    { id: 'comparer', cat: 'maths', icon: '⚖️', label: 'Comparer et ranger', desc: 'Plus grand, plus petit, ranger', title: 'La Balance du Sage', sub: 'Compare les nombres', glyph: '<>', color: '#d6a43a', mod: () => Compare },
    { id: 'dizaines', cat: 'maths', icon: '🧱', label: 'Dizaines et unités', desc: 'Les blocs de numération', title: 'Les Briques du Maître', sub: 'Dizaines et unités', glyph: 'D U', color: '#c96a3a', mod: () => Tens },
    { id: 'longueur', cat: 'maths', icon: '📏', label: 'Mesures', desc: 'La règle, cm, m et km', title: 'Le Ruban du Charpentier', sub: 'Mesure avec précision', glyph: 'cm', color: '#3aa6a0', mod: () => Length },
    { id: 'formes', cat: 'maths', icon: '🔺', label: 'Formes et symétrie', desc: 'Reconnaître et compléter', title: 'Les Formes du Moine', sub: 'Observe bien les formes', glyph: '△', color: '#e0587a', mod: () => Shapes },
    // --- Français
    { id: 'word', cat: 'francais', icon: '🗡️', label: 'Pendu', desc: 'Trouve le mot caché', title: 'Défi du Silence', sub: 'Trouve le mot caché', glyph: 'A_B', color: '#3b6fd6', mod: () => Hangman },
    { id: 'melange', cat: 'francais', icon: '🔀', label: 'Mot mélangé', desc: 'Remets les lettres dans l’ordre', title: 'Les Lettres Envolées', sub: 'Remets les lettres dans l’ordre', glyph: 'ABC', color: '#5a6fd6', mod: () => Scramble },
    { id: 'lettre', cat: 'francais', icon: '🔤', label: 'Lettre manquante', desc: 'Complète le mot', title: 'Le Mot Troué', sub: 'Quelle lettre manque ?', glyph: 'A_', color: '#2e86c1', mod: () => Missing },
    { id: 'homophone', cat: 'francais', icon: '✍️', label: 'a ou à ?', desc: 'a/à, et/est, son/sont, on/ont, ou/où', title: 'Le Scribe Étourdi', sub: 'Choisis le bon petit mot', glyph: 'a/à', color: '#c0392b', mod: () => Homophones },
    { id: 'pluriel', cat: 'francais', icon: '📚', label: 'Singulier et pluriel', desc: 'Un ninja, des ninjas…', title: 'Un ou Plusieurs ?', sub: 'Accorde le mot', glyph: '+s', color: '#16a085', mod: () => Plural },
    { id: 'conjugaison', cat: 'francais', icon: '🗣️', label: 'Conjugaison', desc: 'Le verbe au présent', title: 'Le Verbe du Maître', sub: 'Conjugue le verbe au présent', glyph: '-ons', color: '#8e44ad', mod: () => Conjugation },
    { id: 'syllabes', cat: 'francais', icon: '👏', label: 'Syllabes', desc: 'Combien de syllabes ?', title: 'Le Tambour des Syllabes', sub: 'Frappe dans tes mains !', glyph: 'sy-la', color: '#e67e22', mod: () => Syllables },
    // --- Mémoire et logique
    { id: 'morpion', cat: 'logique', icon: '⭕', label: 'Morpion', desc: 'Bats le Shinobi', title: 'Duel du Shinobi', sub: 'Bats le Shinobi au morpion', glyph: '#', color: '#2e9e5b', mod: () => TicTacToe },
    { id: 'memory', cat: 'logique', icon: '🃏', label: 'Memory', desc: 'Retrouve les paires', title: 'Les Cartes du Temple', sub: 'Retrouve toutes les paires', glyph: '🃏', color: '#d35d8a', mod: () => Memory },
    { id: 'labyrinthe', cat: 'logique', icon: '🧭', label: 'Labyrinthe', desc: 'Guide le ninja jusqu’au temple', title: 'Le Labyrinthe', sub: 'Trouve la sortie', glyph: '🧭', color: '#5d6d7e', mod: () => Maze },
    { id: 'intrus', cat: 'logique', icon: '🔍', label: 'L’intrus', desc: 'Lequel n’est pas comme les autres ?', title: 'L’Intrus', sub: 'Lequel n’est pas comme les autres ?', glyph: '?', color: '#b9770e', mod: () => OddOne }
];

const PUZZLE_BY_ID = Object.fromEntries(PUZZLES.map(p => [p.id, p]));
